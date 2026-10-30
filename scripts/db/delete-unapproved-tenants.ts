// scripts/db/delete-unapproved-tenants.ts
//
// Remove cleaning companies that signed themselves up (the retired
// /join/company form) but were never approved, together with their company
// accounts. Built for the bot sign-ups of Sep–Oct 2026.
//
//   DATABASE_URL=postgres://… tsx scripts/db/delete-unapproved-tenants.ts          # dry run
//   DATABASE_URL=postgres://… tsx scripts/db/delete-unapproved-tenants.ts --apply
//
// A company is removed only when it is not the platform owner, not APPROVED,
// and owns nothing: no bookings, services, pricing, cleaners or applications.
// Its member accounts go with it only when they are TENANT_ADMIN or CUSTOMER,
// belong to no other company, and have no bookings, payments or subscriptions.
// Everything else is reported and left alone. Deleting the company removes its
// member and document rows; deleting a user removes their sessions, keys,
// addresses and reset tokens (all ON DELETE CASCADE).
//
// Afterwards it deletes the companies' uploaded documents from S3 (prefix
// tenant-documents/<id>/) when S3_BUCKET_NAME and AWS_S3_* are set.
//
// Take a backup first (pg_dump). No dotenv on purpose: a local .env points at
// the development database, so the target must be given explicitly.
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import postgres from "postgres";

const apply = process.argv.includes("--apply");
const databaseUrl = process.env.DATABASE_URL?.trim();
if (!databaseUrl) {
  console.error("Set DATABASE_URL to the database to clean up.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

async function deleteTenantDocuments(tenantIds: string[]) {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket || !process.env.AWS_S3_ACCESS_KEY_ID) {
    console.log("S3 not configured here: skipping document clean-up (check tenant-documents/<id>/ by hand).");
    return;
  }
  const s3 = new S3Client({
    region: process.env.AWS_S3_REGION || "af-south-1",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY || "",
    },
  });

  for (const id of tenantIds) {
    const listed = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: `tenant-documents/${id}/` }));
    const keys = (listed.Contents ?? []).flatMap((o) => (o.Key ? [{ Key: o.Key }] : []));
    if (keys.length === 0) continue;
    await s3.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: keys } }));
    console.log(`Deleted ${keys.length} document(s) for company ${id}`);
  }
}

async function main() {
  const tenants = await sql<{ id: string; name: string; verification_status: string; created_at: Date }[]>`
    SELECT t.id, t.name, t.verification_status, t.created_at
    FROM tenant t
    WHERE NOT t.is_platform_owner
      AND t.verification_status <> 'APPROVED'
      AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.tenant_id = t.id)
      AND NOT EXISTS (SELECT 1 FROM service s WHERE s.tenant_id = t.id)
      AND NOT EXISTS (SELECT 1 FROM pricing_config p WHERE p.tenant_id = t.id)
      AND NOT EXISTS (SELECT 1 FROM cleaner_profile c WHERE c.tenant_id = t.id)
      AND NOT EXISTS (SELECT 1 FROM cleaner_application a WHERE a.tenant_id = t.id)
    ORDER BY t.created_at`;

  if (tenants.length === 0) {
    console.log("No unapproved companies to remove.");
    return;
  }
  const tenantIds = tenants.map((t) => t.id);

  const members = await sql<{ id: string; role: string; removable: boolean }[]>`
    SELECT u.id, u.role,
      (u.role IN ('TENANT_ADMIN', 'CUSTOMER')
        AND NOT EXISTS (SELECT 1 FROM tenant_member o WHERE o.user_id = u.id AND o.tenant_id <> ALL(${tenantIds}))
        AND NOT EXISTS (SELECT 1 FROM booking b WHERE b.user_id = u.id OR b.cleaner_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM payment p WHERE p.user_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM subscription s WHERE s.user_id = u.id OR s.cleaner_id = u.id)
        AND NOT EXISTS (SELECT 1 FROM tenant v WHERE v.verified_by = u.id)
      ) AS removable
    FROM "user" u
    WHERE u.id IN (SELECT m.user_id FROM tenant_member m WHERE m.tenant_id = ANY(${tenantIds}))`;

  const userIds = members.filter((m) => m.removable).map((m) => m.id);
  const kept = members.filter((m) => !m.removable);

  console.log(`${apply ? "Removing" : "Would remove"} ${tenants.length} compan${tenants.length === 1 ? "y" : "ies"}:`);
  for (const t of tenants) {
    console.log(`  ${t.name} (${t.verification_status}, signed up ${t.created_at.toISOString().slice(0, 10)})`);
  }
  console.log(`${apply ? "Removing" : "Would remove"} ${userIds.length} member account(s).`);
  for (const k of kept) {
    console.log(`  Keeping member ${k.id} (${k.role}): has other data or roles`);
  }

  if (!apply) {
    console.log("\nDry run. Re-run with --apply to delete.");
    return;
  }

  await sql.begin(async (tx) => {
    await tx`DELETE FROM tenant WHERE id = ANY(${tenantIds})`;
    if (userIds.length) await tx`DELETE FROM "user" WHERE id = ANY(${userIds})`;
  });
  console.log("Database rows deleted.");

  await deleteTenantDocuments(tenantIds);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());

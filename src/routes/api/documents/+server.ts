// src/routes/api/documents/+server.ts
import { s3 } from "$lib/server/s3";
import { db } from "$lib/server/db";
import { cleanerApplication, tenantDocument } from "$lib/server/db/schema";
import { tenantService } from "$lib/server/services/tenant.service";
import { error, redirect } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "./$types";

/**
 * Serve a stored document through a short-lived signed URL.
 *
 * Identity documents, permits and bank letters must not be reachable by anyone
 * who happens to have the object URL. Callers ask for the document by the
 * record that owns it, we check they are entitled to see it, and only then do
 * we mint a URL that expires.
 *
 * Access:
 *   - platform admins see everything
 *   - a company admin sees only their own company's documents
 */
const URL_TTL_SECONDS = 300; // long enough to open, short enough not to be shared

export const GET: RequestHandler = async ({ url, locals }) => {
  const user = locals.user;
  if (!user) throw error(401, "Sign in to view documents");

  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id");
  if (!kind || !id) throw error(400, "Missing document reference");

  const isPlatformAdmin = user.role === "ADMIN";
  let fileUrl: string | null = null;

  if (kind === "tenant-document") {
    const [doc] = await db
      .select()
      .from(tenantDocument)
      .where(eq(tenantDocument.id, id))
      .limit(1);
    if (!doc) throw error(404, "Document not found");

    // A company may see its own; nobody else's
    if (!isPlatformAdmin && locals.tenant?.id !== doc.tenantId) {
      throw error(403, "That document belongs to another company");
    }
    fileUrl = doc.fileUrl;
  } else if (kind === "cleaner-work-auth") {
    const [application] = await db
      .select()
      .from(cleanerApplication)
      .where(eq(cleanerApplication.id, id))
      .limit(1);
    if (!application) throw error(404, "Application not found");

    // Applications are reviewed by the platform, or by the company they are for
    if (!isPlatformAdmin && locals.tenant?.id !== application.tenantId) {
      throw error(403, "That application belongs to another company");
    }
    fileUrl = application.workAuthDocumentUrl;
  } else {
    throw error(400, "Unknown document type");
  }

  if (!fileUrl) throw error(404, "No document uploaded");

  const key = s3.getKeyFromUrl(fileUrl);
  if (!key) throw error(500, "Could not resolve that document");

  throw redirect(302, await s3.getSignedUrl(key, URL_TTL_SECONDS));
};

// src/routes/api/tenant/documents/+server.ts
import { s3 } from "$lib/server/s3";
import { tenantService } from "$lib/server/services/tenant.service";
import { error, json } from "@sveltejs/kit";
import mime from "mime-types";
import { nanoid } from "nanoid";
import type { RequestHandler } from "./$types";

const VALID_TYPES = tenantService.requiredDocuments.map((d) => d.type) as readonly string[];

// Verification documents are IDs and bank letters, so keep them modest and
// limited to the formats a company would actually scan or photograph.
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["application/pdf", "image/jpeg", "image/png", "image/heic", "image/webp"];

/**
 * A company uploads one of its own verification documents.
 *
 * Scoped to the caller's own tenant from the session rather than an id in the
 * request, so one company cannot write documents onto another.
 */
export const POST: RequestHandler = async ({ request, locals }) => {
  const tenantId = locals.tenant?.id;
  if (!locals.user || !tenantId) {
    throw error(403, "You must be signed in as a company admin");
  }

  const formData = await request.formData();
  const documentType = formData.get("type")?.toString();
  const file = formData.get("document");

  if (!documentType || !VALID_TYPES.includes(documentType)) {
    throw error(400, "Unknown document type");
  }
  if (!file || !(file instanceof File)) {
    throw error(400, "No document file provided");
  }
  if (file.size > MAX_BYTES) {
    throw error(400, "That file is larger than 10MB");
  }

  const contentType =
    file.type || mime.lookup(file.name) || "application/octet-stream";
  if (!ALLOWED.includes(contentType)) {
    throw error(400, "Upload a PDF or an image");
  }

  const extension = mime.extension(contentType) || file.name.split(".").pop() || "bin";
  const key = `tenant-documents/${tenantId}/${documentType.toLowerCase()}-${nanoid(8)}.${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileUrl = await s3.uploadFile(buffer, key, contentType);

  await tenantService.saveDocument(
    tenantId,
    documentType as (typeof VALID_TYPES)[number] as any,
    fileUrl,
    file.name,
  );

  const tenant = await tenantService.getById(tenantId);
  return json({
    success: true,
    fileUrl,
    fileName: file.name,
    verificationStatus: tenant?.verificationStatus,
  });
};

/**
 * Remove one of the caller's own documents, so a wrong file can be replaced.
 */
export const DELETE: RequestHandler = async ({ request, locals }) => {
  const tenantId = locals.tenant?.id;
  if (!locals.user || !tenantId) {
    throw error(403, "You must be signed in as a company admin");
  }

  const { type } = await request.json();
  if (!type || !VALID_TYPES.includes(type)) {
    throw error(400, "Unknown document type");
  }

  await tenantService.deleteDocument(tenantId, type);

  const tenant = await tenantService.getById(tenantId);
  return json({ success: true, verificationStatus: tenant?.verificationStatus });
};

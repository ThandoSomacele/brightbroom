// src/routes/api/admin/applications/[id]/status/+server.ts
import { cleanerApplicationService } from "$lib/server/services/cleaner-application.service";
import { error, json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

/**
 * API endpoint for approving or rejecting cleaner applications
 * POST: Approve or reject an application
 */
export const POST: RequestHandler = async ({ request, params, locals }) => {
  // Check authorization
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw error(403, "Unauthorized access");
  }
  
  const applicationId = params.id;
  
  if (!applicationId) {
    throw error(400, "Application ID is required");
  }
  
  try {
    const requestData = await request.json();
    const action = requestData.action;
    const reason = requestData.reason || "";
    
    if (!action || !["approve", "reject"].includes(action)) {
      throw error(400, "Invalid action. Must be 'approve' or 'reject'");
    }
    
    let result;
    
    if (action === "approve") {
      result = await cleanerApplicationService.approveApplication(applicationId);
    } else {
      result = await cleanerApplicationService.rejectApplication(applicationId, reason);
    }
    
    if (!result.success) {
      return json({
        success: false,
        message: result.message
      }, { status: 400 });
    }
    
    return json({
      success: true,
      message: result.message,
      userId: result.userId
    });
  } catch (err) {
    console.error('Error processing application:', { applicationId, error: err });
    throw error(500, {
      message: err instanceof Error ? err.message : "Failed to process application"
    });
  }
};

/**
 * API endpoint for adding notes to cleaner applications
 * PATCH: Add notes to an application
 */
export const PATCH: RequestHandler = async ({ request, params, locals }) => {
  // Check authorization
  if (!locals.user || locals.user.role !== "ADMIN") {
    throw error(403, "Unauthorized access");
  }
  
  const applicationId = params.id;
  
  if (!applicationId) {
    throw error(400, "Application ID is required");
  }
  
  try {
    const requestData = await request.json();
    const notes = requestData.notes;
    
    if (!notes) {
      throw error(400, "Notes content is required");
    }
    
    const result = await cleanerApplicationService.addNotes(applicationId, notes);
    
    if (!result.success) {
      return json({
        success: false,
        message: result.message
      }, { status: 400 });
    }
    
    return json({
      success: true,
      message: result.message
    });
  } catch (err) {
    console.error('Error adding notes to application:', { applicationId, error: err });
    throw error(500, {
      message: err instanceof Error ? err.message : "Failed to add notes"
    });
  }
};

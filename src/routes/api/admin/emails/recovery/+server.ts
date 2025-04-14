// src/routes/api/admin/emails/recovery/+server.ts
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { emailRecoveryService } from "$lib/server/services/email-recovery.service";

export const POST: RequestHandler = async ({ request, locals }) => {
  // Check if user is admin
  if (!locals.user || locals.user.role !== "ADMIN") {
    return json({ error: "Unauthorized" }, { status: 403 });
  }
  
  try {
    const data = await request.json();
    const hoursBack = data?.hoursBack || 24;
    
    const result = await emailRecoveryService.checkMissedEmails(hoursBack);
    
    return json({
      success: true,
      result
    });
  } catch (error) {
    console.error("Error running email recovery:", error);
    return json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
};

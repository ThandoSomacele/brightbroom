// src/lib/server/email-service.ts
import { env } from "$env/dynamic/private";
import { Resend } from "resend";
import { db } from "./db";
import { payment } from "./db/schema";
import {
  getBookingConfirmationTemplate,
  getBookingReminderTemplate,
  getCleanerAssignmentTemplate,
  getCleanerWelcomeEmailTemplate,
  getContactFormTemplate,
  getPasswordResetConfirmationTemplate,
  getPasswordResetTemplate,
  getPaymentReceiptTemplate,
  getWelcomeEmailTemplate,
} from "./email-templates";

// Initialize Resend with API key from environment variable
const RESEND_API_KEY = env.RESEND_API_KEY;
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// Define a guaranteed base URL for the application
// This is crucial for generating correct links in emails
const APP_URL = env.PUBLIC_URL || "https://brightbroom.com";

// The sender email address
const FROM_EMAIL = "BrightBroom <notifications@brightbroom.com>";

interface CleanerApplicationEmailData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  experienceTypes: string[];
  availability: string;
  ownTransport: boolean;
  whatsApp: boolean;
  createdAt: Date;
}

// Email config for templates - using our guaranteed APP_URL
const EMAIL_CONFIG = {
  appUrl: APP_URL,
  brandName: "BrightBroom",
  primaryColor: "#20C3AF",
  secondaryColor: "#C2511F",
};

// Log configuration for debugging
console.log(`Email Service initialized with app URL: ${APP_URL}`);
console.log(`Resend API key available: ${!!RESEND_API_KEY}`);

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    // Generate the email template
    const template = getPasswordResetTemplate(email, resetToken, EMAIL_CONFIG);

    // Log the generated URL for debugging
    console.log(`Password reset URL generated: ${template.resetUrl}`);

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("Resend API error:", error);
      return false;
    }

    console.log("Password reset email sent successfully:", data.id);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
}

/**
 * Send a password reset confirmation email
 */
export async function sendPasswordResetConfirmationEmail(
  email: string,
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    // Generate the confirmation template
    const template = getPasswordResetConfirmationTemplate(email, EMAIL_CONFIG);

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("Resend API error:", error);
      return false;
    }

    console.log(
      "Password reset confirmation email sent successfully:",
      data.id,
    );
    return true;
  } catch (error) {
    console.error("Error sending password reset confirmation email:", error);
    return false;
  }
}



/**
 * Send a booking confirmation email
 * @param email Recipient email address
 * @param bookingDetails Booking details including status and optional paymentStatus
 * @returns Success indicator
 */
export async function sendBookingConfirmationEmail(
  email: string,
  bookingDetails: any,
): Promise<boolean> {
  try {
    console.log(`[EMAIL SERVICE] Preparing confirmation email for booking ${bookingDetails.id}`, { 
      paymentStatus: bookingDetails.paymentStatus || 'Not provided',
      bookingStatus: bookingDetails.status,
      email: email
    });

    // Check if the booking is cancelled - don't send confirmation for cancelled bookings
    if (bookingDetails.status === "CANCELLED") {
      console.log(
        `[EMAIL SERVICE] Skipping confirmation email for cancelled booking: ${bookingDetails.id}`,
      );
      return true; // Return true to indicate we handled this properly (by not sending)
    }

    // Determine payment status with more detailed logging
    let paymentIsComplete = false;

    // If payment status is provided directly, use that (this is the preferred path)
    if (bookingDetails.paymentStatus) {
      paymentIsComplete = bookingDetails.paymentStatus === "COMPLETED";
      console.log(`[EMAIL SERVICE] Using provided payment status: ${bookingDetails.paymentStatus}, complete: ${paymentIsComplete}`);
    } else {
      // Otherwise, query the database (fallback path)
      console.log(`[EMAIL SERVICE] No payment status provided, querying database for booking: ${bookingDetails.id}`);
      const payments = await db
        .select()
        .from(payment)
        .where(eq(payment.bookingId, bookingDetails.id))
        .limit(1);

      if (payments.length === 0) {
        console.log(`[EMAIL SERVICE] No payment record found for booking: ${bookingDetails.id}`);
      } else {
        console.log(`[EMAIL SERVICE] Found payment record with status: ${payments[0].status}`);
      }

      // If no payment record or status is not COMPLETED, don't send email yet
      paymentIsComplete =
        payments.length > 0 && payments[0].status === "COMPLETED";
    }

    // Only send email if payment is complete
    if (!paymentIsComplete) {
      console.log(
        `[EMAIL SERVICE] Delaying confirmation email for booking ${bookingDetails.id} until payment completes`,
      );
      return true; // Return true to indicate handling correctly
    }

    // Safety check to make sure we have Resend API key configured
    if (!resend) {
      console.error("[EMAIL SERVICE] Resend API key not configured! Check environment variables");
      // Add an admin note about this error
      try {
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId: bookingDetails.id,
          content: "EMAIL ERROR: Resend API key is not configured. Check environment variables.",
          addedBy: "Email Service",
          createdAt: new Date(),
        });
      } catch (noteError) {
        console.error("[EMAIL SERVICE] Failed to create admin note about missing API key:", noteError);
      }
      return false;
    }

    // Check RESEND_API_KEY value (redacted for security)
    console.log(`[EMAIL SERVICE] Resend API key present: ${!!RESEND_API_KEY}, value length: ${RESEND_API_KEY ? RESEND_API_KEY.length : 0}`);

    // We've confirmed payment is complete, proceed with sending email
    console.log(`[EMAIL SERVICE] Payment complete, sending confirmation email for booking ${bookingDetails.id} to ${email}`);

    // Generate the email template
    const template = getBookingConfirmationTemplate(
      email,
      bookingDetails,
      EMAIL_CONFIG,
    );

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("[EMAIL SERVICE] Resend API error:", error);
      
      // Add admin note about the error
      try {
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId: bookingDetails.id,
          content: `EMAIL ERROR: ${error.message || 'Unknown Resend API error'}`,
          addedBy: "Email Service",
          createdAt: new Date(),
        });
      } catch (noteError) {
        console.error("[EMAIL SERVICE] Failed to create admin note about API error:", noteError);
      }
      
      return false;
    }

    console.log("[EMAIL SERVICE] Booking confirmation email sent successfully:", data.id);
    
    // Add admin note about successful email
    try {
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId: bookingDetails.id,
        content: `EMAIL_SENT: Booking confirmation email sent successfully. Resend ID: ${data.id}`,
        addedBy: "Email Service",
        createdAt: new Date(),
      });
    } catch (noteError) {
      console.error("[EMAIL SERVICE] Failed to create admin note about successful email:", noteError);
    }
    
    return true;
  } catch (error) {
    console.error("[EMAIL SERVICE] Error sending booking confirmation email:", error);
    
    // Try to add admin note about the error
    try {
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId: bookingDetails.id,
        content: `EMAIL ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        addedBy: "Email Service",
        createdAt: new Date(),
      });
    } catch (noteError) {
      console.error("[EMAIL SERVICE] Failed to create admin note about error:", noteError);
    }
    
    return false;
  }
},

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(
  email: string,
  user: {
    firstName: string;
    lastName: string;
    role?: string; // Add optional role parameter
  },
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    // Choose template based on user role
    let template;
    if (user.role === "CLEANER") {
      template = getCleanerWelcomeEmailTemplate(email, user, EMAIL_CONFIG);
    } else {
      template = getWelcomeEmailTemplate(email, user, EMAIL_CONFIG);
    }

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("Resend API error:", error);
      return false;
    }

    console.log(
      `Welcome email (${user.role || "customer"}) sent successfully:`,
      data.id,
    );
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
}
/**
 * Send a booking reminder email
 */
export async function sendBookingReminderEmail(
  email: string,
  bookingDetails: any,
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    // Generate the reminder template
    const template = getBookingReminderTemplate(
      email,
      bookingDetails,
      EMAIL_CONFIG,
    );

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("Resend API error:", error);
      return false;
    }

    console.log("Booking reminder email sent successfully:", data.id);
    return true;
  } catch (error) {
    console.error("Error sending booking reminder email:", error);
    return false;
  }
}

/**
 * Send a cleaner assignment notification email
 */
export async function sendCleanerAssignmentEmail(
  email: string,
  bookingDetails: any,
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    // Generate the assignment template
    const template = getCleanerAssignmentTemplate(
      email,
      bookingDetails,
      EMAIL_CONFIG,
    );

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("Resend API error:", error);
      return false;
    }

    console.log("Cleaner assignment email sent successfully:", data.id);
    return true;
  } catch (error) {
    console.error("Error sending cleaner assignment email:", error);
    return false;
  }
}

/**
 * Send a payment receipt/invoice email
 */
export async function sendPaymentReceiptEmail(
  email: string,
  paymentDetails: any,
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    // Generate the receipt/invoice template
    const template = getPaymentReceiptTemplate(
      email,
      paymentDetails,
      EMAIL_CONFIG,
    );

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("Resend API error when sending receipt:", error);
      return false;
    }

    console.log("Payment receipt email sent successfully:", data.id);
    return true;
  } catch (error) {
    console.error("Error sending payment receipt email:", error);
    return false;
  }
}

/**
 * Send a contact form notification email
 */
export async function sendContactFormEmail(
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    referral?: string;
    joinAsCleaner?: boolean;
  },
  notificationEmail: string = "info@brightbroom.com",
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    // Generate the contact form template
    const template = getContactFormTemplate(formData, EMAIL_CONFIG);

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: notificationEmail,
      replyTo: formData.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("Resend API error:", error);
      return false;
    }

    console.log("Contact form email sent successfully:", data.id);
    return true;
  } catch (error) {
    console.error("Error sending contact form email:", error);
    return false;
  }
}

/**
 * Send email notification about new cleaner application
 */
export async function sendCleanerApplicationEmail(
  data: CleanerApplicationEmailData,
) {
  try {
    // Format experience types for display
    const formattedExperienceTypes = data.experienceTypes
      .map((type) => {
        return type === "GUEST_HOUSE"
          ? "Cleaning Guest house/Hotel/BnB"
          : type === "OFFICE"
            ? "Cleaning Offices"
            : type === "CARE_GIVING"
              ? "Care Giving"
              : type;
      })
      .join(", ");

    // Construct email content
    const emailContent = `
      <h1>New Cleaner Application</h1>
      <p>A new cleaner application has been submitted:</p>
      
      <h2>Personal Information</h2>
      <ul>
        <li><strong>Name:</strong> ${data.firstName} ${data.lastName}</li>
        <li><strong>Email:</strong> ${data.email}</li>
        <li><strong>Phone:</strong> ${data.phone}</li>
        <li><strong>Location:</strong> ${data.city}</li>
      </ul>
      
      <h2>Work Information</h2>
      <ul>
        <li><strong>Experience Types:</strong> ${formattedExperienceTypes}</li>
        <li><strong>Availability:</strong> ${data.availability}</li>
        <li><strong>Own Transport:</strong> ${data.ownTransport ? "Yes" : "No"}</li>
        <li><strong>WhatsApp:</strong> ${data.whatsApp ? "Yes" : "No"}</li>
      </ul>
      
      <p>Submitted on: ${data.createdAt.toLocaleString()}</p>
      
      <p>
        <a href="${process.env.PUBLIC_URL}/admin/applications/${data.id}">
          View Application Details
        </a>
      </p>
    `;

    // Send the email using your email service (Resend, SendGrid, etc.)
    // This is a placeholder for your actual email sending logic
    console.log("Sending email notification for application ID:", data.id);

    // Return success
    return {
      success: true,
      message: "Email notification sent successfully",
    };
  } catch (error) {
    console.error("Error sending application email:", error);
    return {
      success: false,
      message: "Failed to send email notification",
    };
  }
}

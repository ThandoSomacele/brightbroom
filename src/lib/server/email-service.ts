// src/lib/server/email-service.ts
import { env } from "$env/dynamic/private";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "./db";
import { adminNote, payment } from "./db/schema";
import {
  getBookingConfirmationTemplate,
  getBookingReminderTemplate,
  getCleanerApplicationTemplate,
  getCleanerAssignmentTemplate,
  getCleanerChangedTemplate,
  getCleanerJobAssignmentTemplate,
  getCleanerWelcomeEmailTemplate,
  getContactFormTemplate,
  getPasswordResetConfirmationTemplate,
  getPasswordResetTemplate,
  getPaymentReceiptTemplate,
  getWelcomeEmailTemplate,
} from "./email-templates";

// Initialise Resend with API key from environment variable
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
console.log(`Email Service Initialised with app URL: ${APP_URL}`);
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
    console.log("[EMAIL SERVICE] Preparing confirmation email for booking", {
      bookingId: bookingDetails.id,
      paymentStatus: bookingDetails.paymentStatus || "Not provided",
      bookingStatus: bookingDetails.status,
      email: email,
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
      console.log(
        `[EMAIL SERVICE] Using provided payment status: ${bookingDetails.paymentStatus}, complete: ${paymentIsComplete}`,
      );
    } else {
      // Otherwise, query the database (fallback path)
      console.log(
        `[EMAIL SERVICE] No payment status provided, querying database for booking: ${bookingDetails.id}`,
      );
      try {
        const payments = await db
          .select()
          .from(payment)
          .where(eq(payment.bookingId, bookingDetails.id))
          .limit(1);

        if (payments.length === 0) {
          console.log(
            `[EMAIL SERVICE] No payment record found for booking: ${bookingDetails.id}`,
          );

          // NEW: If the booking status is CONFIRMED, assume payment is complete even without payment record
          if (bookingDetails.status === "CONFIRMED") {
            console.log(
              `[EMAIL SERVICE] Booking is CONFIRMED, assuming payment is complete despite no payment record`,
            );
            paymentIsComplete = true;
          }
        } else {
          console.log(
            `[EMAIL SERVICE] Found payment record with status: ${payments[0].status}`,
          );
          paymentIsComplete = payments[0].status === "COMPLETED";
        }
      } catch (dbError) {
        console.error(
          `[EMAIL SERVICE] Database error when checking payment: ${dbError}`,
        );
        // NEW: On DB error, fall back to checking booking status
        paymentIsComplete = bookingDetails.status === "CONFIRMED";
        console.log(
          `[EMAIL SERVICE] DB error recovery - assuming payment is ${paymentIsComplete ? "complete" : "incomplete"} based on booking status`,
        );
      }
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
      console.error(
        "[EMAIL SERVICE] Resend API key not configured! Check environment variables",
      );
      // Add an admin note about this error
      try {
        await db.insert(adminNote).values({
          id: crypto.randomUUID(),
          bookingId: bookingDetails.id,
          content:
            "EMAIL ERROR: Resend API key is not configured. Check environment variables.",
          addedBy: "Email Service",
          createdAt: new Date(),
        });
      } catch (noteError) {
        console.error(
          "[EMAIL SERVICE] Failed to create admin note about missing API key:",
          noteError,
        );
      }
      return false;
    }

    // Check RESEND_API_KEY value (redacted for security)
    console.log(
      `[EMAIL SERVICE] Resend API key present: ${!!RESEND_API_KEY}, value length: ${RESEND_API_KEY ? RESEND_API_KEY.length : 0}`,
    );

    // We've confirmed payment is complete, proceed with sending email
    console.log(
      `[EMAIL SERVICE] Payment complete, sending confirmation email for booking ${bookingDetails.id} to ${email}`,
    );

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
          content: `EMAIL ERROR: ${error.message || "Unknown Resend API error"}`,
          addedBy: "Email Service",
          createdAt: new Date(),
        });
      } catch (noteError) {
        console.error(
          "[EMAIL SERVICE] Failed to create admin note about API error:",
          noteError,
        );
      }

      return false;
    }

    console.log(
      "[EMAIL SERVICE] Booking confirmation email sent successfully:",
      data.id,
    );

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
      console.error(
        "[EMAIL SERVICE] Failed to create admin note about successful email:",
        noteError,
      );
    }

    return true;
  } catch (error) {
    console.error(
      "[EMAIL SERVICE] Error sending booking confirmation email:",
      error,
    );

    // Try to add admin note about the error
    try {
      await db.insert(adminNote).values({
        id: crypto.randomUUID(),
        bookingId: bookingDetails.id,
        content: `EMAIL ERROR: ${error instanceof Error ? error.message : "Unknown error"}`,
        addedBy: "Email Service",
        createdAt: new Date(),
      });
    } catch (noteError) {
      console.error(
        "[EMAIL SERVICE] Failed to create admin note about error:",
        noteError,
      );
    }

    return false;
  }
}

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

    console.log("Welcome email sent successfully:", {
      role: user.role || "customer",
      userId: data.id,
    });
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

    console.log(
      `Preparing cleaner assignment email for booking ${bookingDetails.id}`,
    );

    // Generate the assignment template with enhanced service details
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
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    console.log(
      `Sending cleaner application notification for: ${data.firstName} ${data.lastName}`,
    );

    // Use the proper email template function
    const template = getCleanerApplicationTemplate(
      {
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        city: data.city,
        experience: Array.isArray(data.experienceTypes)
          ? data.experienceTypes.join(", ")
          : String(data.experienceTypes),
        availability: data.availability,
        ownTransport: data.ownTransport,
        whatsApp: data.whatsApp,
        createdAt: data.createdAt,
      },
      EMAIL_CONFIG,
    );

    // Notification email recipient - replace with your recruitment team email
    const notificationEmail = "recruitment@brightbroom.com"; // Or use an environment variable

    // Send email with Resend
    const { data: emailData, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: notificationEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("Error sending cleaner application notification:", error);
      return false;
    }

    console.log(
      "Cleaner application notification sent successfully:",
      emailData.id,
    );
    return true;
  } catch (error) {
    console.error("Error sending cleaner application notification:", error);
    return false;
  }
}

/**
 * Send job assignment notification email to cleaner
 */
export async function sendCleanerJobAssignmentEmail(
  email: string,
  bookingDetails: any,
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    console.log(
      `Preparing job assignment email for cleaner - booking ${bookingDetails.id}`,
    );

    // Generate the assignment template for cleaner
    const template = getCleanerJobAssignmentTemplate(
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

    console.log("Cleaner job assignment email sent successfully:", data.id);
    return true;
  } catch (error) {
    console.error("Error sending cleaner job assignment email:", error);
    return false;
  }
}

/**
 * Send cleaner changed notification email to customer
 * Used when a different cleaner is assigned than the customer's preference
 */
export async function sendCleanerChangedEmail(
  email: string,
  bookingDetails: {
    id: string;
    service: { name: string };
    scheduledDate: string;
    address: { street: string; city: string; state: string; zipCode: string };
    originalCleaner: { firstName: string; lastName: string } | null;
    newCleaner: {
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
  },
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    console.log(
      `Preparing cleaner changed notification for booking ${bookingDetails.id}`,
    );

    // Generate the cleaner changed template
    const template = getCleanerChangedTemplate(
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

    console.log(
      "Cleaner changed notification email sent successfully:",
      data.id,
    );
    return true;
  } catch (error) {
    console.error("Error sending cleaner changed notification email:", error);
    return false;
  }
}

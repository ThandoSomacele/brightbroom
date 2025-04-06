// src/lib/server/email-service.ts
import { env } from "$env/dynamic/private";
import { Resend } from "resend";
import {
  getBookingConfirmationTemplate,
  getBookingReminderTemplate,
  getCleanerApplicationTemplate,
  getCleanerAssignmentTemplate,
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
 */
export async function sendBookingConfirmationEmail(
  email: string,
  bookingDetails: any,
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    // Use the booking confirmation template
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
      console.error("Resend API error:", error);
      return false;
    }

    console.log("Booking confirmation email sent successfully:", data.id);
    return true;
  } catch (error) {
    console.error("Error sending booking confirmation email:", error);
    return false;
  }
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail(
  email: string,
  user: { firstName: string; lastName: string },
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    // Generate the welcome template
    const template = getWelcomeEmailTemplate(email, user, EMAIL_CONFIG);

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

    console.log("Welcome email sent successfully:", data.id);
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

// Add this function to src/lib/server/email-service.ts

/**
 * Send a cleaner application notification email
 */
export async function sendCleanerApplicationEmail(
  application: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    city: string;
    experience: string;
    availability: string;
    ownTransport: boolean;
    whatsApp: boolean;
    createdAt: Date | string;
  },
  recruitmentEmail: string = "recruiting@brightbroom.com",
): Promise<boolean> {
  try {
    if (!resend) {
      console.error("Resend API key not configured");
      return false;
    }

    // Generate the application notification template
    const template = getCleanerApplicationTemplate(application, EMAIL_CONFIG);

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: recruitmentEmail,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error("Resend API error:", error);
      return false;
    }

    console.log(
      "Cleaner application notification email sent successfully:",
      data.id,
    );
    return true;
  } catch (error) {
    console.error(
      "Error sending cleaner application notification email:",
      error,
    );
    return false;
  }
}

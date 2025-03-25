// src/lib/server/email-service.ts
import { Resend } from "resend";
import { RESEND_API_KEY, PUBLIC_URL } from './env';
import {
  getBookingConfirmationTemplate,
  getBookingReminderTemplate,
  getCleanerAssignmentTemplate,
  getPasswordResetConfirmationTemplate,
  getPasswordResetTemplate,
  getWelcomeEmailTemplate,
} from "./email-templates";

// Initialize Resend with API key from environment variable
const resend = new Resend(RESEND_API_KEY);

// The sender email address
const FROM_EMAIL = "notifications@brightbroom.com";

// Email config for templates
const EMAIL_CONFIG = {
  appUrl: PUBLIC_URL,
  brandName: 'BrightBroom',
  primaryColor: '#20C3AF',
  secondaryColor: '#C2511F'
};

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
): Promise<boolean> {
  try {
    // Generate the email template
    const template = getPasswordResetTemplate(email, resetToken, EMAIL_CONFIG);

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
    // Use the booking confirmation template (we'll create this next)
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

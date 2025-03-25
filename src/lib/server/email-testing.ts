// src/lib/server/email-testing.ts
import { Resend } from "resend";
import { RESEND_API_KEY } from "./env";

// Initialize Resend with API key from environment variable
// Add a fallback for development if needed
const apiKey = RESEND_API_KEY;
const resend = new Resend(apiKey);

// Test email types we can send
type TestEmailType =
  | "welcome"
  | "password-reset"
  | "booking-confirmation"
  | "reminder";

/**
 * Send a test email - FOR DEVELOPMENT USE ONLY
 */
export async function sendTestEmail(
  type: TestEmailType,
  to: string,
): Promise<{ success: boolean; id?: string; error?: any }> {
  // Safety check - only allow in development
  if (process.env.NODE_ENV === "production") {
    console.error("Test emails can only be sent in development environment");
    return { success: false, error: "Test emails disabled in production" };
  }

  try {
    // Default email content
    let subject = "Test Email";
    let html =
      "<h1>This is a test email</h1><p>Your email integration is working!</p>";
    let text = "This is a test email. Your email integration is working!";

    // Customize based on the type
    switch (type) {
      case "welcome":
        subject = "Welcome to BrightBroom - TEST";
        html = `<h1>Welcome to BrightBroom!</h1>
               <p>This is a test welcome email.</p>
               <p>If you received this, your email integration is working correctly.</p>`;
        text =
          "Welcome to BrightBroom! This is a test welcome email. If you received this, your email integration is working correctly.";
        break;

      case "password-reset":
        subject = "Password Reset - TEST";
        html = `<h1>Password Reset</h1>
               <p>This is a test password reset email.</p>
               <p>If you received this, your email integration is working correctly.</p>`;
        text =
          "Password Reset. This is a test password reset email. If you received this, your email integration is working correctly.";
        break;

      case "booking-confirmation":
        subject = "Booking Confirmation - TEST";
        html = `<h1>Booking Confirmation</h1>
               <p>This is a test booking confirmation email.</p>
               <p>If you received this, your email integration is working correctly.</p>`;
        text =
          "Booking Confirmation. This is a test booking confirmation email. If you received this, your email integration is working correctly.";
        break;

      case "reminder":
        subject = "Booking Reminder - TEST";
        html = `<h1>Booking Reminder</h1>
               <p>This is a test booking reminder email.</p>
               <p>If you received this, your email integration is working correctly.</p>`;
        text =
          "Booking Reminder. This is a test booking reminder email. If you received this, your email integration is working correctly.";
        break;
    }

    // Send the test email
    const { data, error } = await resend.emails.send({
      from: "BrightBroom <notifications@brightbroom.com>", // Using Resend's test sender (or your verified domain)
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error("Test email error:", error);
      return { success: false, error };
    }

    console.log("Test email sent successfully:", data.id);
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Error sending test email:", error);
    return { success: false, error };
  }
}

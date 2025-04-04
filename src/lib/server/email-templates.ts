// src/lib/server/email-templates.ts
import { escapeHtml } from "$lib/utils/strings";

export interface EmailTemplateData {
  appUrl: string;
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  [key: string]: any;
}

/**
 * Generate a password reset email template
 */
export function getPasswordResetTemplate(
  recipientEmail: string,
  resetToken: string,
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const resetUrl = `${data.appUrl}/auth/reset-password?token=${resetToken}`;
  const escapedEmail = escapeHtml(recipientEmail);

  // HTML Email template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: ${data.primaryColor};
    }
    .header img {
      max-height: 50px;
    }
    .content {
      padding: 30px 20px;
      background-color: #ffffff;
    }
    .footer {
      font-size: 12px;
      text-align: center;
      color: #888888;
      padding: 20px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${data.primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      font-weight: bold;
      border-radius: 4px;
      margin: 20px 0;
    }
    .highlight {
      color: ${data.primaryColor};
      font-weight: bold;
    }
    @media only screen and (max-width: 480px) {
      .email-container {
        padding: 10px;
      }
      .content {
        padding: 20px 15px;
      }
      .btn {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">${data.brandName}</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your ${data.brandName} account (${escapedEmail}). To reset your password, click the button below:</p>
      
      <div style="text-align: center;">
        <a href="${resetUrl}" class="btn">Reset My Password</a>
      </div>
      
      <p>This password reset link is only valid for the next 24 hours. If you did not request a password reset, you can safely ignore this email.</p>
      
      <p>If the button above doesn't work, copy and paste this URL into your browser:</p>
      <p style="word-break: break-all; font-size: 14px; color: #555555;">${resetUrl}</p>
      
      <p>Thank you,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  // Plain text version for clients that don't support HTML
  const text = `
Reset Your Password - ${data.brandName}

Hello,

We received a request to reset the password for your ${data.brandName} account (${recipientEmail}). To reset your password, copy and paste the link below into your browser:

${resetUrl}

This password reset link is only valid for the next 24 hours. If you did not request a password reset, you can safely ignore this email.

Thank you,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Reset Your ${data.brandName} Password`,
    html,
    text,
  };
}

/**
 * Generate a confirmation email for successful password reset
 */
export function getPasswordResetConfirmationTemplate(
  recipientEmail: string,
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const loginUrl = `${data.appUrl}/auth/login`;
  const escapedEmail = escapeHtml(recipientEmail);

  // HTML Email template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Successful</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: ${data.primaryColor};
    }
    .header img {
      max-height: 50px;
    }
    .content {
      padding: 30px 20px;
      background-color: #ffffff;
    }
    .success-icon {
      text-align: center;
      font-size: 48px;
      margin: 10px 0;
      color: #4CAF50;
    }
    .footer {
      font-size: 12px;
      text-align: center;
      color: #888888;
      padding: 20px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${data.primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      font-weight: bold;
      border-radius: 4px;
      margin: 20px 0;
    }
    @media only screen and (max-width: 480px) {
      .email-container {
        padding: 10px;
      }
      .content {
        padding: 20px 15px;
      }
      .btn {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">${data.brandName}</h1>
    </div>
    <div class="content">
      <div class="success-icon">✓</div>
      <h2>Password Reset Successful</h2>
      <p>Hello,</p>
      <p>Your password for ${data.brandName} has been successfully reset.</p>
      <p>You can now log in to your account using your new password.</p>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="btn">Log In</a>
      </div>
      
      <p>If you did not reset your password, please contact our support team immediately.</p>
      
      <p>Thank you,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  // Plain text version
  const text = `
Password Reset Successful - ${data.brandName}

Hello,

Your password for ${data.brandName} has been successfully reset.

You can now log in to your account using your new password:
${loginUrl}

If you did not reset your password, please contact our support team immediately.

Thank you,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Your ${data.brandName} Password Has Been Reset`,
    html,
    text,
  };
}

/**
 * Generate a booking confirmation email template
 */
export function getBookingConfirmationTemplate(
  recipientEmail: string,
  booking: {
    id: string;
    service: { name: string };
    scheduledDate: string;
    address: { street: string; city: string; state: string; zipCode: string };
    price: number | string;
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const bookingUrl = `${data.appUrl}/profile/bookings/${booking.id}`;
  const escapedEmail = escapeHtml(recipientEmail);

  // Format price
  const formattedPrice =
    typeof booking.price === "number"
      ? booking.price.toFixed(2)
      : booking.price.toString();

  // Format date
  const scheduledDate = new Date(booking.scheduledDate);
  const dateString = scheduledDate.toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format time
  const timeString = scheduledDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // HTML Email template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Confirmation</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: ${data.primaryColor};
    }
    .header img {
      max-height: 50px;
    }
    .content {
      padding: 30px 20px;
      background-color: #ffffff;
    }
    .booking-details {
      background-color: #f9f9f9;
      border-radius: 4px;
      padding: 20px;
      margin: 20px 0;
    }
    .booking-detail {
      margin-bottom: 10px;
      border-bottom: 1px solid #eeeeee;
      padding-bottom: 10px;
    }
    .booking-detail:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .label {
      font-weight: bold;
      color: #666666;
    }
    .footer {
      font-size: 12px;
      text-align: center;
      color: #888888;
      padding: 20px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${data.primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      font-weight: bold;
      border-radius: 4px;
      margin: 20px 0;
    }
    @media only screen and (max-width: 480px) {
      .email-container {
        padding: 10px;
      }
      .content {
        padding: 20px 15px;
      }
      .btn {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">${data.brandName}</h1>
    </div>
    <div class="content">
      <h2>Booking Confirmation</h2>
      <p>Hello,</p>
      <p>Thank you for booking with ${data.brandName}! Your cleaning service has been confirmed.</p>
      
      <div class="booking-details">
        <div class="booking-detail">
          <span class="label">Service:</span>
          <span>${booking.service.name}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Date:</span>
          <span>${dateString}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Time:</span>
          <span>${timeString}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Location:</span>
          <span>${booking.address.street}, ${booking.address.city}, ${booking.address.state}, ${booking.address.zipCode}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Total:</span>
          <span>R${formattedPrice}</span>
        </div>
      </div>
      
      <p>You can view your booking details and manage your appointment by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${bookingUrl}" class="btn">View Booking</a>
      </div>
      
      <p>If you have any questions or need to make changes to your booking, please contact our support team.</p>
      
      <p>Thank you for choosing ${data.brandName}!</p>
      
      <p>Best regards,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  // Plain text version
  const text = `
Booking Confirmation - ${data.brandName}

Hello,

Thank you for booking with ${data.brandName}! Your cleaning service has been confirmed.

Booking Details:
Service: ${booking.service.name}
Date: ${dateString}
Time: ${timeString}
Location: ${booking.address.street}, ${booking.address.city}, ${booking.address.state}, ${booking.address.zipCode}
Total: R${formattedPrice}

You can view your booking details and manage your appointment at:
${bookingUrl}

If you have any questions or need to make changes to your booking, please contact our support team.

Thank you for choosing ${data.brandName}!

Best regards,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Your ${data.brandName} Booking Confirmation`,
    html,
    text,
  };
}

/**
 * Generate a welcome email template for new users
 */
export function getWelcomeEmailTemplate(
  recipientEmail: string,
  user: {
    firstName: string;
    lastName: string;
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const loginUrl = `${data.appUrl}/auth/login`;
  const bookingUrl = `${data.appUrl}/book`;
  const escapedEmail = escapeHtml(recipientEmail);

  // HTML Email template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${data.brandName}</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: ${data.primaryColor};
    }
    .header img {
      max-height: 50px;
    }
    .content {
      padding: 30px 20px;
      background-color: #ffffff;
    }
    .footer {
      font-size: 12px;
      text-align: center;
      color: #888888;
      padding: 20px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${data.primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      font-weight: bold;
      border-radius: 4px;
      margin: 20px 0;
    }
    .feature {
      margin-bottom: 20px;
      padding-left: 15px;
      border-left: 3px solid ${data.primaryColor};
    }
    @media only screen and (max-width: 480px) {
      .email-container {
        padding: 10px;
      }
      .content {
        padding: 20px 15px;
      }
      .btn {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">${data.brandName}</h1>
    </div>
    <div class="content">
      <h2>Welcome to ${data.brandName}!</h2>
      <p>Hello ${user.firstName},</p>
      <p>Thank you for creating an account with ${data.brandName}. We're excited to have you join our community of customers who value a clean, fresh living space.</p>
      
      <p>With your new account, you can:</p>
      
      <div class="feature">
        <p><strong>Book professional cleaning services</strong> for your home or office</p>
      </div>
      <div class="feature">
        <p><strong>Manage your bookings</strong> easily from your profile</p>
      </div>
      <div class="feature">
        <p><strong>Save multiple addresses</strong> for different cleaning locations</p>
      </div>
      
      <div style="text-align: center;">
        <a href="${bookingUrl}" class="btn">Book Your First Cleaning</a>
      </div>
      
      <p>If you have any questions or need assistance, our support team is here to help.</p>
      
      <p>We look forward to serving you!</p>
      
      <p>Best regards,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  // Plain text version
  const text = `
Welcome to ${data.brandName}!

Hello ${user.firstName},

Thank you for creating an account with ${data.brandName}. We're excited to have you join our community of customers who value a clean, fresh living space.

With your new account, you can:
- Book professional cleaning services for your home or office
- Manage your bookings easily from your profile
- Save multiple addresses for different cleaning locations

Book your first cleaning here: ${bookingUrl}

If you have any questions or need assistance, our support team is here to help.

We look forward to serving you!

Best regards,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Welcome to ${data.brandName}!`,
    html,
    text,
  };
}

/**
 * Generate a booking reminder email template
 */
export function getBookingReminderTemplate(
  recipientEmail: string,
  booking: {
    id: string;
    service: { name: string };
    scheduledDate: string;
    address: { street: string; city: string; state: string; zipCode: string };
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const bookingUrl = `${data.appUrl}/profile/bookings/${booking.id}`;
  const escapedEmail = escapeHtml(recipientEmail);

  // Format date and time
  const scheduledDate = new Date(booking.scheduledDate);
  const dateString = scheduledDate.toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeString = scheduledDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Calculate hours until booking
  const now = new Date();
  const hoursUntil = Math.round(
    (scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60),
  );

  // HTML Email template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Booking Reminder</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: ${data.primaryColor};
    }
    .header img {
      max-height: 50px;
    }
    .content {
      padding: 30px 20px;
      background-color: #ffffff;
    }
    .reminder-box {
      background-color: #FFF9C4;
      border-left: 4px solid #FBC02D;
      padding: 15px;
      margin: 20px 0;
    }
    .booking-details {
      background-color: #f9f9f9;
      border-radius: 4px;
      padding: 20px;
      margin: 20px 0;
    }
    .booking-detail {
      margin-bottom: 10px;
      border-bottom: 1px solid #eeeeee;
      padding-bottom: 10px;
    }
    .booking-detail:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .label {
      font-weight: bold;
      color: #666666;
    }
    .footer {
      font-size: 12px;
      text-align: center;
      color: #888888;
      padding: 20px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${data.primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      font-weight: bold;
      border-radius: 4px;
      margin: 20px 0;
    }
    @media only screen and (max-width: 480px) {
      .email-container {
        padding: 10px;
      }
      .content {
        padding: 20px 15px;
      }
      .btn {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">${data.brandName}</h1>
    </div>
    <div class="content">
      <h2>Your Cleaning Service Reminder</h2>
      <p>Hello,</p>
      
      <div class="reminder-box">
        <p><strong>Your cleaning service is scheduled in approximately ${hoursUntil} hours.</strong></p>
      </div>
      
      <p>This is a friendly reminder about your upcoming cleaning service with ${data.brandName}.</p>
      
      <div class="booking-details">
        <div class="booking-detail">
          <span class="label">Service:</span>
          <span>${booking.service.name}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Date:</span>
          <span>${dateString}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Time:</span>
          <span>${timeString}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Location:</span>
          <span>${booking.address.street}, ${booking.address.city}, ${booking.address.state}, ${booking.address.zipCode}</span>
        </div>
      </div>
      
      <h3>Preparation Tips:</h3>
      <ul>
        <li>Please ensure access to your property is available at the scheduled time</li>
        <li>Clear valuable or fragile items from surfaces to be cleaned</li>
        <li>Secure pets in a safe area if needed</li>
      </ul>
      
      <p>You can view your booking details here:</p>
      
      <div style="text-align: center;">
        <a href="${bookingUrl}" class="btn">View Booking Details</a>
      </div>
      
      <p>We look forward to providing you with excellent service!</p>
      
      <p>Best regards,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  // Plain text version
  const text = `
Booking Reminder - ${data.brandName}

Hello,

YOUR CLEANING SERVICE IS SCHEDULED IN APPROXIMATELY ${hoursUntil} HOURS.

This is a friendly reminder about your upcoming cleaning service with ${data.brandName}.

Booking Details:
Service: ${booking.service.name}
Date: ${dateString}
Time: ${timeString}
Location: ${booking.address.street}, ${booking.address.city}, ${booking.address.state}, ${booking.address.zipCode}

Preparation Tips:
- Please ensure access to your property is available at the scheduled time
- Clear valuable or fragile items from surfaces to be cleaned
- Secure pets in a safe area if needed

You can view your booking details here:
${bookingUrl}

We look forward to providing you with excellent service!

Best regards,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Reminder: Your Cleaning Service Tomorrow - ${data.brandName}`,
    html,
    text,
  };
}

/**
 * Generate an email template for cleaner assignment notifications
 */
export function getCleanerAssignmentTemplate(
  recipientEmail: string,
  booking: {
    id: string;
    service: { name: string };
    scheduledDate: string;
    address: { street: string; city: string; state: string; zipCode: string };
    cleaner: { firstName: string; lastName: string; phone?: string };
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const bookingUrl = `${data.appUrl}/profile/bookings/${booking.id}`;
  const escapedEmail = escapeHtml(recipientEmail);

  // Format date and time
  const scheduledDate = new Date(booking.scheduledDate);
  const dateString = scheduledDate.toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeString = scheduledDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // HTML Email template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cleaner Assigned to Your Booking</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: ${data.primaryColor};
    }
    .header img {
      max-height: 50px;
    }
    .content {
      padding: 30px 20px;
      background-color: #ffffff;
    }
    .booking-details {
      background-color: #f9f9f9;
      border-radius: 4px;
      padding: 20px;
      margin: 20px 0;
    }
    .booking-detail {
      margin-bottom: 10px;
      border-bottom: 1px solid #eeeeee;
      padding-bottom: 10px;
    }
    .booking-detail:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .label {
      font-weight: bold;
      color: #666666;
    }
    .cleaner-box {
      background-color: #E1F5FE;
      border-left: 4px solid ${data.primaryColor};
      padding: 15px;
      margin: 20px 0;
    }
    .footer {
      font-size: 12px;
      text-align: center;
      color: #888888;
      padding: 20px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${data.primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      font-weight: bold;
      border-radius: 4px;
      margin: 20px 0;
    }
    @media only screen and (max-width: 480px) {
      .email-container {
        padding: 10px;
      }
      .content {
        padding: 20px 15px;
      }
      .btn {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">${data.brandName}</h1>
    </div>
    <div class="content">
      <h2>Your Cleaner Has Been Assigned</h2>
      <p>Hello,</p>
      <p>Great news! A professional cleaner has been assigned to your upcoming booking.</p>
      
      <div class="cleaner-box">
        <p><strong>Your cleaner:</strong> ${booking.cleaner.firstName} ${booking.cleaner.lastName}</p>
        ${booking.cleaner.phone ? `<p><strong>Contact number:</strong> ${booking.cleaner.phone}</p>` : ""}
      </div>
      
      <div class="booking-details">
        <div class="booking-detail">
          <span class="label">Service:</span>
          <span>${booking.service.name}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Date:</span>
          <span>${dateString}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Time:</span>
          <span>${timeString}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Location:</span>
          <span>${booking.address.street}, ${booking.address.city}, ${booking.address.state}, ${booking.address.zipCode}</span>
        </div>
      </div>
      
      <p>You can view your booking details by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${bookingUrl}" class="btn">View Booking Details</a>
      </div>
      
      <p>If you have any questions about your booking, please contact our support team.</p>
      
      <p>Thank you for choosing ${data.brandName}!</p>
      
      <p>Best regards,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  // Plain text version
  const text = `
Cleaner Assigned to Your Booking - ${data.brandName}

Hello,

Great news! A professional cleaner has been assigned to your upcoming booking.

YOUR CLEANER: ${booking.cleaner.firstName} ${booking.cleaner.lastName}
${booking.cleaner.phone ? `CONTACT NUMBER: ${booking.cleaner.phone}` : ""}

Booking Details:
Service: ${booking.service.name}
Date: ${dateString}
Time: ${timeString}
Location: ${booking.address.street}, ${booking.address.city}, ${booking.address.state}, ${booking.address.zipCode}

You can view your booking details here:
${bookingUrl}

If you have any questions about your booking, please contact our support team.

Thank you for choosing ${data.brandName}!

Best regards,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Cleaner Assigned: Your ${data.brandName} Booking`,
    html,
    text,
  };
}

/**
 * Generate a payment receipt/invoice email template
 */
export function getPaymentReceiptTemplate(
  recipientEmail: string,
  paymentDetails: {
    id: string;
    createdAt: string | Date;
    amount: number | string;
    booking: {
      id: string;
      service: { name: string; description?: string };
      scheduledDate: string | Date;
      address: { street: string; city: string; state: string; zipCode: string };
      duration?: number;
    };
    user: {
      firstName: string;
      lastName: string;
    };
    paymentMethod?: string;
    vatRate?: number;
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const escapedEmail = escapeHtml(recipientEmail);
  const bookingUrl = `${data.appUrl}/profile/bookings/${paymentDetails.booking.id}`;

  // Format dates
  const paymentDate = new Date(paymentDetails.createdAt);
  const formattedPaymentDate = paymentDate.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const scheduledDate = new Date(paymentDetails.booking.scheduledDate);
  const formattedScheduledDate = scheduledDate.toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formattedScheduledTime = scheduledDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Format amounts
  const totalAmount =
    typeof paymentDetails.amount === "number"
      ? paymentDetails.amount
      : parseFloat(String(paymentDetails.amount));

  // Calculate VAT (if applicable)
  const vatRate = paymentDetails.vatRate || 15; // Default to 15% VAT for South Africa
  const vatAmount = totalAmount * (vatRate / 100);
  const subtotal = totalAmount - vatAmount;

  // Format currency values
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Generate invoice number (payment ID + timestamp)
  const invoiceNumber = `INV-${paymentDetails.id.substring(0, 8)}-${Math.floor(paymentDate.getTime() / 1000)}`;

  // HTML Email template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      background-color: ${data.primaryColor};
    }
    .header img {
      max-height: 50px;
    }
    .content {
      padding: 30px 20px;
      background-color: #ffffff;
    }
    .invoice-box {
      background-color: #f9f9f9;
      border-radius: 4px;
      padding: 20px;
      margin: 20px 0;
    }
    .invoice-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eeeeee;
    }
    .company-details {
      text-align: left;
    }
    .invoice-details {
      text-align: right;
    }
    .invoice-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eeeeee;
    }
    .invoice-row:last-child {
      border-bottom: none;
    }
    .invoice-row.total {
      font-weight: bold;
      border-top: 2px solid #dddddd;
      border-bottom: none;
    }
    .customer-details {
      margin: 20px 0;
    }
    .footer {
      font-size: 12px;
      text-align: center;
      color: #888888;
      padding: 20px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: ${data.primaryColor};
      color: #ffffff !important;
      text-decoration: none;
      font-weight: bold;
      border-radius: 4px;
      margin: 20px 0;
    }
    @media only screen and (max-width: 480px) {
      .invoice-header {
        flex-direction: column;
      }
      .company-details, .invoice-details {
        text-align: left;
      }
      .email-container {
        padding: 10px;
      }
      .content {
        padding: 20px 15px;
      }
      .btn {
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">${data.brandName}</h1>
    </div>
    <div class="content">
      <h2>Payment Receipt</h2>
      <p>Hello ${paymentDetails.user.firstName},</p>
      <p>Thank you for your payment. This email confirms that your payment for the cleaning service has been successfully processed.</p>
      
      <div class="invoice-box">
        <div class="invoice-header">
          <div class="company-details">
            <h3 style="margin: 0; color: #333333;">${data.brandName}</h3>
            <p style="margin: 5px 0;">
              123 Main Street<br>
              Cape Town<br>
              South Africa<br>
              VAT: ZA1234567890
            </p>
          </div>
          <div class="invoice-details">
            <h3 style="margin: 0; color: #333333;">Invoice</h3>
            <p style="margin: 5px 0;">
              Invoice #: ${invoiceNumber}<br>
              Date: ${formattedPaymentDate}<br>
              Payment ID: ${paymentDetails.id}
            </p>
          </div>
        </div>
        
        <div class="customer-details">
          <h4 style="margin: 0 0 10px 0; color: #333333;">Bill To:</h4>
          <p style="margin: 0;">
            ${paymentDetails.user.firstName} ${paymentDetails.user.lastName}<br>
            ${paymentDetails.booking.address.street}<br>
            ${paymentDetails.booking.address.city}, ${paymentDetails.booking.address.state}<br>
            ${paymentDetails.booking.address.zipCode}<br>
            ${escapedEmail}
          </p>
        </div>
        
        <div>
          <h4 style="margin: 0 0 10px 0; color: #333333;">Service Details:</h4>
          <div class="invoice-row">
            <div style="flex: 3;">
              <strong>${paymentDetails.booking.service.name}</strong><br>
              <span style="font-size: 0.9em; color: #666;">
                Scheduled for ${formattedScheduledDate} at ${formattedScheduledTime}
              </span>
            </div>
            <div style="flex: 1; text-align: right;">
              ${formatCurrency(subtotal)}
            </div>
          </div>
          
          <div class="invoice-row">
            <div>VAT (${vatRate}%)</div>
            <div>${formatCurrency(vatAmount)}</div>
          </div>
          
          <div class="invoice-row total">
            <div>Total</div>
            <div>${formatCurrency(totalAmount)}</div>
          </div>
          
          <div style="margin-top: 15px; font-size: 0.9em; color: #666;">
            <p>Payment Method: ${paymentDetails.paymentMethod || "Credit Card"}</p>
            <p>Payment Status: Completed</p>
          </div>
        </div>
      </div>
      
      <p>You can view your booking details and manage your appointment by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${bookingUrl}" class="btn">View Booking</a>
      </div>
      
      <p>Thank you for choosing ${data.brandName}!</p>
      
      <p>Best regards,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This receipt was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  // Plain text version
  const text = `
Payment Receipt - ${data.brandName}

Hello ${paymentDetails.user.firstName},

Thank you for your payment. This email confirms that your payment for the cleaning service has been successfully processed.

INVOICE DETAILS:
Invoice #: ${invoiceNumber}
Date: ${formattedPaymentDate}
Payment ID: ${paymentDetails.id}

BILL TO:
${paymentDetails.user.firstName} ${paymentDetails.user.lastName}
${paymentDetails.booking.address.street}
${paymentDetails.booking.address.city}, ${paymentDetails.booking.address.state}
${paymentDetails.booking.address.zipCode}
${recipientEmail}

SERVICE DETAILS:
${paymentDetails.booking.service.name}
Scheduled for ${formattedScheduledDate} at ${formattedScheduledTime}

Subtotal: ${formatCurrency(subtotal)}
VAT (${vatRate}%): ${formatCurrency(vatAmount)}
Total: ${formatCurrency(totalAmount)}

Payment Method: ${paymentDetails.paymentMethod || "Credit Card"}
Payment Status: Completed

You can view your booking details here:
${bookingUrl}

Thank you for choosing ${data.brandName}!

Best regards,
The ${data.brandName} Team

This receipt was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Payment Receipt from ${data.brandName} - ${invoiceNumber}`,
    html,
    text,
  };
}

// src/lib/server/email-templates.ts
import { parseDateTimeString } from "$lib/utils/date-utils";
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
): { subject: string; html: string; text: string; resetUrl: string } {
  // Ensure appUrl is defined and clean
  const appUrl = data.appUrl
    ? data.appUrl.trim().replace(/\/$/, "")
    : "https://brightbroom.com";

  // Generate the reset URL
  const resetUrl = `${appUrl}/auth/reset-password?token=${resetToken}`;
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
    resetUrl, // Return the URL for logging/debugging
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

  // Parse without timezone conversion
  const scheduledDate = parseDateTimeString(booking.scheduledDate);

  // Format date
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
    hour12: false,
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
      <p>You you will shortly recieve notification of your assigned clearner and their details.</p>
      
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
      
      <p>You can view your booking details by clicking the button below:</p>
      
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
  const scheduledDate = parseDateTimeString(booking.scheduledDate);
  const dateString = scheduledDate.toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeString = scheduledDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Use 24-hour format for South Africa
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
              0B Cedar Avenue West<br>
              Fourways, Sandton<br>
              South Africa<br>
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

/**
 * Generate a payment receipt/invoice email template
 */
export function getCleanerAssignmentTemplate(
  recipientEmail: string,
  booking: {
    id: string;
    service: {
      name: string;
      description?: string;
      details?: any;
    };
    scheduledDate: string;
    address: { street: string; city: string; state: string; zipCode: string };
    cleaner: {
      firstName: string;
      lastName: string;
      phone?: string;
      profileImageUrl?: string;
    };
    notes?: string;
    duration?: number;
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const bookingUrl = `${data.appUrl}/profile/bookings/${booking.id}`;
  const escapedEmail = escapeHtml(recipientEmail);

  // Extract profile image URL from the cleaner object
  const profileImageUrl = booking.cleaner.profileImageUrl;

  // Default avatar SVG for cleaners without profile images
  const defaultAvatarSvg = `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="30" fill="#E5E7EB"/>
    <path d="M30 15C25.0294 15 21 19.0294 21 24C21 28.9706 25.0294 33 30 33C34.9706 33 39 28.9706 39 24C39 19.0294 34.9706 15 30 15ZM30 39C22.5 39 15 42.5147 15 48V51H45V48C45 42.5147 37.5 39 30 39Z" fill="#9CA3AF"/>
  </svg>`;

  // Parse without timezone conversion
  const scheduledDate = parseDateTimeString(booking.scheduledDate);

  // Format date
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
    hour12: false,
  });

  // Add a section for service details in the HTML template
  const serviceDetailsHtml = `
    <div class="booking-details">
      <h3 style="margin-top: 0; color: #333333; font-size: 16px;">Service Details:</h3>
      <div class="booking-detail">
        <span class="label">Service Type:</span>
        <span><strong>${booking.service.name}</strong></span>
      </div>
      ${
        booking.service.description
          ? `
      <div class="booking-detail">
        <span class="label">Description:</span>
        <span>${booking.service.description}</span>
      </div>
      `
          : ""
      }
      ${
        booking.duration
          ? `
      <div class="booking-detail">
        <span class="label">Duration:</span>
        <span>${booking.duration / 60} ${booking.duration / 60 === 1 ? "hour" : "hours"}</span>
      </div>
      `
          : ""
      }
      ${
        booking.notes
          ? `
      <div class="booking-detail">
        <span class="label">Customer Notes:</span>
        <span>${booking.notes}</span>
      </div>
      `
          : ""
      }
    </div>
  `;

  // Same for the plain text version
  const serviceDetailsText = `
Service Details:
- Service Type: ${booking.service.name}
${booking.service.description ? `- Description: ${booking.service.description}\n` : ""}
${booking.duration ? `- Duration: ${booking.duration / 60} ${booking.duration / 60 === 1 ? "hour" : "hours"}\n` : ""}
${booking.notes ? `- Customer Notes: ${booking.notes}\n` : ""}
  `;

  // Now modify the HTML template to include the service details section
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
    .cleaner-box {
      background-color: #f9f9f9;
      border-radius: 4px;
      padding: 15px;
      margin: 20px 0;
      display: flex;
      align-items: center;
    }
    .cleaner-image {
      margin-right: 15px;
    }
    .cleaner-info {
      flex-grow: 1;
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
      <h2>Your Cleaner Has Been Assigned</h2>
      <p>Hello,</p>
      <p>Great news! A professional cleaner has been assigned to your upcoming booking.</p>
      
      <div class="cleaner-box">
        <div class="cleaner-image">
          ${
            profileImageUrl
              ? `<img src="${profileImageUrl}" alt="${booking.cleaner.firstName}" width="60" height="60" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">`
              : defaultAvatarSvg
          }
        </div>
        <div class="cleaner-info">
          <p style="margin-top: 0; margin-bottom: 5px;"><strong>Your cleaner:</strong> ${booking.cleaner.firstName} ${booking.cleaner.lastName}</p>
          ${booking.cleaner.phone ? `<p style="margin-top: 0; margin-bottom: 0;"><strong>Contact:</strong> ${booking.cleaner.phone}</p>` : ""}
        </div>
      </div>
      
      <!-- New Service Details Section -->
      ${serviceDetailsHtml}
      
      <div class="booking-details">
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

  // Update the plain text version too
  const text = `
Cleaner Assigned to Your Booking - ${data.brandName}

Hello,

Great news! A professional cleaner has been assigned to your upcoming booking.

YOUR CLEANER: ${booking.cleaner.firstName} ${booking.cleaner.lastName}
${booking.cleaner.phone ? `CONTACT NUMBER: ${booking.cleaner.phone}` : ""}

${serviceDetailsText}

Booking Details:
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
 * Generate a contact form notification email template
 */
export function getContactFormTemplate(
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
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const escapedEmail = escapeHtml(formData.email);

  // HTML Email template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
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
    .content {
      padding: 30px 20px;
      background-color: #ffffff;
    }
    .submission-details {
      background-color: #f9f9f9;
      border-radius: 4px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      margin-bottom: 10px;
      border-bottom: 1px solid #eeeeee;
      padding-bottom: 10px;
    }
    .detail-row:last-child {
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
    .highlight {
      background-color: #FFF9C4;
      padding: 5px;
      border-left: 3px solid #FBC02D;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">${data.brandName}</h1>
    </div>
    <div class="content">
      <h2>New Contact Form Submission</h2>
      <p>You have received a new message from your website contact form.</p>
      
      <div class="submission-details">
        <div class="detail-row">
          <span class="label">Name:</span>
          <span>${formData.firstName} ${formData.lastName}</span>
        </div>
        <div class="detail-row">
          <span class="label">Email:</span>
          <span>${escapedEmail}</span>
        </div>
        ${
          formData.phone
            ? `
        <div class="detail-row">
          <span class="label">Phone:</span>
          <span>${formData.phone}</span>
        </div>`
            : ""
        }
        <div class="detail-row">
          <span class="label">Subject:</span>
          <span>${formData.subject}</span>
        </div>
        ${
          formData.referral
            ? `
        <div class="detail-row">
          <span class="label">Referral Source:</span>
          <span>${formData.referral}</span>
        </div>`
            : ""
        }
        <div class="detail-row">
          <span class="label">Message:</span>
          <div style="margin-top: 5px;">
            ${formData.message.replace(/\n/g, "<br>")}
          </div>
        </div>
      </div>
      
      ${
        formData.joinAsCleaner
          ? `
      <div class="highlight" style="padding: 15px; margin: 20px 0;">
        <p><strong>Important:</strong> This person is interested in joining as a cleaner.</p>
      </div>`
          : ""
      }
      
      <p>Please respond to this inquiry as soon as possible.</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  // Plain text version
  const text = `
New Contact Form Submission - ${data.brandName}

You have received a new message from your website contact form.

Submission Details:
Name: ${formData.firstName} ${formData.lastName}
Email: ${formData.email}
${formData.phone ? `Phone: ${formData.phone}\n` : ""}
Subject: ${formData.subject}
${formData.referral ? `Referral Source: ${formData.referral}\n` : ""}

Message:
${formData.message}

${formData.joinAsCleaner ? "IMPORTANT: This person is interested in joining as a cleaner.\n" : ""}

Please respond to this inquiry as soon as possible.

© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `New Contact Form Submission: ${formData.subject}`,
    html,
    text,
  };
}

/**
 * Generate a cleaner application notification email template
 */
export function getCleanerApplicationTemplate(
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
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  // Format the application date
  const appDate = new Date(application.createdAt);
  const dateString = appDate.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Parse availability days (assuming it's a JSON string of days)
  let availabilityDisplay = "";
  try {
    const days = JSON.parse(application.availability);
    availabilityDisplay = days
      .map((day) => day.charAt(0) + day.slice(1).toLowerCase())
      .join(", ");
  } catch (e) {
    availabilityDisplay = "Not specified";
  }

  // Admin dashboard URL
  const adminUrl = `${data.appUrl}/admin/applications`;
  const applicationUrl = `${data.appUrl}/admin/applications/${application.id}`;

  // HTML Email template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Cleaner Application</title>
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
    .application-details {
      background-color: #f9f9f9;
      border-radius: 4px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      margin-bottom: 10px;
      border-bottom: 1px solid #eeeeee;
      padding-bottom: 10px;
    }
    .detail-row:last-child {
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
    .highlight {
      background-color: #e1f5fe;
      padding: 15px;
      border-left: 4px solid ${data.primaryColor};
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
      <h2>New Cleaner Application</h2>
      <p>A new application for the cleaner position has been submitted.</p>
      
      <div class="highlight">
        <p><strong>Application ID:</strong> ${application.id}</p>
        <p><strong>Submitted:</strong> ${dateString}</p>
      </div>
      
      <div class="application-details">
        <div class="detail-row">
          <span class="label">Applicant:</span>
          <span>${application.firstName} ${application.lastName}</span>
        </div>
        <div class="detail-row">
          <span class="label">Email:</span>
          <span>${application.email}</span>
        </div>
        ${
          application.phone
            ? `
        <div class="detail-row">
          <span class="label">Phone:</span>
          <span>${application.phone}</span>
        </div>`
            : ""
        }
        <div class="detail-row">
          <span class="label">Location:</span>
          <span>${application.city}</span>
        </div>
        <div class="detail-row">
          <span class="label">Experience:</span>
          <span>${application.experience}</span>
        </div>
        <div class="detail-row">
          <span class="label">Available Days:</span>
          <span>${availabilityDisplay}</span>
        </div>
        <div class="detail-row">
          <span class="label">Own Transport:</span>
          <span>${application.ownTransport ? "Yes" : "No"}</span>
        </div>
        <div class="detail-row">
          <span class="label">WhatsApp Available:</span>
          <span>${application.whatsApp ? "Yes" : "No"}</span>
        </div>
      </div>
      
      <p>Please review this application through the admin dashboard:</p>
      
      <div style="text-align: center;">
        <a href="${applicationUrl}" class="btn">Review Application</a>
      </div>
      
      <p>Or view all pending applications:</p>
      <div style="text-align: center;">
        <a href="${adminUrl}" style="color: ${data.primaryColor};">Manage Applications</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
      <p>This is an automated message - please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

  // Plain text version
  const text = `
New Cleaner Application - ${data.brandName}

A new application for the cleaner position has been submitted.

Application ID: ${application.id}
Submitted: ${dateString}

Applicant Details:
- Name: ${application.firstName} ${application.lastName}
- Email: ${application.email}
${application.phone ? `- Phone: ${application.phone}\n` : ""}
- Location: ${application.city}
- Experience: ${application.experience}
- Available Days: ${availabilityDisplay}
- Own Transport: ${application.ownTransport ? "Yes" : "No"}
- WhatsApp Available: ${application.whatsApp ? "Yes" : "No"}

Please review this application through the admin dashboard:
${applicationUrl}

Or view all pending applications:
${adminUrl}

© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
This is an automated message - please do not reply to this email.
`;

  return {
    subject: `New Cleaner Application: ${application.firstName} ${application.lastName}`,
    html,
    text,
  };
}

/**
 * Generate a welcome email template specifically for cleaners
 */
export function getCleanerWelcomeEmailTemplate(
  recipientEmail: string,
  user: {
    firstName: string;
    lastName: string;
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const loginUrl = `${data.appUrl}/auth/login`;
  const cleanerDashboardUrl = `${data.appUrl}/cleaner/dashboard`;
  const escapedEmail = escapeHtml(recipientEmail);

  // HTML Email template for cleaners
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${data.brandName} Cleaner Team</title>
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
    .checklist-item {
      display: flex;
      margin-bottom: 10px;
    }
    .checklist-icon {
      margin-right: 10px;
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
      <h2>Welcome to the ${data.brandName} Cleaner Team!</h2>
      <p>Hello ${user.firstName},</p>
      <p>Congratulations! Your application to join the ${data.brandName} team has been approved. We're excited to have you join our network of professional cleaners who deliver exceptional cleaning services to our customers.</p>
      
      <!-- <div class="feature">
        <p><strong>Your account has been activated</strong> and you can now log in to access your cleaner dashboard.</p>
      </div>
      
      <h3>Getting Started:</h3>
      
      <div class="checklist-item">
        <div class="checklist-icon">✓</div>
        <div><strong>Log in to your account</strong> using your email and password</div>
      </div>
      
      <div class="checklist-item">
        <div class="checklist-icon">✓</div>
        <div><strong>Complete your profile</strong> to highlight your skills and experience</div>
      </div>
      
      <div class="checklist-item">
        <div class="checklist-icon">✓</div>
        <div><strong>Set your availability</strong> to start receiving booking requests</div>
      </div>
      
      <div class="checklist-item">
        <div class="checklist-icon">✓</div>
        <div><strong>Update your service areas</strong> to specify where you can work</div>
      </div>
      
      <div style="text-align: center;">
        <a href="${loginUrl}" class="btn">Log In To Your Account</a>
      </div>
      
      <p>Once logged in, you can access your cleaner dashboard to:</p>
      <ul>
        <li>Manage your bookings and schedule</li>
        <li>Update your availability and service areas</li>
        <li>View your ratings and feedback</li>
        <li>Track your earnings</li>
      </ul> -->
      
      <p>If you have any questions or need assistance getting started, please don't hesitate to contact our cleaner support team.</p>
      
      <p>We look forward to your success with ${data.brandName}!</p>
      
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
Welcome to the ${data.brandName} Cleaner Team!

Hello ${user.firstName},

Congratulations! Your application to join the ${data.brandName} team has been approved. We're excited to have you join our network of professional cleaners who deliver exceptional cleaning services to our customers.

Your account has been activated and you can now log in to access your cleaner dashboard.

Getting Started:
✓ Log in to your account using your email and password
✓ Complete your profile to highlight your skills and experience
✓ Set your availability to start receiving booking requests
✓ Update your service areas to specify where you can work

Log in here: ${loginUrl}

Once logged in, you can access your cleaner dashboard to:
- Manage your bookings and schedule
- Update your availability and service areas
- View your ratings and feedback
- Track your earnings

If you have any questions or need assistance getting started, please don't hesitate to contact our cleaner support team.

We look forward to your success with ${data.brandName}!

Best regards,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Welcome to the ${data.brandName} Cleaner Team!`,
    html,
    text,
  };
}

/**
 * Generate an email template for notifying cleaners about a new assignment
 */
export function getCleanerJobAssignmentTemplate(
  recipientEmail: string,
  booking: {
    id: string;
    service: {
      name: string;
      description?: string;
      details?: any;
    };
    scheduledDate: string;
    address: { street: string; city: string; state: string; zipCode: string };
    customer: {
      firstName: string;
      lastName: string;
      phone?: string;
    };
    notes?: string;
    duration?: number;
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const bookingUrl = `${data.appUrl}/cleaner/bookings/${booking.id}`;
  const escapedEmail = escapeHtml(recipientEmail);

  // Parse without timezone conversion
  const scheduledDate = parseDateTimeString(booking.scheduledDate);

  // Format date
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
    hour12: false,
  });

  // Parse service details if they exist (could be a JSON string)
  let serviceDetailsList = "";
  if (booking.service.details) {
    try {
      const details =
        typeof booking.service.details === "string"
          ? JSON.parse(booking.service.details)
          : booking.service.details;

      if (Array.isArray(details.tasks)) {
        serviceDetailsList = `
          <ul style="margin-top: 10px; padding-left: 20px;">
            ${details.tasks.map((task) => `<li>${task}</li>`).join("")}
          </ul>
        `;
      }
    } catch (e) {
      console.error("Error parsing service details:", e);
    }
  }

  // HTML Email template
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>A Cleaning Job Has Been Assigned to You ✨🧹</title>
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
    .customer-box {
      background-color: #f9f9f9;
      border-radius: 4px;
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
    .important-note {
      background-color: #FFEBEE;
      border-left: 4px solid #F44336;
      padding: 12px;
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
      <h2>New Cleaning Assignment</h2>
      <p>Hello,</p>
      <p>You have been assigned to a new cleaning job. Here are all the details you need to know:</p>
      
      <div class="customer-box">
        <h3 style="margin-top: 0; color: #333333; font-size: 16px;">Customer Information:</h3>
        <p><strong>Name:</strong> ${booking.customer.firstName} ${booking.customer.lastName}</p>
        ${booking.customer.phone ? `<p><strong>Phone:</strong> ${booking.customer.phone}</p>` : ""}
      </div>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #333333; font-size: 16px;">Booking Details:</h3>
        <div class="booking-detail">
          <span class="label">Service Type:</span>
          <span><strong>${booking.service.name}</strong></span>
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
        
        ${
          booking.duration
            ? `
        <div class="booking-detail">
          <span class="label">Duration:</span>
          <span>${Math.floor(booking.duration / 60)} ${Math.floor(booking.duration / 60) === 1 ? "hour" : "hours"}</span>
        </div>
        `
            : ""
        }
      </div>
      
      <div class="booking-details">
        <h3 style="margin-top: 0; color: #333333; font-size: 16px;">Service Details:</h3>
        ${
          booking.service.description
            ? `
        <div class="booking-detail">
          <span class="label">Description:</span>
          <span>${booking.service.description}</span>
        </div>
        `
            : ""
        }
        
        ${
          serviceDetailsList
            ? `
        <div class="booking-detail">
          <span class="label">Tasks to complete:</span>
          ${serviceDetailsList}
        </div>
        `
            : ""
        }
        
        ${
          booking.notes
            ? `
        <div class="booking-detail">
          <span class="label">Customer Notes:</span>
          <span>${booking.notes}</span>
        </div>
        `
            : ""
        }
      </div>
      
      ${
        booking.notes
          ? `
      <div class="important-note">
        <p><strong>Important:</strong> Please review the customer's notes carefully as they contain specific instructions for this job.</p>
      </div>
      `
          : ""
      }
      
      <p>You can view all the booking details and check in for this job by clicking the button below:</p>
      
      <div style="text-align: center;">
        <a href="${bookingUrl}" class="btn">View Booking Details</a>
      </div>
      
      <p><strong>Please confirm this assignment</strong> by logging into your account. If you have any questions or concerns about this assignment, please contact the office immediately.</p>

      <p>For help please WhatsApp our support team with booking details on this number <a herf="https://wa.me/0693915277">0693915277</a></p>
      
      <p>Thank you for your excellent service!</p>
      
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
New Cleaning Assignment - ${data.brandName}

Hello,

You have been assigned to a new cleaning job. Here are all the details you need to know:

CUSTOMER INFORMATION:
Name: ${booking.customer.firstName} ${booking.customer.lastName}
${booking.customer.phone ? `Phone: ${booking.customer.phone}` : ""}

BOOKING DETAILS:
Service Type: ${booking.service.name}
Date: ${dateString}
Time: ${timeString}
Location: ${booking.address.street}, ${booking.address.city}, ${booking.address.state}, ${booking.address.zipCode}
${booking.duration ? `Duration: ${Math.floor(booking.duration / 60)} ${Math.floor(booking.duration / 60) === 1 ? "hour" : "hours"}` : ""}

SERVICE DETAILS:
${booking.service.description ? `Description: ${booking.service.description}` : ""}

${booking.notes ? `Customer Notes: ${booking.notes}` : ""}

${booking.notes ? `IMPORTANT: Please review the customer's notes carefully as they contain specific instructions for this job.` : ""}

You can view all the booking details and check in for this job here:
${bookingUrl}

Please confirm this assignment by logging into your account. If you have any questions or concerns about this assignment, please contact the office immediately.

Thank you for your excellent service!

Best regards,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `New Cleaning Assignment - ${dateString} - ${data.brandName}`,
    html,
    text,
  };
}

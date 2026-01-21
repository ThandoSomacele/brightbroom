// src/lib/server/email-templates.ts
import { parseDateTimeString } from "$lib/utils/date-utils";
import { escapeHtml, getBookingReference } from "$lib/utils/strings";

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
    service: { name: string; description?: string };
    scheduledDate: string;
    address: { street: string; city: string; state: string; zipCode: string };
    price: number | string;
    // Room-based pricing details
    bedroomCount?: number;
    bathroomCount?: number;
    // Add-ons
    addons?: Array<{ name: string; price: number | string }>;
    // Duration in minutes
    durationMinutes?: number;
    // Cleaner info
    cleaner?: { firstName: string; lastName: string } | null;
    // Special instructions
    notes?: string;
    // Recurring booking details
    isRecurring?: boolean;
    recurringFrequency?: string;
    recurringDays?: string[];
    recurringTimeSlot?: string;
    discountPercentage?: number;
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

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
  };

  // Format recurring frequency
  const formatFrequency = (freq: string): string => {
    switch (freq) {
      case 'WEEKLY': return 'Weekly';
      case 'BIWEEKLY': return 'Every 2 Weeks';
      case 'TWICE_WEEKLY': return 'Twice Weekly';
      case 'TWICE_MONTHLY': return 'Twice Monthly';
      default: return freq;
    }
  };

  // Build room description
  const roomDescription = booking.bedroomCount && booking.bathroomCount
    ? `${booking.bedroomCount} bedroom${booking.bedroomCount > 1 ? 's' : ''}, ${booking.bathroomCount} bathroom${booking.bathroomCount > 1 ? 's' : ''}`
    : null;

  // Build add-ons HTML
  const addonsHtml = booking.addons && booking.addons.length > 0
    ? booking.addons.map(addon => {
        const addonPrice = typeof addon.price === 'number' ? addon.price.toFixed(2) : addon.price;
        return `<li style="margin-bottom: 4px;">${escapeHtml(addon.name)} (+R${addonPrice})</li>`;
      }).join('')
    : null;

  // Build add-ons text
  const addonsText = booking.addons && booking.addons.length > 0
    ? booking.addons.map(addon => {
        const addonPrice = typeof addon.price === 'number' ? addon.price.toFixed(2) : addon.price;
        return `  - ${addon.name} (+R${addonPrice})`;
      }).join('\n')
    : null;

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
      ${booking.cleaner ? `<p>Your cleaner <strong>${escapeHtml(booking.cleaner.firstName)} ${escapeHtml(booking.cleaner.lastName)}</strong> has been assigned to your booking.</p>` : `<p>You will shortly receive notification of your assigned cleaner and their details.</p>`}

      <div class="booking-details">
        <div class="booking-detail">
          <span class="label">Booking Reference:</span>
          <span style="font-family: monospace; font-weight: bold;">#${getBookingReference(booking.id)}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Service:</span>
          <span>${booking.service.name}</span>
        </div>
        ${roomDescription ? `
        <div class="booking-detail">
          <span class="label">Rooms:</span>
          <span>${roomDescription}</span>
        </div>
        ` : ''}
        ${addonsHtml ? `
        <div class="booking-detail">
          <span class="label">Add-ons:</span>
          <ul style="margin: 5px 0 0 0; padding-left: 20px;">${addonsHtml}</ul>
        </div>
        ` : ''}
        ${booking.durationMinutes ? `
        <div class="booking-detail">
          <span class="label">Estimated Duration:</span>
          <span>${formatDuration(booking.durationMinutes)}</span>
        </div>
        ` : ''}
        ${booking.isRecurring && booking.recurringFrequency ? `
        <div class="booking-detail">
          <span class="label">Schedule:</span>
          <span>${formatFrequency(booking.recurringFrequency)}${booking.recurringDays && booking.recurringDays.length > 0 ? ` on ${booking.recurringDays.join(', ')}` : ''}${booking.recurringTimeSlot ? ` at ${booking.recurringTimeSlot}` : ''}</span>
        </div>
        ${booking.discountPercentage ? `
        <div class="booking-detail">
          <span class="label">Recurring Discount:</span>
          <span style="color: #22c55e; font-weight: bold;">${booking.discountPercentage}% off</span>
        </div>
        ` : ''}
        ` : `
        <div class="booking-detail">
          <span class="label">Date:</span>
          <span>${dateString}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Time:</span>
          <span>${timeString}</span>
        </div>
        `}
        <div class="booking-detail">
          <span class="label">Location:</span>
          <span>${booking.address.street}, ${booking.address.city}, ${booking.address.state}, ${booking.address.zipCode}</span>
        </div>
        <div class="booking-detail">
          <span class="label">Total:</span>
          <span style="font-weight: bold; font-size: 1.1em;">R${formattedPrice}</span>
        </div>
      </div>

      ${booking.notes ? `
      <div style="background-color: #fef3c7; border-radius: 4px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-weight: bold; color: #92400e;">Special Instructions:</p>
        <p style="margin: 8px 0 0 0; color: #78350f;">${escapeHtml(booking.notes)}</p>
      </div>
      ` : ''}

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
${booking.cleaner ? `\nYour cleaner ${booking.cleaner.firstName} ${booking.cleaner.lastName} has been assigned to your booking.` : '\nYou will shortly receive notification of your assigned cleaner and their details.'}

Booking Details:
----------------
Booking Reference: #${getBookingReference(booking.id)}
Service: ${booking.service.name}
${roomDescription ? `Rooms: ${roomDescription}\n` : ''}${addonsText ? `Add-ons:\n${addonsText}\n` : ''}${booking.durationMinutes ? `Estimated Duration: ${formatDuration(booking.durationMinutes)}\n` : ''}${booking.isRecurring && booking.recurringFrequency ? `Schedule: ${formatFrequency(booking.recurringFrequency)}${booking.recurringDays && booking.recurringDays.length > 0 ? ` on ${booking.recurringDays.join(', ')}` : ''}${booking.recurringTimeSlot ? ` at ${booking.recurringTimeSlot}` : ''}\n${booking.discountPercentage ? `Recurring Discount: ${booking.discountPercentage}% off\n` : ''}` : `Date: ${dateString}\nTime: ${timeString}\n`}Location: ${booking.address.street}, ${booking.address.city}, ${booking.address.state}, ${booking.address.zipCode}
Total: R${formattedPrice}
${booking.notes ? `\nSpecial Instructions:\n${booking.notes}\n` : ''}
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
Booking Reference: #${getBookingReference(booking.id)}
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
): { subject: string; html: string; text: string; replyTo: string } {
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
  const escapedEmail = escapeHtml(application.email);

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
    replyTo: escapedEmail,
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

      <p>For help please WhatsApp our support team with booking details on this number <a href="https://wa.me/0693915277">0693915277</a></p>
      
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

/**
 * CORE TEMPLATE - Generate subscription activated email
 * Sent when the first payment succeeds and subscription becomes active
 */
export function getSubscriptionActivatedTemplate(
  recipientEmail: string,
  subscription: {
    id: string;
    service: { name: string };
    frequency: string;
    finalPrice: number | string;
    preferredDays?: string[];
    preferredTimeSlot?: string;
    nextBillingDate?: string;
    // Room-based pricing details
    bedroomCount?: number;
    bathroomCount?: number;
    // Add-ons
    addons?: Array<{ name: string; price: number | string }>;
    // Duration in minutes
    durationMinutes?: number;
    // Discount info
    discountPercentage?: number;
    basePrice?: number | string;
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const subscriptionUrl = `${data.appUrl}/profile/subscriptions`;
  const escapedEmail = escapeHtml(recipientEmail);

  // Format frequency
  const frequencyMap: Record<string, string> = {
    'WEEKLY': 'Weekly',
    'BIWEEKLY': 'Every 2 weeks',
    'TWICE_WEEKLY': 'Twice per week',
    'TWICE_MONTHLY': 'Twice per month',
  };
  const frequencyDisplay = frequencyMap[subscription.frequency] || subscription.frequency;

  // Format days
  const daysDisplay = subscription.preferredDays && subscription.preferredDays.length > 0
    ? subscription.preferredDays.map((d: string) => d.charAt(0) + d.slice(1).toLowerCase()).join(', ')
    : '';

  // Format price
  const formattedPrice = typeof subscription.finalPrice === 'number'
    ? subscription.finalPrice.toFixed(2)
    : subscription.finalPrice.toString();

  // Format base price (before discount)
  const formattedBasePrice = subscription.basePrice
    ? typeof subscription.basePrice === 'number'
      ? subscription.basePrice.toFixed(2)
      : subscription.basePrice.toString()
    : null;

  // Format next billing date
  const nextBillingDisplay = subscription.nextBillingDate
    ? new Date(subscription.nextBillingDate).toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Will be scheduled after first cleaning';

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${hours} hr${hours > 1 ? 's' : ''} ${mins} min`;
  };

  // Build room description
  const roomDescription = subscription.bedroomCount && subscription.bathroomCount
    ? `${subscription.bedroomCount} bedroom${subscription.bedroomCount > 1 ? 's' : ''}, ${subscription.bathroomCount} bathroom${subscription.bathroomCount > 1 ? 's' : ''}`
    : null;

  // Build add-ons HTML
  const addonsHtml = subscription.addons && subscription.addons.length > 0
    ? subscription.addons.map(addon => {
        const addonPrice = typeof addon.price === 'number' ? addon.price.toFixed(2) : addon.price;
        return `<li style="margin-bottom: 4px;">${escapeHtml(addon.name)} (+R${addonPrice})</li>`;
      }).join('')
    : null;

  // Build add-ons text
  const addonsText = subscription.addons && subscription.addons.length > 0
    ? subscription.addons.map(addon => {
        const addonPrice = typeof addon.price === 'number' ? addon.price.toFixed(2) : addon.price;
        return `  - ${addon.name} (+R${addonPrice})`;
      }).join('\n')
    : null;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Activated</title>
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
    .success-box {
      background-color: #E8F5E9;
      border-left: 4px solid #4CAF50;
      padding: 15px;
      margin: 20px 0;
      text-align: center;
    }
    .subscription-details {
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
      <h2>Your Subscription is Active! 🎉</h2>
      <p>Hello,</p>

      <div class="success-box">
        <p style="font-size: 18px; font-weight: bold; margin: 0; color: #2E7D32;">
          ✓ Subscription Successfully Activated
        </p>
      </div>

      <p>Great news! Your recurring cleaning service subscription has been activated. Your first payment has been processed successfully.</p>

      <div class="subscription-details">
        <div class="detail-row">
          <span class="label">Service:</span>
          <span>${subscription.service.name}</span>
        </div>
        ${roomDescription ? `
        <div class="detail-row">
          <span class="label">Rooms:</span>
          <span>${roomDescription}</span>
        </div>
        ` : ''}
        ${addonsHtml ? `
        <div class="detail-row">
          <span class="label">Add-ons:</span>
          <ul style="margin: 5px 0 0 0; padding-left: 20px;">${addonsHtml}</ul>
        </div>
        ` : ''}
        ${subscription.durationMinutes ? `
        <div class="detail-row">
          <span class="label">Estimated Duration:</span>
          <span>${formatDuration(subscription.durationMinutes)}</span>
        </div>
        ` : ''}
        <div class="detail-row">
          <span class="label">Frequency:</span>
          <span>${frequencyDisplay}${daysDisplay ? ` (${daysDisplay})` : ''}</span>
        </div>
        ${subscription.preferredTimeSlot ? `
        <div class="detail-row">
          <span class="label">Time:</span>
          <span>${subscription.preferredTimeSlot}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="label">Price per cleaning:</span>
          ${subscription.discountPercentage && formattedBasePrice ? `
          <span>
            <span style="text-decoration: line-through; color: #999;">R${formattedBasePrice}</span>
            <span style="font-weight: bold;">R${formattedPrice}</span>
            <span style="color: #22c55e; font-weight: bold;">(${subscription.discountPercentage}% off)</span>
          </span>
          ` : `<span style="font-weight: bold;">R${formattedPrice}</span>`}
        </div>
        <div class="detail-row">
          <span class="label">Next billing date:</span>
          <span>${nextBillingDisplay}</span>
        </div>
      </div>

      <h3>What happens next?</h3>
      <ul>
        <li>We'll automatically create bookings based on your schedule</li>
        <li>You'll receive notifications before each cleaning</li>
        <li>Payments will be processed automatically on your billing date</li>
        <li>You can pause or cancel anytime with 48 hours notice</li>
      </ul>

      <div style="text-align: center;">
        <a href="${subscriptionUrl}" class="btn">Manage My Subscription</a>
      </div>

      <p>Thank you for subscribing to ${data.brandName}! We look forward to keeping your space clean and fresh.</p>

      <p>Best regards,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Subscription Activated - ${data.brandName}

Hello,

✓ SUBSCRIPTION SUCCESSFULLY ACTIVATED

Great news! Your recurring cleaning service subscription has been activated. Your first payment has been processed successfully.

Subscription Details:
---------------------
- Service: ${subscription.service.name}
${roomDescription ? `- Rooms: ${roomDescription}\n` : ''}${addonsText ? `- Add-ons:\n${addonsText}\n` : ''}${subscription.durationMinutes ? `- Estimated Duration: ${formatDuration(subscription.durationMinutes)}\n` : ''}- Frequency: ${frequencyDisplay}${daysDisplay ? ` (${daysDisplay})` : ''}
${subscription.preferredTimeSlot ? `- Time: ${subscription.preferredTimeSlot}\n` : ''}- Price per cleaning: ${subscription.discountPercentage && formattedBasePrice ? `R${formattedBasePrice} → R${formattedPrice} (${subscription.discountPercentage}% off)` : `R${formattedPrice}`}
- Next billing date: ${nextBillingDisplay}

What happens next?
- We'll automatically create bookings based on your schedule
- You'll receive notifications before each cleaning
- Payments will be processed automatically on your billing date
- You can pause or cancel anytime with 48 hours notice

Manage your subscription here: ${subscriptionUrl}

Thank you for subscribing to ${data.brandName}! We look forward to keeping your space clean and fresh.

Best regards,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Your ${data.brandName} Subscription is Active!`,
    html,
    text,
  };
}

/**
 * CORE TEMPLATE - Generate subscription payment failed email
 * Sent when a recurring payment fails
 */
export function getSubscriptionPaymentFailedTemplate(
  recipientEmail: string,
  subscription: {
    id: string;
    service: { name: string };
    frequency: string;
    finalPrice: number | string;
  },
  failureReason?: string,
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const subscriptionUrl = `${data.appUrl}/profile/subscriptions`;
  const escapedEmail = escapeHtml(recipientEmail);

  // Format frequency
  const frequencyMap: Record<string, string> = {
    'WEEKLY': 'Weekly',
    'BIWEEKLY': 'Every 2 weeks',
    'TWICE_WEEKLY': 'Twice per week',
    'TWICE_MONTHLY': 'Twice per month',
  };
  const frequencyDisplay = frequencyMap[subscription.frequency] || subscription.frequency;

  // Format price
  const formattedPrice = typeof subscription.finalPrice === 'number'
    ? subscription.finalPrice.toFixed(2)
    : subscription.finalPrice.toString();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Payment Failed</title>
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
    .alert-box {
      background-color: #FFEBEE;
      border-left: 4px solid #F44336;
      padding: 15px;
      margin: 20px 0;
    }
    .subscription-details {
      background-color: #f9f9f9;
      border-radius: 4px;
      padding: 20px;
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
      <h2>Subscription Payment Failed</h2>
      <p>Hello,</p>

      <div class="alert-box">
        <p style="font-weight: bold; margin: 0 0 10px 0;">⚠️ Action Required</p>
        <p style="margin: 0;">We were unable to process your recent subscription payment for ${subscription.service.name} (${frequencyDisplay}).</p>
      </div>

      ${failureReason ? `<p><strong>Reason:</strong> ${failureReason}</p>` : ''}

      <p><strong>Amount due:</strong> R${formattedPrice}</p>

      <p>To continue your subscription without interruption, please update your payment method or retry the payment.</p>

      <h3>What you need to do:</h3>
      <ol>
        <li>Log in to your account</li>
        <li>Go to your subscription settings</li>
        <li>Update your payment method or retry payment</li>
      </ol>

      <div style="text-align: center;">
        <a href="${subscriptionUrl}" class="btn">Update Payment Method</a>
      </div>

      <p><strong>Note:</strong> If we cannot process your payment, your subscription may be paused or cancelled after multiple failed attempts.</p>

      <p>If you need assistance, please contact our support team.</p>

      <p>Best regards,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Subscription Payment Failed - ${data.brandName}

Hello,

⚠️ ACTION REQUIRED

We were unable to process your recent subscription payment for ${subscription.service.name} (${frequencyDisplay}).

${failureReason ? `Reason: ${failureReason}\n` : ''}
Amount due: R${formattedPrice}

To continue your subscription without interruption, please update your payment method or retry the payment.

What you need to do:
1. Log in to your account
2. Go to your subscription settings
3. Update your payment method or retry payment

Update payment method here: ${subscriptionUrl}

Note: If we cannot process your payment, your subscription may be paused or cancelled after multiple failed attempts.

If you need assistance, please contact our support team.

Best regards,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Action Required: ${data.brandName} Subscription Payment Failed`,
    html,
    text,
  };
}

/**
 * CORE TEMPLATE - Generate subscription cancelled email
 * Sent when subscription is cancelled
 */
export function getSubscriptionCancelledTemplate(
  recipientEmail: string,
  subscription: {
    id: string;
    service: { name: string };
    frequency: string;
  },
  cancelledBy: 'user' | 'system',
  reason?: string,
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const bookingUrl = `${data.appUrl}/book`;
  const escapedEmail = escapeHtml(recipientEmail);

  // Format frequency
  const frequencyMap: Record<string, string> = {
    'WEEKLY': 'Weekly',
    'BIWEEKLY': 'Every 2 weeks',
    'TWICE_WEEKLY': 'Twice per week',
    'TWICE_MONTHLY': 'Twice per month',
  };
  const frequencyDisplay = frequencyMap[subscription.frequency] || subscription.frequency;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Cancelled</title>
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
    .info-box {
      background-color: #FFF9C4;
      border-left: 4px solid #FBC02D;
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
      <h2>Subscription Cancelled</h2>
      <p>Hello,</p>

      <div class="info-box">
        <p style="font-weight: bold; margin: 0 0 10px 0;">Your subscription has been cancelled</p>
        <p style="margin: 0;">Service: ${subscription.service.name} (${frequencyDisplay})</p>
      </div>

      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}

      <p>Your subscription has been ${cancelledBy === 'user' ? 'cancelled as requested' : 'cancelled'}. No further payments will be processed.</p>

      <h3>What this means:</h3>
      <ul>
        <li>No more automatic bookings will be created</li>
        <li>No further payments will be charged</li>
        <li>Any existing upcoming bookings will remain scheduled</li>
      </ul>

      <p>We're sorry to see you go! If you cancelled due to an issue with our service, we'd love to hear your feedback so we can improve.</p>

      <p>You can always start a new subscription or book one-time cleanings whenever you need:</p>

      <div style="text-align: center;">
        <a href="${bookingUrl}" class="btn">Book a Cleaning</a>
      </div>

      <p>Thank you for choosing ${data.brandName}. We hope to serve you again in the future!</p>

      <p>Best regards,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Subscription Cancelled - ${data.brandName}

Hello,

Your subscription has been cancelled.
Service: ${subscription.service.name} (${frequencyDisplay})

${reason ? `Reason: ${reason}\n` : ''}
Your subscription has been ${cancelledBy === 'user' ? 'cancelled as requested' : 'cancelled'}. No further payments will be processed.

What this means:
- No more automatic bookings will be created
- No further payments will be charged
- Any existing upcoming bookings will remain scheduled

We're sorry to see you go! If you cancelled due to an issue with our service, we'd love to hear your feedback so we can improve.

You can always start a new subscription or book one-time cleanings whenever you need:
${bookingUrl}

Thank you for choosing ${data.brandName}. We hope to serve you again in the future!

Best regards,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Subscription Cancelled - ${data.brandName}`,
    html,
    text,
  };
}

/**
 * OPTIONAL TEMPLATE - Generate subscription paused email
 * Sent when subscription is paused by user
 */
export function getSubscriptionPausedTemplate(
  recipientEmail: string,
  subscription: {
    id: string;
    service: { name: string };
    frequency: string;
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const subscriptionUrl = `${data.appUrl}/profile/subscriptions`;
  const escapedEmail = escapeHtml(recipientEmail);

  const frequencyMap: Record<string, string> = {
    'WEEKLY': 'Weekly',
    'BIWEEKLY': 'Every 2 weeks',
    'TWICE_WEEKLY': 'Twice per week',
    'TWICE_MONTHLY': 'Twice per month',
  };
  const frequencyDisplay = frequencyMap[subscription.frequency] || subscription.frequency;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Paused</title>
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
    .info-box {
      background-color: #E3F2FD;
      border-left: 4px solid #2196F3;
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
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">${data.brandName}</h1>
    </div>
    <div class="content">
      <h2>Subscription Paused</h2>
      <p>Hello,</p>

      <div class="info-box">
        <p style="font-weight: bold; margin: 0 0 10px 0;">Your subscription has been paused</p>
        <p style="margin: 0;">Service: ${subscription.service.name} (${frequencyDisplay})</p>
      </div>

      <p>Your subscription has been paused as requested. No new bookings will be created and no payments will be processed while your subscription is paused.</p>

      <p>You can resume your subscription anytime from your account.</p>

      <div style="text-align: center;">
        <a href="${subscriptionUrl}" class="btn">Resume Subscription</a>
      </div>

      <p>Best regards,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Subscription Paused - ${data.brandName}

Hello,

Your subscription has been paused.
Service: ${subscription.service.name} (${frequencyDisplay})

Your subscription has been paused as requested. No new bookings will be created and no payments will be processed while your subscription is paused.

You can resume your subscription anytime from your account: ${subscriptionUrl}

Best regards,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Subscription Paused - ${data.brandName}`,
    html,
    text,
  };
}

/**
 * OPTIONAL TEMPLATE - Generate subscription resumed email
 * Sent when subscription is resumed by user
 */
export function getSubscriptionResumedTemplate(
  recipientEmail: string,
  subscription: {
    id: string;
    service: { name: string };
    frequency: string;
    nextBillingDate?: string;
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const subscriptionUrl = `${data.appUrl}/profile/subscriptions`;
  const escapedEmail = escapeHtml(recipientEmail);

  const frequencyMap: Record<string, string> = {
    'WEEKLY': 'Weekly',
    'BIWEEKLY': 'Every 2 weeks',
    'TWICE_WEEKLY': 'Twice per week',
    'TWICE_MONTHLY': 'Twice per month',
  };
  const frequencyDisplay = frequencyMap[subscription.frequency] || subscription.frequency;

  const nextBillingDisplay = subscription.nextBillingDate
    ? new Date(subscription.nextBillingDate).toLocaleDateString('en-ZA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Will be scheduled soon';

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Resumed</title>
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
    .success-box {
      background-color: #E8F5E9;
      border-left: 4px solid #4CAF50;
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
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1 style="color: #ffffff; margin: 0;">${data.brandName}</h1>
    </div>
    <div class="content">
      <h2>Subscription Resumed! 🎉</h2>
      <p>Hello,</p>

      <div class="success-box">
        <p style="font-weight: bold; margin: 0 0 10px 0;">Your subscription is active again</p>
        <p style="margin: 0;">Service: ${subscription.service.name} (${frequencyDisplay})</p>
      </div>

      <p>Your subscription has been resumed and is now active. We'll continue creating bookings based on your schedule.</p>

      <p><strong>Next billing date:</strong> ${nextBillingDisplay}</p>

      <div style="text-align: center;">
        <a href="${subscriptionUrl}" class="btn">View Subscription</a>
      </div>

      <p>Welcome back! We're happy to continue serving you.</p>

      <p>Best regards,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Subscription Resumed - ${data.brandName}

Hello,

Your subscription is active again!
Service: ${subscription.service.name} (${frequencyDisplay})

Your subscription has been resumed and is now active. We'll continue creating bookings based on your schedule.

Next billing date: ${nextBillingDisplay}

View subscription: ${subscriptionUrl}

Welcome back! We're happy to continue serving you.

Best regards,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Subscription Resumed - ${data.brandName}`,
    html,
    text,
  };
}

/**
 * Generate a cleaner changed notification email template
 * Sent when a different cleaner is assigned than the customer's preference
 */
export function getCleanerChangedTemplate(
  recipientEmail: string,
  booking: {
    id: string;
    service: {
      name: string;
    };
    scheduledDate: string;
    address: { street: string; city: string; state: string; zipCode: string };
    originalCleaner: {
      firstName: string;
      lastName: string;
    } | null;
    newCleaner: {
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
  },
  data: EmailTemplateData,
): { subject: string; html: string; text: string } {
  const bookingUrl = `${data.appUrl}/profile/bookings/${booking.id}`;
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

  const originalCleanerName = booking.originalCleaner
    ? `${booking.originalCleaner.firstName} ${booking.originalCleaner.lastName}`
    : "your preferred cleaner";

  const newCleanerName = `${booking.newCleaner.firstName} ${booking.newCleaner.lastName}`;

  // Default avatar SVG for cleaners without profile images
  const defaultAvatarSvg = `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="30" fill="#E5E7EB"/>
    <path d="M30 15C25.0294 15 21 19.0294 21 24C21 28.9706 25.0294 33 30 33C34.9706 33 39 28.9706 39 24C39 19.0294 34.9706 15 30 15ZM30 39C22.5 39 15 42.5147 15 48V51H45V48C45 42.5147 37.5 39 30 39Z" fill="#9CA3AF"/>
  </svg>`;

  const profileImageUrl = booking.newCleaner.profileImageUrl;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cleaner Update for Your Booking</title>
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
    .notice-box {
      background-color: #fef3c7;
      border: 1px solid #f59e0b;
      border-radius: 8px;
      padding: 15px;
      margin: 20px 0;
    }
    .notice-box p {
      margin: 0;
      color: #92400e;
    }
    .cleaner-box {
      background-color: #f0fdf4;
      border: 1px solid #22c55e;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }
    .cleaner-image {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      margin: 0 auto 10px;
      object-fit: cover;
      border: 3px solid ${data.primaryColor};
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
      <h2>Cleaner Update for Your Booking</h2>
      <p>Hello,</p>

      <div class="notice-box">
        <p><strong>Important:</strong> Due to scheduling and transport logistics, we've assigned a different cleaner to your upcoming booking.</p>
      </div>

      <p>We understand you requested <strong>${originalCleanerName}</strong>, but they are unfortunately unavailable for this appointment. We've assigned another excellent cleaner who will take great care of your home.</p>

      <div class="cleaner-box">
        <h3 style="margin-top: 0; color: #166534;">Your Assigned Cleaner</h3>
        ${
          profileImageUrl
            ? `<img src="${profileImageUrl}" alt="${newCleanerName}" class="cleaner-image" />`
            : `<div style="width: 80px; height: 80px; margin: 0 auto 10px; border-radius: 50%; overflow: hidden;">${defaultAvatarSvg}</div>`
        }
        <p style="font-size: 18px; font-weight: bold; margin: 10px 0 0;">${newCleanerName}</p>
      </div>

      <div class="booking-details">
        <h3 style="margin-top: 0; color: #333333;">Booking Details</h3>
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
          <span class="label">Address:</span>
          <span>${booking.address.street}, ${booking.address.city}</span>
        </div>
      </div>

      <p>All our cleaners are thoroughly vetted and trained to the same high standards, so you can expect the same quality service.</p>

      <div style="text-align: center;">
        <a href="${bookingUrl}" class="btn">View Booking Details</a>
      </div>

      <p>If you have any questions or concerns, please don't hesitate to contact us.</p>

      <p>Thank you for your understanding,<br>The ${data.brandName} Team</p>
    </div>
    <div class="footer">
      <p>This email was sent to ${escapedEmail}.</p>
      <p>&copy; ${new Date().getFullYear()} ${data.brandName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const text = `
Cleaner Update for Your Booking - ${data.brandName}

Hello,

IMPORTANT: Due to scheduling and transport logistics, we've assigned a different cleaner to your upcoming booking.

We understand you requested ${originalCleanerName}, but they are unfortunately unavailable for this appointment. We've assigned another excellent cleaner who will take great care of your home.

YOUR ASSIGNED CLEANER: ${newCleanerName}

BOOKING DETAILS:
- Service: ${booking.service.name}
- Date: ${dateString}
- Time: ${timeString}
- Address: ${booking.address.street}, ${booking.address.city}

All our cleaners are thoroughly vetted and trained to the same high standards, so you can expect the same quality service.

View booking details: ${bookingUrl}

If you have any questions or concerns, please don't hesitate to contact us.

Thank you for your understanding,
The ${data.brandName} Team

This email was sent to ${recipientEmail}.
© ${new Date().getFullYear()} ${data.brandName}. All rights reserved.
`;

  return {
    subject: `Cleaner Update for Your Booking - ${data.brandName}`,
    html,
    text,
  };
}

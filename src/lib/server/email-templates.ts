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
  data: EmailTemplateData
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
    text
  };
}

/**
 * Generate a confirmation email for successful password reset
 */
export function getPasswordResetConfirmationTemplate(
  recipientEmail: string,
  data: EmailTemplateData
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
    text
  };
}

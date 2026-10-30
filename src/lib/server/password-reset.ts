// src/lib/server/password-reset.ts

import { db } from './db';
import { user, passwordResetToken } from './db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes } from 'crypto';
import { getPasswordResetTemplate, getPasswordResetConfirmationTemplate } from './email-templates';
import { 
  sendPasswordResetEmail as sendEmail,
  sendPasswordResetConfirmationEmail as sendConfirmationEmail
} from './email-service';

import { brand } from "$lib/config/brand";
import { brandColors } from "$lib/config/theme";
/**
 * Email template configuration
 * Make sure we have a failsafe URL if PUBLIC_URL is not defined
 */
const APP_URL = process.env.PUBLIC_URL || brand.siteUrl;

const EMAIL_CONFIG = {
  appUrl: APP_URL,
  brandName: brand.name,
  primaryColor: brandColors.primary,
  secondaryColor: brandColors.secondary
};

// Generate a secure token
export function generateResetToken(): string {
  const bytes = randomBytes(32);
  return bytes.toString('hex');
}

/**
 * Issue a single-use link token for this user, retiring any earlier ones.
 * Reset links last a day; first-time "set your password" links a week, since
 * a new cleaner may not read their welcome email straight away.
 */
async function issueToken(userId: string, expiresInHours: number): Promise<string> {
  await db.update(passwordResetToken)
    .set({ used: true })
    .where(eq(passwordResetToken.userId, userId));

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  await db.insert(passwordResetToken).values({
    id: crypto.randomUUID(),
    userId,
    token,
    expiresAt,
    used: false,
    createdAt: new Date()
  });
  return token;
}

// Create a password reset token for a user
export async function createPasswordResetToken(userEmail: string): Promise<string | null> {
  try {
    const [foundUser] = await db.select({ id: user.id })
      .from(user)
      .where(eq(user.email, userEmail))
      .limit(1);

    if (!foundUser) {
      return null; // User not found
    }
    return await issueToken(foundUser.id, 24);
  } catch (error) {
    console.error('Error creating password reset token:', error);
    return null;
  }
}

/**
 * A link token for an account an admin created: the person chooses their own
 * password instead of being given a temporary one. Valid for 7 days.
 */
export async function createPasswordSetupToken(userId: string): Promise<string> {
  return issueToken(userId, 7 * 24);
}

// Validate a reset token
export async function validateResetToken(token: string): Promise<{ valid: boolean; userId?: string }> {
  try {
    const tokens = await db.select()
      .from(passwordResetToken)
      .where(eq(passwordResetToken.token, token))
      .limit(1);
    
    if (tokens.length === 0) {
      return { valid: false };
    }
    
    const resetToken = tokens[0];
    
    // Check if token is expired or used
    const now = new Date();
    if (resetToken.expiresAt < now || resetToken.used) {
      return { valid: false };
    }
    
    return { 
      valid: true, 
      userId: resetToken.userId 
    };
  } catch (error) {
    console.error('Error validating reset token:', error);
    return { valid: false };
  }
}

// Reset password with a valid token
export async function resetPassword(token: string, newPassword: string): Promise<boolean> {
  try {
    // Validate token
    const { valid, userId } = await validateResetToken(token);
    
    if (!valid || !userId) {
      return false;
    }
    
    // Get user information for confirmation email
    const userData = await db.select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    if (userData.length === 0) {
      return false;
    }
    
    // Hash the new password
    const { Argon2id } = await import('oslo/password');
    const hasher = new Argon2id();
    const hashedPassword = await hasher.hash(newPassword);
    
    // Update user's password
    await db.update(user)
      .set({ 
        passwordHash: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId));
    
    // Mark token as used
    await db.update(passwordResetToken)
      .set({ used: true })
      .where(eq(passwordResetToken.token, token));
    
    // Send confirmation email
    await sendPasswordResetConfirmationEmail(userData[0].email);
    
    return true;
  } catch (error) {
    console.error('Error resetting password:', error);
    return false;
  }
}

/// Function to send reset email
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  // Log the email configuration to help with debugging
  console.log('Sending password reset email with config:', {
    appUrl: EMAIL_CONFIG.appUrl,
    email: email,
    tokenLength: resetToken.length
  });
  
  return sendEmail(email, resetToken);
}

// Function to send confirmation email after successful password reset
export async function sendPasswordResetConfirmationEmail(email: string): Promise<boolean> {
  return sendConfirmationEmail(email);
}

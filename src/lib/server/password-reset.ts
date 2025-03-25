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

/**
 * Email template configuration
 */
const EMAIL_CONFIG = {
  appUrl: process.env.PUBLIC_URL || 'http://localhost:5173',
  brandName: 'BrightBroom',
  primaryColor: '#20C3AF',
  secondaryColor: '#C2511F'
};

// Generate a secure token
export function generateResetToken(): string {
  const bytes = randomBytes(32);
  return bytes.toString('hex');
}

// Create a password reset token for a user
export async function createPasswordResetToken(userEmail: string): Promise<string | null> {
  try {
    // Find the user by email
    const users = await db.select()
      .from(user)
      .where(eq(user.email, userEmail))
      .limit(1);
    
    if (users.length === 0) {
      return null; // User not found
    }
    
    const foundUser = users[0];
    
    // Expire any existing tokens for this user
    await db.update(passwordResetToken)
      .set({ used: true })
      .where(eq(passwordResetToken.userId, foundUser.id));
    
    // Generate a new token
    const token = generateResetToken();
    
    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    // Store the token
    const [resetToken] = await db.insert(passwordResetToken)
      .values({
        id: crypto.randomUUID(),
        userId: foundUser.id,
        token,
        expiresAt,
        used: false,
        createdAt: new Date()
      })
      .returning();
    
    return token;
  } catch (error) {
    console.error('Error creating password reset token:', error);
    return null;
  }
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
  return sendEmail(email, resetToken);
}

// Function to send confirmation email after successful password reset
export async function sendPasswordResetConfirmationEmail(email: string): Promise<boolean> {
  return sendConfirmationEmail(email);
}

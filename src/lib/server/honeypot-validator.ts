// src/lib/server/honeypot-validator.ts

/**
 * Honeypot validation utility for detecting bot submissions
 * 
 * Simple explanation: Like a security guard checking if someone fell into hidden traps
 * Technical explanation: Validates that honeypot fields are empty and submission timing is realistic
 */

interface HoneypotValidationResult {
  isBot: boolean;
  reason?: string;
  suspiciousFields?: string[];
}

/**
 * Validate honeypot fields to detect bot submissions
 * @param formData The form data to validate
 * @param fieldPrefix Optional prefix for honeypot field names (default: "trap")
 * @returns Validation result indicating if this is likely a bot
 */
export function validateHoneypot(
  formData: FormData,
  fieldPrefix: string = "trap"
): HoneypotValidationResult {
  const honeypotFields = [
    `${fieldPrefix}_email`,
    `${fieldPrefix}_website`, 
    `${fieldPrefix}_phone`,
    `${fieldPrefix}_company`
  ];

  const suspiciousFields: string[] = [];

  // Check if any honeypot fields have been filled
  for (const field of honeypotFields) {
    const value = formData.get(field);
    if (value && value.toString().trim() !== "") {
      suspiciousFields.push(field);
    }
  }

  // If any honeypot fields are filled, it's definitely a bot
  if (suspiciousFields.length > 0) {
    return {
      isBot: true,
      reason: "Honeypot fields were filled",
      suspiciousFields
    };
  }

  // Check form submission timing (bots often submit too quickly)
  const formStartTime = formData.get("form_start_time");
  if (formStartTime) {
    const startTime = parseInt(formStartTime.toString());
    const currentTime = Date.now();
    const submissionTime = currentTime - startTime;

    // If form was submitted in less than 2 seconds, it's suspicious
    // (Humans need time to read and fill forms)
    if (submissionTime < 2000) {
      return {
        isBot: true,
        reason: "Form submitted too quickly",
        submissionTimeMs: submissionTime
      };
    }

    // If form took more than 2 hours, it's also suspicious
    // (Form might have been left open and auto-filled)
    if (submissionTime > 2 * 60 * 60 * 1000) {
      return {
        isBot: true,
        reason: "Form submission took too long",
        submissionTimeMinutes: Math.round(submissionTime / 60000)
      };
    }
  }

  // Additional bot detection: Check for common bot patterns
  
  // Check for suspicious email patterns
  const email = formData.get("email")?.toString().toLowerCase();
  if (email) {
    // Common bot email patterns
    const botEmailPatterns = [
      /test@test\.com/,
      /admin@admin\.com/,
      /noreply@/,
      /bot@/,
      /spam@/,
      /^[a-z]{1,3}@[a-z]{1,3}\.(com|net|org)$/  // Very short domains
    ];

    for (const pattern of botEmailPatterns) {
      if (pattern.test(email)) {
        return {
          isBot: true,
          reason: "Suspicious email pattern detected",
          email
        };
      }
    }
  }

  // Check for suspicious name patterns (bots often use patterns like "John Smith", "Test User")
  const firstName = formData.get("firstName")?.toString().toLowerCase();
  const lastName = formData.get("lastName")?.toString().toLowerCase();
  
  if (firstName && lastName) {
    const suspiciousNamePatterns = [
      "test",
      "admin", 
      "user",
      "demo",
      "sample",
      "example"
    ];

    const fullName = `${firstName} ${lastName}`;
    for (const pattern of suspiciousNamePatterns) {
      if (fullName.includes(pattern)) {
        return {
          isBot: true,
          reason: "Suspicious name pattern detected",
          fullName
        };
      }
    }
  }

  // Check for suspicious message content (only for contact forms)
  const message = formData.get("message")?.toString().toLowerCase();
  if (message) {
    const spamKeywords = [
      "seo",
      "bitcoin",
      "crypto",
      "loan",
      "casino",
      "pharmacy",
      "viagra",
      "cialis",
      "weight loss",
      "make money",
      "work from home",
      "click here",
      "limited time",
      "act now"
    ];

    for (const keyword of spamKeywords) {
      if (message.includes(keyword)) {
        return {
          isBot: true,
          reason: "Spam keyword detected",
          keyword
        };
      }
    }
  }

  // If all checks pass, it's likely a human
  return {
    isBot: false
  };
}

/**
 * Log bot detection for monitoring and analysis
 * @param validationResult The honeypot validation result
 * @param clientIP The client IP address
 * @param formType The type of form (contact, cleaner, etc.)
 * @param additionalData Any additional data to log
 */
export function logBotDetection(
  validationResult: HoneypotValidationResult,
  clientIP: string,
  formType: string,
  additionalData?: Record<string, any>
): void {
  if (validationResult.isBot) {
    console.warn(`🤖 Bot detected on ${formType} form:`, {
      ip: clientIP,
      reason: validationResult.reason,
      suspiciousFields: validationResult.suspiciousFields,
      timestamp: new Date().toISOString(),
      formType,
      ...additionalData
    });
  }
}

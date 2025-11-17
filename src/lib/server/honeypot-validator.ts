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
  const firstName = formData.get("firstName")?.toString();
  const lastName = formData.get("lastName")?.toString();

  if (firstName && lastName) {
    const firstNameLower = firstName.toLowerCase();
    const lastNameLower = lastName.toLowerCase();

    // Check for common suspicious patterns
    const suspiciousNamePatterns = [
      "test",
      "admin",
      "user",
      "demo",
      "sample",
      "example"
    ];

    const fullName = `${firstNameLower} ${lastNameLower}`;
    for (const pattern of suspiciousNamePatterns) {
      if (fullName.includes(pattern)) {
        return {
          isBot: true,
          reason: "Suspicious name pattern detected",
          fullName
        };
      }
    }

    // Detect random character spam (like "cvFbaAhUBUxBXZuVxMGJmYq")
    // Check if name has excessive mixed case without spaces or common patterns
    const hasRandomPattern = (text: string): boolean => {
      // Check length - random spam is usually very long
      if (text.length > 25) return true;

      // Count uppercase/lowercase transitions (random spam has many)
      let transitions = 0;
      for (let i = 1; i < text.length; i++) {
        const prevIsUpper = text[i - 1] === text[i - 1].toUpperCase();
        const currIsUpper = text[i] === text[i].toUpperCase();
        if (prevIsUpper !== currIsUpper) transitions++;
      }

      // If more than 40% of characters are case transitions, it's suspicious
      if (transitions > text.length * 0.4) return true;

      // Check for lack of vowels (real names usually have vowels)
      const vowels = text.match(/[aeiou]/gi);
      const vowelRatio = vowels ? vowels.length / text.length : 0;
      if (vowelRatio < 0.2 && text.length > 8) return true;

      // Check for excessive consonant clusters (more than 5 consonants in a row)
      if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(text)) return true;

      return false;
    };

    if (hasRandomPattern(firstName) || hasRandomPattern(lastName)) {
      return {
        isBot: true,
        reason: "Random character pattern detected in name",
        firstName,
        lastName
      };
    }
  }

  // Check for random patterns in subject and message
  const subject = formData.get("subject")?.toString();
  if (subject) {
    // Apply same random pattern detection to subject
    const hasRandomPattern = (text: string): boolean => {
      if (text.length > 40) return true;
      let transitions = 0;
      for (let i = 1; i < text.length; i++) {
        const prevIsUpper = text[i - 1] === text[i - 1].toUpperCase();
        const currIsUpper = text[i] === text[i].toUpperCase();
        if (prevIsUpper !== currIsUpper) transitions++;
      }
      if (transitions > text.length * 0.4) return true;
      const vowels = text.match(/[aeiou]/gi);
      const vowelRatio = vowels ? vowels.length / text.length : 0;
      if (vowelRatio < 0.2 && text.length > 8) return true;
      if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(text)) return true;
      return false;
    };

    if (hasRandomPattern(subject)) {
      return {
        isBot: true,
        reason: "Random character pattern detected in subject",
        subject
      };
    }
  }

  // Check for suspicious message content (only for contact forms)
  const message = formData.get("message")?.toString();
  if (message) {
    const messageLower = message.toLowerCase();

    // Check for random patterns in message
    const hasRandomPattern = (text: string): boolean => {
      if (text.length > 500) return false; // Don't flag long legitimate messages
      let transitions = 0;
      for (let i = 1; i < text.length; i++) {
        const prevIsUpper = text[i - 1] === text[i - 1].toUpperCase();
        const currIsUpper = text[i] === text[i].toUpperCase();
        if (prevIsUpper !== currIsUpper) transitions++;
      }
      if (transitions > text.length * 0.4) return true;
      const vowels = text.match(/[aeiou]/gi);
      const vowelRatio = vowels ? vowels.length / text.length : 0;
      if (vowelRatio < 0.2 && text.length > 15) return true;
      if (/[bcdfghjklmnpqrstvwxyz]{7,}/i.test(text)) return true;
      return false;
    };

    if (hasRandomPattern(message)) {
      return {
        isBot: true,
        reason: "Random character pattern detected in message",
        message: message.substring(0, 50)
      };
    }

    // Check for spam keywords
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
      if (messageLower.includes(keyword)) {
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

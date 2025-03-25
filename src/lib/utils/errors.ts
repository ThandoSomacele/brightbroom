// src/lib/utils/errors.ts
import { error } from '@sveltejs/kit';

/**
 * Error types for consistent error handling
 */
export const ErrorType = {
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION: 'VALIDATION',
  SERVER_ERROR: 'SERVER_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  BOOKING_ERROR: 'BOOKING_ERROR'
} as const;

type ErrorTypeKey = keyof typeof ErrorType;
type ErrorTypeValue = typeof ErrorType[ErrorTypeKey];

/**
 * Creates a standardized error with a specific type and message
 */
export function createError(
  type: ErrorTypeValue, 
  message: string, 
  details?: Record<string, any>
) {
  const statusCodes: Record<ErrorTypeValue, number> = {
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    VALIDATION: 400,
    SERVER_ERROR: 500,
    PAYMENT_ERROR: 400,
    BOOKING_ERROR: 400
  };
  
  const status = statusCodes[type] || 500;
  
  // Create the error with additional metadata
  return error(status, {
    message,
    type,
    details,
    timestamp: new Date().toISOString()
  });
}

/**
 * Helper functions for common error types
 */
export const notFound = (message = 'Resource not found', details?: Record<string, any>) => 
  createError(ErrorType.NOT_FOUND, message, details);

export const unauthorized = (message = 'Authentication required', details?: Record<string, any>) => 
  createError(ErrorType.UNAUTHORIZED, message, details);

export const forbidden = (message = 'Access denied', details?: Record<string, any>) => 
  createError(ErrorType.FORBIDDEN, message, details);

export const validation = (message = 'Validation error', details?: Record<string, any>) => 
  createError(ErrorType.VALIDATION, message, details);

export const serverError = (message = 'Server error', details?: Record<string, any>) => 
  createError(ErrorType.SERVER_ERROR, message, details);

export const paymentError = (message = 'Payment processing error', details?: Record<string, any>) => 
  createError(ErrorType.PAYMENT_ERROR, message, details);

export const bookingError = (message = 'Booking error', details?: Record<string, any>) => 
  createError(ErrorType.BOOKING_ERROR, message, details);

// src/lib/utils/date-utils.ts
import { format, parse } from "date-fns";

/**
 * Safely parses a date string without timezone conversion
 * This preserves the exact hour/minute values from the database
 */
export function parseDateTimeString(dateTimeStr: string | Date): Date {
  if (dateTimeStr instanceof Date) return dateTimeStr;
  
  try {
    // Handle both ISO format with 'T' and database format with space
    const normalizedStr = dateTimeStr.replace('T', ' ');
    
    // Extract date parts to prevent automatic timezone shifting
    const parts = normalizedStr.split(/[- :]/);
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JS months are 0-based
    const day = parseInt(parts[2]);
    const hour = parseInt(parts[3] || '0');
    const minute = parseInt(parts[4] || '0');
    const second = parseInt(parts[5] || '0');
    
    return new Date(year, month, day, hour, minute, second);
  } catch (error) {
    console.error("Error parsing date:", error);
    // Fallback to regular parsing but don't use in production
    return new Date(dateTimeStr);
  }
}

/**
 * Formats a date string or Date object to a localized date string
 */
export function formatDate(dateStr: string | Date): string {
  const date = parseDateTimeString(dateStr);
  
  return date.toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Formats a date string or Date object to a localized time string
 */
export function formatTime(dateStr: string | Date): string {
  const date = parseDateTimeString(dateStr);
  
  return date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false // Use 24-hour format for South Africa
  });
}

/**
 * Formats a date string to a more friendly format like "29 Apr 2025 at 09:00"
 */
export function formatDateTimeShort(dateStr: string | Date): string {
  const date = parseDateTimeString(dateStr);
  
  const formattedDate = date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  
  const timeStr = date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  
  return `${formattedDate} at ${timeStr}`;
}

/**
 * Format a date range for booking display
 */
export function formatDateTimeRange(
  startDateStr: string | Date,
  durationMinutes: number
): string {
  const startDate = parseDateTimeString(startDateStr);
  const endDate = new Date(startDate);
  endDate.setMinutes(endDate.getMinutes() + durationMinutes);
  
  const dateStr = startDate.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  
  const startTimeStr = startDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  
  const endTimeStr = endDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  
  return `${dateStr}, ${startTimeStr} - ${endTimeStr}`;
}

// src/lib/services/data.ts
import type { ServiceBasicInfo } from './types';

/**
 * Default VAT rate for South Africa
 */
export const DEFAULT_VAT_RATE = 15;

/**
 * Default services data
 * Used for initial data seeding and fallback when API is unavailable
 */
export const DEFAULT_SERVICES: ServiceBasicInfo[] = [
  {
    id: 'regular-cleaning',
    name: 'Regular Cleaning',
    description: 'Perfect for maintaining a clean and tidy home on a regular basis.',
    basePrice: 350,
    durationHours: 6,
    isActive: true,
    category: 'residential',
    type: 'regular',
    iconType: 'home'
  },
  {
    id: 'regular-cleaning-laundry',
    name: 'Regular Cleaning with Laundry & Ironing',
    description: 'Standard cleaning service with laundry and ironing assistance.',
    basePrice: 400,
    durationHours: 8,
    isActive: true,
    category: 'residential',
    type: 'regular',
    iconType: 'laundry'
  },
  {
    id: 'extended-cleaning',
    name: 'Extended Cleaning',
    description: 'A thorough cleaning service that reaches every corner and detail.',
    basePrice: 500,
    durationHours: 10,
    isActive: true,
    category: 'residential',
    type: 'extended',
    iconType: 'deep'
  },
  {
    id: 'office-cleaning',
    name: 'Office Cleaning',
    description: 'Professional cleaning for your office space or commercial property.',
    basePrice: 450,
    durationHours: 6,
    isActive: true,
    category: 'commercial',
    type: 'regular',
    iconType: 'office'
  }
];

/**
 * Services by category
 */
export const SERVICES_BY_CATEGORY = {
  residential: DEFAULT_SERVICES.filter(s => s.category === 'residential'),
  commercial: DEFAULT_SERVICES.filter(s => s.category === 'commercial'),
  specialised: DEFAULT_SERVICES.filter(s => s.category === 'specialised')
};

/**
 * Map from service ID to service type
 * Used to load the correct CSV data
 */
export const SERVICE_TYPE_MAP: Record<string, string> = {
  'regular-cleaning': 'regular',
  'regular-cleaning-laundry': 'regular-laundry',
  'extended-cleaning': 'extended',
  'office-cleaning': 'office'
};

/**
 * Map from service type to CSV filename
 */
export const SERVICE_CSV_FILES: Record<string, string> = {
  'regular': 'BrightBroom Service Description - Regular Cleaning.csv',
  'regular-laundry': 'BrightBroom Service Description - Regular Cleaning with Laundry & Ironing.csv',
  'extended': 'BrightBroom Service Description - Extended Cleaning.csv',
  'office': 'BrightBroom Service Description - Office Cleaning.csv'
};

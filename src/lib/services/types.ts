// src/lib/services/types.ts

/**
 * Service category type
 */
export type ServiceCategory = 'residential' | 'commercial' | 'specialised';

/**
 * Service type (level of cleaning)
 */
export type ServiceType = 'regular' | 'extended';

/**
 * Icon type for UI display
 */
export type ServiceIconType = 'home' | 'deep' | 'office' | 'laundry';

/**
 * Service detail item structure
 */
export interface ServiceDetailItem {
  area: string;
  details: string[];
}

/**
 * Service details structure
 */
export interface ServiceDetails {
  name: string;
  items: ServiceDetailItem[];
}

/**
 * Basic service information
 */
export interface ServiceBasicInfo {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  durationHours: number;
  isActive: boolean;
  category?: ServiceCategory;
  type: ServiceType;
  iconType: ServiceIconType;
}

/**
 * Complete service data including details 
 */
export interface Service extends ServiceBasicInfo {
  details: ServiceDetails | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * Service input for creating or updating services
 */
export interface ServiceInput {
  name: string;
  description: string;
  basePrice: number;
  durationHours: number;
  category?: ServiceCategory;
  type: ServiceType;
  iconType: ServiceIconType;
  isActive?: boolean;
  details?: ServiceDetails | null;
}

/**
 * Service pricing information
 */
export interface ServicePricing {
  basePrice: number;
  vatRate: number;
  vatAmount: number;
  totalPrice: number;
}

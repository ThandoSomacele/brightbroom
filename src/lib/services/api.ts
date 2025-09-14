// src/lib/services/api.ts
import type { Service, ServiceInput } from './types';

/**
 * Fetch all services from the API
 * @returns Array of services
 */
export async function fetchServices(): Promise<Service[]> {
  try {
    const response = await fetch('/api/services');
    
    if (!response.ok) {
      throw new Error('Failed to load services');
    }
    
    const data = await response.json();
    return data.services;
  } catch (error) {
    console.error('Error loading services:', error);
    throw error;
  }
}

/**
 * Fetch a single service by ID
 * @param id Service ID
 * @returns Service data or null if not found
 */
export async function fetchServiceById(id: string): Promise<Service | null> {
  try {
    const response = await fetch(`/api/services/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to load service');
    }
    
    const data = await response.json();
    return data.service;
  } catch (error) {
    console.error('Error loading service:', { id, error });
    throw error;
  }
}

/**
 * Create a new service (admin only)
 * @param serviceData Service data to create
 * @returns Created service
 */
export async function createService(serviceData: ServiceInput): Promise<Service> {
  try {
    const response = await fetch('/api/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create service');
    }
    
    const data = await response.json();
    return data.service;
  } catch (error) {
    console.error('Error creating service:', error);
    throw error;
  }
}

/**
 * Update an existing service (admin only)
 * @param id Service ID
 * @param serviceData Updated service data
 * @returns Updated service
 */
export async function updateService(id: string, serviceData: Partial<ServiceInput>): Promise<Service> {
  try {
    const response = await fetch(`/api/services/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(serviceData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update service');
    }
    
    const data = await response.json();
    return data.service;
  } catch (error) {
    console.error('Error updating service:', { id, error });
    throw error;
  }
}

/**
 * Delete a service (admin only)
 * @param id Service ID
 * @returns Success indicator
 */
export async function deleteService(id: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete service');
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting service:', { id, error });
    throw error;
  }
}

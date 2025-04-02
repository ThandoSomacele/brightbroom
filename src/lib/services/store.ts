// src/lib/services/store.ts
import { writable, derived, get } from 'svelte/store';
import type { Service } from './types';
import { fetchServices, fetchServiceById } from './api';
import { findServiceById } from './utils';

// Create stores for services data
export const services = writable<Service[]>([]);
export const servicesLoading = writable<boolean>(false);
export const servicesError = writable<string | null>(null);
export const selectedService = writable<Service | null>(null);

// Create a derived store for services by category
export const servicesByCategory = derived(services, ($services) => {
  return $services.reduce((acc, service) => {
    const category = service.category || 'uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);
});

// Create a derived store for active services only
export const activeServices = derived(services, ($services) => {
  return $services.filter(service => service.isActive);
});

/**
 * Load all services from the API
 * @param forceRefresh Whether to force a refresh from the API
 * @returns Promise resolving to services array
 */
export async function loadServices(forceRefresh = false): Promise<Service[]> {
  // Skip loading if we already have services and not forcing refresh
  if (!forceRefresh && get(services).length > 0) {
    return get(services);
  }
  
  try {
    servicesLoading.set(true);
    servicesError.set(null);
    
    const serviceData = await fetchServices();
    services.set(serviceData);
    
    return serviceData;
  } catch (error) {
    console.error('Error loading services:', error);
    servicesError.set(error instanceof Error ? error.message : 'Failed to load services');
    return [];
  } finally {
    servicesLoading.set(false);
  }
}

/**
 * Load a single service by ID
 * @param id Service ID to load
 * @param forceRefresh Whether to force a refresh from the API
 * @returns Promise resolving to a service or null
 */
export async function loadServiceById(id: string, forceRefresh = false): Promise<Service | null> {
  // Check if service is already in the store
  if (!forceRefresh) {
    const cachedServices = get(services);
    const cachedService = findServiceById(id, cachedServices);
    
    if (cachedService) {
      selectedService.set(cachedService);
      return cachedService;
    }
  }
  
  try {
    servicesLoading.set(true);
    servicesError.set(null);
    
    const service = await fetchServiceById(id);
    
    if (service) {
      selectedService.set(service);
      
      // Update the service in the services store if it exists
      services.update(currentServices => {
        const index = currentServices.findIndex(s => s.id === id);
        if (index >= 0) {
          currentServices[index] = service;
          return [...currentServices];
        }
        return [...currentServices, service];
      });
    }
    
    return service;
  } catch (error) {
    console.error(`Error loading service ${id}:`, error);
    servicesError.set(error instanceof Error ? error.message : `Failed to load service ${id}`);
    return null;
  } finally {
    servicesLoading.set(false);
  }
}

/**
 * Clear the services cache
 */
export function clearServicesCache(): void {
  services.set([]);
  selectedService.set(null);
  servicesError.set(null);
}

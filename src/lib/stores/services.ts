// src/lib/stores/services.ts
import type { Service } from "$lib/types/db";
import { writable } from "svelte/store";

// Initialise store
export const services = writable<Service[]>([]);
export const servicesLoading = writable<boolean>(false);
export const servicesError = writable<string | null>(null);

// Function to fetch services
export async function fetchServices(): Promise<Service[]> {
  // Skip fetching if we already have services
  const currentServices: Service[] = [];
  services.subscribe((s) => currentServices.push(...s))();

  if (currentServices.length > 0) {
    return currentServices;
  }

  try {
    servicesLoading.set(true);
    servicesError.set(null);

    // Fetch services from API
    const response = await fetch("/api/services");

    if (!response.ok) {
      throw new Error(`Failed to load services: ${response.statusText}`);
    }

    const data = await response.json();

    // Update the store
    services.set(data.services);

    return data.services;
  } catch (error) {
    console.error("Error loading services:", error);
    servicesError.set(
      error instanceof Error ? error.message : "Failed to load services",
    );
    return [];
  } finally {
    servicesLoading.set(false);
  }
}

// Function to get a service by ID
export function getServiceById(
  id: string,
  servicesList: Service[],
): Service | undefined {
  return servicesList.find((s) => s.id === id);
}

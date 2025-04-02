// src/lib/services/index.ts

// Export types
export * from './types';

// Export API functions
export {
  fetchServices,
  fetchServiceById,
  createService,
  updateService,
  deleteService
} from './api';

// Export utility functions
export {
  formatCurrency,
  formatDuration,
  calculatePricing,
  parseServiceDetailsFromCSV,
  parseServiceDetails,
  stringifyServiceDetails,
  getServiceTypeDisplay,
  findServiceById,
  groupServicesByCategory,
  generateDefaultServiceDetails
} from './utils';

// Export constants
export {
  DEFAULT_VAT_RATE,
  DEFAULT_SERVICES,
  SERVICES_BY_CATEGORY,
  SERVICE_TYPE_MAP,
  SERVICE_CSV_FILES
} from './data';

// Export store and state management
export {
  services,
  servicesLoading,
  servicesError,
  selectedService,
  servicesByCategory,
  activeServices,
  loadServices,
  loadServiceById,
  clearServicesCache
} from './store';

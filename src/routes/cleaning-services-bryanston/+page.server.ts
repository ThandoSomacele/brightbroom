import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Return structured data for SEO
  return {
    seo: {
      title: 'Professional Cleaning Services in Bryanston | BrightBroom',
      description: 'Trusted home and office cleaning services in Bryanston, Johannesburg. Book professional cleaners for regular or deep cleaning. Serving Bryanston, Sloane Park, Riverside, and surrounding areas.',
      keywords: 'cleaning services Bryanston, house cleaning Bryanston, office cleaning Bryanston, domestic cleaning Bryanston, cleaners near me Bryanston',
      canonical: 'https://brightbroom.com/cleaning-services-bryanston'
    }
  };
};
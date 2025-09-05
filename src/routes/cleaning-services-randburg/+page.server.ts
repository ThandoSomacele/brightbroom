import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Return structured data for SEO
  return {
    seo: {
      title: 'Professional Cleaning Services in Randburg | BrightBroom',
      description: 'Trusted home and office cleaning services in Randburg, Johannesburg. Book professional cleaners for regular or deep cleaning. Serving Randburg, Ferndale, Blairgowrie, and surrounding areas.',
      keywords: 'cleaning services Randburg, house cleaning Randburg, office cleaning Randburg, domestic cleaning Randburg, cleaners near me Randburg',
      canonical: 'https://brightbroom.com/cleaning-services-randburg'
    }
  };
};
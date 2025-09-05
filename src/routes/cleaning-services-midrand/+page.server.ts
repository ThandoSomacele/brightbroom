import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  // Return structured data for SEO
  return {
    seo: {
      title: 'Professional Cleaning Services in Fourways | BrightBroom',
      description: 'Trusted home and office cleaning services in Fourways, Johannesburg. Book professional cleaners for regular or deep cleaning. Serving Fourways, Lonehill, Broadacres, and surrounding areas.',
      keywords: 'cleaning services Fourways, house cleaning Fourways, office cleaning Fourways, domestic cleaning Fourways, cleaners near me Fourways',
      canonical: 'https://brightbroom.com/cleaning-services-fourways'
    }
  };
};
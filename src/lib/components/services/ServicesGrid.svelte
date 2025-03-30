<!-- src/lib/components/services/ServicesGrid.svelte -->
<script lang="ts">
  import ServiceCard from './ServiceCard.svelte';
  
  // Props - can be passed in from parent component or page
  export let services: {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    iconType: 'home' | 'deep' | 'office';
    type: 'regular' | 'extended';
    details?: string; // Now accepting details as optional prop
  }[];
  
  // Generate details string for each service that doesn't have one
  function getServiceDetailsObject(serviceName: string, type: 'regular' | 'extended') {
    // Create a structured details object based on service type
    const detailsObject = {
      name: serviceName,
      items: type === 'regular' ? [
        {
          area: "LIVING AREAS",
          details: [
            "Dusting of all surfaces and furniture",
            "Vacuuming of carpets and rugs",
            "Mopping of hard floors",
            "Cleaning of mirrors and glass surfaces",
            "Wiping down of door handles and light switches"
          ]
        },
        {
          area: "KITCHEN",
          details: [
            "Cleaning of counter tops and backsplash",
            "Wiping down of cabinets and appliance exteriors",
            "Cleaning inside microwave",
            "Scrubbing sink and fixtures",
            "Sweeping and mopping floors"
          ]
        },
        {
          area: "BATHROOMS",
          details: [
            "Cleaning and sanitizing toilet, shower, tub, and sink",
            "Wiping down all surfaces and fixtures",
            "Cleaning mirrors and glass surfaces",
            "Sweeping and mopping floors",
            "Removing trash"
          ]
        }
      ] : [
        // Extended cleaning includes more detailed tasks
        {
          area: "LIVING AREAS",
          details: [
            "Deep dusting of all surfaces, including hard-to-reach areas",
            "Vacuuming of carpets, rugs, and upholstery",
            "Detailed cleaning of baseboards and trim",
            "Thorough cleaning of window sills and blinds",
            "Dusting of ceiling fans and light fixtures",
            "Removal of cobwebs from corners and ceilings",
            "Spot cleaning of walls and doors"
          ]
        },
        {
          area: "KITCHEN",
          details: [
            "Deep cleaning of all appliance exteriors",
            "Interior cleaning of refrigerator and oven",
            "Detailed cleaning inside cabinets",
            "Scrubbing of backsplash and behind appliances",
            "Deep cleaning of sink and faucets",
            "Detailed floor cleaning, including edges and corners"
          ]
        },
        {
          area: "BATHROOMS",
          details: [
            "Deep cleaning of shower doors and tile grout",
            "Scrubbing and sanitizing of all bathroom surfaces",
            "Detailed cleaning of fixtures and hardware",
            "Thorough cleaning of vanity and medicine cabinet",
            "Deep cleaning of toilet areas including base and behind",
            "Treatment of mold or mildew areas"
          ]
        }
      ]
    };
    
    return JSON.stringify(detailsObject);
  }
  
  // Process services to ensure each has details
  $: processedServices = services.map(service => {
    if (!service.details) {
      return {
        ...service,
        details: getServiceDetailsObject(service.name, service.type)
      };
    }
    return service;
  });
</script>

<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
  {#each processedServices as service (service.id)}
    <ServiceCard
      id={service.id}
      name={service.name}
      description={service.description}
      price={service.price}
      duration={service.duration}
      iconType={service.iconType}
      type={service.type}
      details={service.details}
    />
  {/each}
</div>

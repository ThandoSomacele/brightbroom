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
  }[] = [
    {
      id: 'regular-cleaning',
      name: 'Regular Cleaning',
      description: 'Perfect for maintaining a clean and tidy home on a regular basis.',
      price: 350,
      duration: 2,
      iconType: 'home',
      type: 'regular'
    },
    {
      id: 'extended-cleaning',
      name: 'Extended Cleaning',
      description: 'A thorough cleaning service that reaches every corner and detail.',
      price: 550,
      duration: 4,
      iconType: 'deep',
      type: 'extended'
    },
    {
      id: 'office-cleaning',
      name: 'Office Cleaning',
      description: 'Professional cleaning for your office space or commercial property.',
      price: 450,
      duration: 3,
      iconType: 'office',
      type: 'regular'
    }
  ];
</script>

<div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
  {#each services as service (service.id)}
    <ServiceCard
      id={service.id}
      name={service.name}
      description={service.description}
      price={service.price}
      duration={service.duration}
      iconType={service.iconType}
      type={service.type}
    />
  {/each}
</div>

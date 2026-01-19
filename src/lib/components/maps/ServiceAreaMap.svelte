<!-- src/lib/components/maps/ServiceAreaMap.svelte -->
<script lang="ts">
  import {
    SERVICE_AREAS,
    type ServiceArea,
  } from "$lib/utils/serviceAreaValidator";
  import { onDestroy, onMount } from "svelte";

  // Props
  export let apiKey: string;
  export let height = "400px";
  export let width = "100%";
  export let showLabels = true;
  export let selectedAreaName: string | null = null;

  // Local state
  let mapContainer: HTMLDivElement;
  let map: google.maps.Map | null = null;
  let circles: google.maps.Circle[] = [];
  let markers: google.maps.Marker[] = [];
  let scriptLoaded = false;
  let error: string | null = null;

  // Calculate the center of all service areas
  function calculateCenterPoint(): { lat: number; lng: number } {
    let totalLat = 0;
    let totalLng = 0;

    SERVICE_AREAS.forEach((area) => {
      totalLat += area.lat;
      totalLng += area.lng;
    });

    return {
      lat: totalLat / SERVICE_AREAS.length,
      lng: totalLng / SERVICE_AREAS.length,
    };
  }

  // Initialise the map
  function initMap() {
    if (!window.google || !window.google.maps) {
      error = "Google Maps failed to load";
      return;
    }

    if (!mapContainer) return;

    try {
      const center = calculateCenterPoint();

      // Create the map
      map = new google.maps.Map(mapContainer, {
        center: center,
        zoom: 11,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: "poi",
            stylers: [{ visibility: "off" }],
          },
        ],
      });

      // Add circles for each service area
      SERVICE_AREAS.forEach((area) => {
        addServiceAreaCircle(area);
      });

      // Fit bounds to include all service areas
      if (map && circles.length > 0) {
        const bounds = new google.maps.LatLngBounds();

        SERVICE_AREAS.forEach((area) => {
          // Extend bounds to include this area plus its radius
          bounds.extend(
            new google.maps.LatLng(area.lat + 0.05, area.lng + 0.05),
          );
          bounds.extend(
            new google.maps.LatLng(area.lat - 0.05, area.lng - 0.05),
          );
        });

        map.fitBounds(bounds);
      }
    } catch (err) {
      console.error("Error initializing map:", err);
      error = "Error initializing map";
    }
  }

  // Add a circle to visualize a service area
  function addServiceAreaCircle(area: ServiceArea) {
    if (!map) return;

    // Determine if this area is "selected"
    const isSelected = selectedAreaName
      ? area.name === selectedAreaName
      : false;

    // Create the circle
    const circle = new google.maps.Circle({
      strokeColor: isSelected ? "#C2511F" : "#20C3AF",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: isSelected ? "#C2511F" : "#20C3AF",
      fillOpacity: 0.2,
      map,
      center: { lat: area.lat, lng: area.lng },
      radius: area.radius * 1000, // Convert km to meters
      zIndex: isSelected ? 100 : 10,
    });

    circles.push(circle);

    // Add label if needed
    if (showLabels) {
      const marker = new google.maps.Marker({
        position: { lat: area.lat, lng: area.lng },
        map,
        icon: {
          url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E",
          scaledSize: new google.maps.Size(1, 1),
        },
        label: {
          text: area.name,
          color: isSelected ? "#C2511F" : "#20C3AF",
          fontWeight: "bold",
          fontSize: "14px",
        },
        zIndex: isSelected ? 101 : 11,
      });

      markers.push(marker);
    }
  }

  // Load Google Maps script
  function loadGoogleMapsScript() {
    if (window.google && window.google.maps) {
      scriptLoaded = true;
      initMap();
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      scriptLoaded = true;
      initMap();
    };

    script.onerror = () => {
      error = "Failed to load Google Maps";
      console.error("Failed to load Google Maps script");
    };

    document.head.appendChild(script);
  }

  // Cleanup function to remove circles and markers
  function cleanup() {
    circles.forEach((circle) => {
      circle.setMap(null);
    });

    markers.forEach((marker) => {
      marker.setMap(null);
    });

    circles = [];
    markers = [];
  }

  // Re-Initialise when selectedAreaName changes
  $: if (selectedAreaName !== null && map) {
    cleanup();
    SERVICE_AREAS.forEach((area) => {
      addServiceAreaCircle(area);
    });
  }

  onMount(() => {
    loadGoogleMapsScript();
  });

  onDestroy(() => {
    cleanup();
  });
</script>

<div class="service-area-map-container" style="position: relative;">
  {#if error}
    <div
      class="bg-red-50 p-4 rounded-md text-red-700 dark:bg-red-900/20 dark:text-red-300"
    >
      <p>{error}</p>
    </div>
  {/if}

  <!-- Map container -->
  <div
    bind:this={mapContainer}
    style="width: {width}; height: {height}; border-radius: 0.5rem; overflow: hidden;"
  ></div>

  {#if !scriptLoaded}
    <div
      class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 dark:bg-gray-800 dark:bg-opacity-80"
    >
      <div class="flex flex-col items-center">
        <div
          class="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
        ></div>
        <p class="mt-4 text-gray-700 dark:text-gray-300">Loading map...</p>
      </div>
    </div>
  {/if}
</div>

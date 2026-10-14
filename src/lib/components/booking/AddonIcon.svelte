<!--
  Icon for a booking add-on, drawn as the item it describes. Neither Phosphor
  nor Lucide has all six, so these are inline outline drawings from Tabler
  Icons (MIT) and Hugeicons free (MIT), via Iconify. Unknown add-ons get a
  sparkles drawing (Lucide, ISC).
-->
<script lang="ts">
  let { name, size = 16 }: { name: string; size?: number } = $props();

  type Drawing = { d: string[]; strokeWidth: number };

  const sparkles: Drawing = {
    strokeWidth: 2,
    d: [
      "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
      "M20 2v4",
      "M22 4h-4",
      "M2 20a2 2 0 1 0 4 0a2 2 0 1 0-4 0",
    ],
  };

  const drawings: Record<string, Drawing> = {
    // Tabler "wash-machine"
    "Laundry & Ironing": {
      strokeWidth: 2,
      d: [
        "M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z",
        "M8 14a4 4 0 1 0 8 0a4 4 0 1 0-8 0m0-8h.01M11 6h.01M14 6h2",
        "M8 14q2-1 4 0t4 0",
      ],
    },
    // Tabler "fridge"
    "Inside Fridge": {
      strokeWidth: 2,
      d: [
        "M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zm0 5h14M9 13v3M9 6v1",
      ],
    },
    // Hugeicons "oven"
    "Inside Oven": {
      strokeWidth: 1.5,
      d: [
        "M3 16V8c0-2.828 0-4.243.879-5.121C4.757 2 6.172 2 9 2h6c2.828 0 4.243 0 5.121.879C21 3.757 21 5.172 21 8v8c0 2.828 0 4.243-.879 5.121C19.243 22 17.828 22 15 22H9c-2.828 0-4.243 0-5.121-.879C3 20.243 3 18.828 3 16",
        "M6 16v-5c0-1.414 0-2.121.44-2.56C6.878 8 7.585 8 9 8h6c1.414 0 2.121 0 2.56.44c.44.439.44 1.146.44 2.56v5c0 1.414 0 2.121-.44 2.56c-.439.44-1.146.44-2.56.44H9c-1.414 0-2.121 0-2.56-.44C6 18.122 6 17.415 6 16m3-5h6m-2.95-5.998H12m.1 0a.1.1 0 1 1-.2 0a.1.1 0 0 1 .2 0m3.95 0H16m.1 0a.1.1 0 1 1-.2 0a.1.1 0 0 1 .2 0m-8.05 0H8m.1 0a.1.1 0 1 1-.2 0a.1.1 0 0 1 .2 0",
      ],
    },
    // Hugeicons "cabinet-01"
    "Inside Cabinets": {
      strokeWidth: 1.5,
      d: [
        "m6 18l-1 3m13-3l1 3m-3-3H8c-2.828 0-4.243 0-5.121-.941C2 16.117 2 14.602 2 11.57V9.43c0-3.03 0-4.546.879-5.488C3.757 3 5.172 3 8 3h8c2.828 0 4.243 0 5.121.941C22 4.883 22 6.398 22 9.43v2.142c0 3.03 0 4.546-.879 5.488c-.878.94-2.293.94-5.121.94M2.5 14h19M12 3v11M9 9V8m6 1V8",
      ],
    },
    // Tabler "wall"
    "Interior Walls": {
      strokeWidth: 2,
      d: [
        "M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm0 2h16m0 4H4m0 4h16M9 4v4m5 0v4m-6 0v4m8-4v4m-5 0v4",
      ],
    },
    // Tabler "window"
    "Interior Windows": {
      strokeWidth: 2,
      d: [
        "M12 3c-3.866 0-7 3.272-7 7v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10c0-3.728-3.134-7-7-7M5 13h14M12 3v18",
      ],
    },
  };

  let drawing = $derived(drawings[name] ?? sparkles);
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={drawing.strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class="shrink-0"
  aria-hidden="true"
>
  {#each drawing.d as d (d)}
    <path {d} />
  {/each}
</svg>

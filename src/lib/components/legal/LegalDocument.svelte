<!--
  Renders a legal document from src/content/legal: a contents sidebar, then
  collapsible numbered sections. The HTML comes from our own Markdown files
  (rendered on the server), never from user input.
-->
<script lang="ts">
  import { onMount } from "svelte";
  import type { LegalDocument } from "$lib/types/legal";

  let { doc }: { doc: LegalDocument } = $props();

  let expanded = $state<Record<string, boolean>>({});

  onMount(() => {
    // Open the section named in the URL, otherwise the first one
    const target = window.location.hash.slice(1);
    const first = doc.sections[0]?.id;
    const open = doc.sections.some((s) => s.id === target) ? target : first;
    if (open) expanded[open] = true;
    if (target && open === target) {
      requestAnimationFrame(() => document.getElementById(target)?.scrollIntoView({ block: "start" }));
    }
  });

  function toggle(id: string) {
    expanded[id] = !expanded[id];
  }

  function goTo(id: string) {
    expanded[id] = true;
    history.replaceState(history.state, "", `#${id}`);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function expandAll(open: boolean) {
    for (const s of doc.sections) expanded[s.id] = open;
  }
</script>

<svelte:head>
  <title>{doc.title} | BrightBroom</title>
  <meta name="description" content={doc.description} />
</svelte:head>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900">
  <div class="container mx-auto px-4 py-8">
    <div class="flex flex-col gap-8 md:flex-row">
      <!-- Contents -->
      <aside class="sticky top-20 hidden h-[calc(100vh-6rem)] self-start overflow-y-auto pb-8 pt-4 md:block md:w-1/4 lg:w-1/5">
        <div class="rounded-lg bg-white p-4 shadow-md dark:bg-gray-800">
          <h2 class="mb-4 text-lg font-bold text-primary-700 dark:text-primary-400">Contents</h2>
          <nav class="space-y-1">
            {#each doc.sections as section (section.id)}
              <button
                type="button"
                onclick={() => goTo(section.id)}
                class="w-full rounded px-3 py-2 text-left text-sm transition-colors hover:bg-gray-100 hover:text-primary-700 dark:hover:bg-gray-700"
              >
                {section.title}
              </button>
            {/each}
          </nav>
        </div>
      </aside>

      <main class="md:w-3/4 lg:w-4/5">
        <div class="rounded-lg bg-white p-6 shadow-md md:p-8 dark:bg-gray-800">
          <header class="mb-6 border-b border-gray-200 pb-6 dark:border-gray-700">
            <p class="section-eyebrow mb-2 text-center">BrightBroom (Pty) Ltd</p>
            <h1 class="mb-3 text-center text-3xl font-bold text-gray-900 dark:text-white">{doc.title}</h1>
            <p class="text-center text-gray-600 dark:text-gray-400">Last updated: {doc.lastUpdated}</p>
          </header>

          {#if doc.introHtml.trim()}
            <div class="legal-prose mb-8">{@html doc.introHtml}</div>
          {/if}

          <!-- Contents on small screens -->
          <details class="mb-6 rounded-lg bg-gray-100 p-3 md:hidden dark:bg-gray-700">
            <summary class="cursor-pointer font-medium">Contents</summary>
            <nav class="ml-2 mt-3 space-y-1">
              {#each doc.sections as section (section.id)}
                <button type="button" onclick={() => goTo(section.id)} class="block w-full py-1 text-left text-sm hover:text-primary-700">
                  {section.title}
                </button>
              {/each}
            </nav>
          </details>

          <div class="mb-4 flex justify-end gap-4 text-sm">
            <button type="button" class="text-primary-700 hover:underline" onclick={() => expandAll(true)}>Expand all</button>
            <button type="button" class="text-primary-700 hover:underline" onclick={() => expandAll(false)}>Collapse all</button>
          </div>

          <div class="space-y-4">
            {#each doc.sections as section (section.id)}
              <section id={section.id} class="scroll-mt-24 rounded-lg border border-gray-200 dark:border-gray-700">
                <h2>
                  <button
                    type="button"
                    class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-lg font-semibold text-gray-900 hover:bg-gray-50 dark:text-white dark:hover:bg-gray-700/50"
                    aria-expanded={expanded[section.id] ? "true" : "false"}
                    aria-controls="{section.id}-body"
                    onclick={() => toggle(section.id)}
                  >
                    <span>{section.title}</span>
                    <span class="shrink-0 text-gray-500 transition-transform {expanded[section.id] ? 'rotate-180' : ''}" aria-hidden="true">▾</span>
                  </button>
                </h2>
                <div id="{section.id}-body" class="legal-prose px-4 pb-4" hidden={!expanded[section.id]}>
                  {@html section.html}
                </div>
              </section>
            {/each}
          </div>

          <p class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">© BrightBroom (Pty) Ltd. All rights reserved.</p>
        </div>
      </main>
    </div>
  </div>
</div>

<style>
  .legal-prose :global(p) {
    margin: 0.75rem 0;
    line-height: 1.7;
    color: rgb(55 65 81);
  }
  .legal-prose :global(ol),
  .legal-prose :global(ul) {
    margin: 0.5rem 0 0.75rem 1.5rem;
    line-height: 1.7;
    color: rgb(55 65 81);
  }
  .legal-prose :global(ol) {
    list-style: lower-alpha;
  }
  .legal-prose :global(ul) {
    list-style: disc;
  }
  .legal-prose :global(li) {
    margin: 0.25rem 0;
  }
  .legal-prose :global(h3) {
    margin: 1.25rem 0 0.5rem;
    font-weight: 600;
    color: rgb(17 24 39);
  }
  .legal-prose :global(strong) {
    color: rgb(17 24 39);
  }
  .legal-prose :global(a) {
    color: #15776d;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .legal-prose :global(table) {
    display: block;
    overflow-x: auto;
    width: 100%;
    margin: 0.75rem 0;
    border-collapse: collapse;
    font-size: 0.925rem;
  }
  .legal-prose :global(th),
  .legal-prose :global(td) {
    border: 1px solid rgb(229 231 235);
    padding: 0.5rem 0.625rem;
    text-align: left;
    vertical-align: top;
  }
  .legal-prose :global(th) {
    background: rgb(249 250 251);
    font-weight: 600;
  }
  :global(.dark) .legal-prose :global(p),
  :global(.dark) .legal-prose :global(li) {
    color: rgb(209 213 219);
  }
</style>

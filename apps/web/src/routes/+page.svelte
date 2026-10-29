<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import { health } from "#lib/health.remote.ts";
</script>

<h1>Welcome to SvelteKit</h1>
<p>
  Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read
  the documentation
</p>

<svelte:boundary>
  <p>API: {await health()}</p>

  {#snippet pending()}
    <p>API: checking…</p>
  {/snippet}

  {#snippet failed(_error, reset)}
    <p>
      API: unavailable
      <Button onclick={reset} size="xs" variant="outline">Retry</Button>
    </p>
  {/snippet}
</svelte:boundary>

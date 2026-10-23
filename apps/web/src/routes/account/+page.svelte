<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<main class="mx-auto mt-16 max-w-sm">
  <h1 class="font-medium text-lg">{data.user.name}</h1>
  <p class="text-muted-foreground">{data.user.email}</p>
</main>

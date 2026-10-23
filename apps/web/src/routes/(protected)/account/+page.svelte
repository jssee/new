<script lang="ts">
  import { getUser } from "#lib/auth/auth.remote.ts";

  const user = $derived(await getUser());
</script>

<main class="mx-auto mt-16 max-w-sm">
  <h1 class="font-medium text-lg">{user?.name}</h1>
  <p class="text-muted-foreground">{user?.email}</p>
</main>

<script lang="ts">
  import { getUser, signOut } from "#lib/auth/auth.remote.ts";
  import { Button } from "#lib/components/ui/button/index.js";

  const user = $derived(await getUser());
</script>

<main class="mx-auto mt-16 flex max-w-sm flex-col gap-6">
  {#if user}
    <p>Signed in as {user.email}</p>
    <div class="flex gap-3">
      <Button href="/notes">Notes</Button>
      <Button href="/account" variant="outline">Account</Button>
      <form {...signOut}>
        <Button type="submit" variant="outline">Sign out</Button>
      </form>
    </div>
  {:else}
    <div class="flex gap-3">
      <Button href="/sign-in">Sign in</Button>
      <Button href="/sign-up" variant="outline">Sign up</Button>
    </div>
  {/if}
</main>

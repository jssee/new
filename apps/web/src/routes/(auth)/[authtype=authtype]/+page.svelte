<script lang="ts">
  import SignInForm from "#lib/components/sign-in-form.svelte";
  import SignUpForm from "#lib/components/sign-up-form.svelte";
  import type { PageProps } from "./$types";

  let { params }: PageProps = $props();
</script>

{#if params.authtype === "sign-up"}
  <SignUpForm />
{:else}
  <SignInForm />
{/if}

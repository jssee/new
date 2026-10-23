<script lang="ts">
  import { Button } from "#lib/components/ui/button/index.js";
  import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
  } from "#lib/components/ui/field/index.js";
  import { Textarea } from "#lib/components/ui/textarea/index.js";
  import { createNote, getNotes } from "#lib/notes/notes.remote.ts";

  const { fields } = createNote;
  const notes = $derived(await getNotes());
</script>

<main class="mx-auto mt-16 flex max-w-sm flex-col gap-10">
  <form {...createNote}>
    <FieldGroup>
      <Field>
        <FieldLabel for="body">New note</FieldLabel>
        <Textarea id="body" {...fields.body.as("text")} />
        <FieldError errors={fields.body.issues()} />
      </Field>
      <Field orientation="horizontal">
        <Button disabled={!!createNote.pending} type="submit">Add note</Button>
      </Field>
    </FieldGroup>
  </form>

  <ul class="flex flex-col gap-6">
    {#each notes as note (note.id)}
      <li>
        <p class="whitespace-pre-wrap">{note.body}</p>
        <time
          class="text-muted-foreground text-sm"
          datetime={note.createdAt.toISOString()}
        >
          {note.createdAt.toLocaleString()}
        </time>
      </li>
    {:else}
      <li class="text-muted-foreground">No notes yet.</li>
    {/each}
  </ul>
</main>

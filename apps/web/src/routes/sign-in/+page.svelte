<script lang="ts">
  import { signIn } from "#lib/auth/auth.remote.ts";
  import { Button } from "#lib/components/ui/button/index.js";
  import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
  } from "#lib/components/ui/field/index.js";
  import { Input } from "#lib/components/ui/input/index.js";

  const { fields } = signIn;
</script>

<form {...signIn} class="mx-auto mt-16 max-w-sm">
  <FieldSet>
    <FieldLegend>Sign in</FieldLegend>
    <FieldGroup>
      <Field>
        <FieldLabel for="email">Email</FieldLabel>
        <Input id="email" {...fields.email.as("email")} />
        <FieldError errors={fields.email.issues()} />
      </Field>
      <Field>
        <FieldLabel for="password">Password</FieldLabel>
        <Input id="password" {...fields._password.as("password")} />
        <FieldError errors={fields._password.issues()} />
      </Field>
      <FieldError errors={fields.issues()} />
      <Field orientation="horizontal">
        <Button disabled={!!signIn.pending} type="submit">Sign in</Button>
        <Button href="/sign-up" variant="link">Create an account</Button>
      </Field>
    </FieldGroup>
  </FieldSet>
</form>

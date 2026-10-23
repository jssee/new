<script lang="ts">
  import { signUp } from "#lib/auth/auth.remote.ts";
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

  const { fields } = signUp;
</script>

<form {...signUp} class="mx-auto mt-16 max-w-sm">
  <FieldSet>
    <FieldLegend>Create an account</FieldLegend>
    <FieldGroup>
      <Field>
        <FieldLabel for="name">Name</FieldLabel>
        <Input id="name" {...fields.name.as("text")} />
        <FieldError errors={fields.name.issues()} />
      </Field>
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
        <Button disabled={!!signUp.pending} type="submit">Sign up</Button>
        <Button href="/sign-in" variant="link">Sign in instead</Button>
      </Field>
    </FieldGroup>
  </FieldSet>
</form>

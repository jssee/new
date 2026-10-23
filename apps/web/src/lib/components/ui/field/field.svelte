<script lang="ts" module>
  import { tv, type VariantProps } from "tailwind-variants";

  export const fieldVariants = tv({
    base: "group/field flex w-full gap-3 data-[invalid=true]:text-destructive",
    defaultVariants: {
      orientation: "vertical",
    },
    variants: {
      orientation: {
        horizontal:
          "flex-row items-center has-[>[data-slot=field-content]]:items-start *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        responsive:
          "@md/field-group:flex-row flex-col @md/field-group:items-center *:w-full @md/field-group:*:w-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:*:data-[slot=field-label]:flex-auto [&>.sr-only]:w-auto @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
        vertical: "flex-col *:w-full [&>.sr-only]:w-auto",
      },
    },
  });

  export type FieldOrientation = VariantProps<
    typeof fieldVariants
  >["orientation"];
</script>

<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn, type WithElementRef } from "#lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    orientation = "vertical",
    children,
    ...restProps
  }: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
    orientation?: FieldOrientation;
  } = $props();
</script>

<div
  class={cn(fieldVariants({ orientation }), className)}
  data-orientation={orientation}
  data-slot="field"
  role="group"
  bind:this={ref}
  {...restProps}
>
  {@render children?.()}
</div>

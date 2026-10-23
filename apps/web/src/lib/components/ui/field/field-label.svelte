<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { Label } from "#lib/components/ui/label/index.js";
  import { cn } from "#lib/utils.js";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: ComponentProps<typeof Label> = $props();
</script>

<Label
  class={cn(
    "group/field-label peer/field-label flex w-fit gap-2 leading-snug has-[>[data-slot=field]]:has-[:focus-visible]:border-ring has-[>[data-slot=field]]:has-[:focus-visible]:ring-3 has-[>[data-slot=field]]:has-[:focus-visible]:ring-ring/50 has-[>[data-slot=field]]:rounded-2xl has-[>[data-slot=field]]:border has-data-checked:bg-input/30 has-[>[data-slot=field]]:not-has-[:disabled,[data-disabled]]:hover:bg-input/40 *:data-[slot=field]:p-4 group-data-[disabled=true]/field:opacity-50",
    "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col",
    className
  )}
  data-slot="field-label"
  bind:ref
  {...restProps}
>
  {@render children?.()}
</Label>

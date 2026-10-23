# Web App Rules

## UI

- Build UI from the shadcn-svelte primitives in `#lib/components/ui`. Add missing ones with `bunx shadcn-svelte@latest add <name>` from `apps/web`; never hand-edit files in `ui/`.
- Put feature components that compose primitives in `#lib/components`.
- Style with the theme tokens in `src/routes/layout.css` (`bg-primary`, `text-muted-foreground`); add a token instead of hardcoding a color.

import adapter from "@sveltejs/adapter-vercel";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    varlockVitePlugin({ ssrInjectMode: "resolved-env" }),
    tailwindcss(),
    sveltekit({
      adapter: adapter({ runtime: "nodejs24.x" }),
      compilerOptions: {
        experimental: { async: true },
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.includes("node_modules") ? undefined : true,
      },
      experimental: { remoteFunctions: true },
    }),
  ],
});

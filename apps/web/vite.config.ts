import adapter from "@sveltejs/adapter-vercel";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      // Pinned so the build doesn't depend on the local Node version.
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
  server: {
    // Portless replaces the variable Amp uses to allow its portal hostname, so
    // allow every host inside an orb. Never outside one.
    allowedHosts: process.env.AMP_ORB ? true : undefined,
  },
});

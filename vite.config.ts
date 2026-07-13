// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Auto-detect deploy target so this project builds on Cloudflare (default),
// Vercel, and Netlify without config changes. Each host sets its own env var
// during the build; Nitro maps that to the correct output preset.
function detectPreset(): string {
  if (process.env.VERCEL) return "vercel";
  if (process.env.NETLIFY) return "netlify";
  if (process.env.NITRO_PRESET) return process.env.NITRO_PRESET;
  return "cloudflare-module";
}

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    preset: detectPreset(),
  },
});

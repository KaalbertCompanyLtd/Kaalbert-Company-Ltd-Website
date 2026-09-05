import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const dirname = path.dirname(fileURLToPath(import.meta.url));

// Minimal Vitest scaffold (T3.2, docs/tasks/03-diagnostic.md — see memory/technical-debt.md
// "Vitest never scaffolded"). `jsdom` is the default environment so a future component test
// (React Testing Library, per CLAUDE.md's stated stack) works without per-file overrides;
// pure `lib/` logic tests like this task's run fine under it too. The `@` alias mirrors
// tsconfig.json's `"@/*": ["./*"]` so `lib/` modules can `import "@/lib/..."` the same way
// application code does.
export default defineConfig({
  test: {
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": path.resolve(dirname, "."),
    },
  },
});

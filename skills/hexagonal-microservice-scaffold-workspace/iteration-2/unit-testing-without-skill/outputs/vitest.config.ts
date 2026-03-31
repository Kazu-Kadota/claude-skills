// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use the V8 coverage provider — fast and accurate for TypeScript
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/_test/**", "src/**/*.spec.ts", "src/**/*.test.ts"],
    },

    // Run unit tests and e2e tests in the same Vitest process pool — in-memory
    // stubs remove the need for separate process isolation.
    pool: "forks",

    // Resolve `.js` extension imports to TypeScript sources (ESM convention)
    alias: {
      // vitest handles tsconfig paths automatically when using the config below
    },

    // Include all spec files under src/
    include: ["src/**/*.spec.ts", "src/**/*.test.ts"],
    exclude: ["node_modules", "dist"],

    // Helpful for identifying slow tests during development
    slowTestThreshold: 500,
  },

  resolve: {
    // Allow importing `./foo.js` to resolve to `./foo.ts` (ESM + ts-node style)
    extensions: [".ts", ".js"],
  },
});

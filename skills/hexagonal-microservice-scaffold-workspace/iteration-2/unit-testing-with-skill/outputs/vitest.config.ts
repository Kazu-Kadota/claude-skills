import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Run domain and use-case unit tests by default
    include: ["src/**/*.test.ts"],
    // E2E tests are run separately via `npm run test:e2e`
    exclude: ["_test/e2e/**"],
    environment: "node",
  },
});

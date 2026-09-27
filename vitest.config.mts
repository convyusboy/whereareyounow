import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    // Next.js aliases this to a no-op internally for server-only code; a
    // plain Node/Vite resolution hits the package's real (throwing) index.js.
    alias: { "server-only": fileURLToPath(new URL("./tests/server-only-shim.ts", import.meta.url)) },
  },
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000,
  },
});

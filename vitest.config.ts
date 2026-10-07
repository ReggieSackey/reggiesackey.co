import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "convex/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@convex": path.resolve(__dirname, "./convex"),
      // `server-only` throws outside a Next.js server context; tests run in
      // plain node and exercise these modules through the injectable layer.
      "server-only": path.resolve(__dirname, "./src/test/stub-server-only.ts"),
    },
  },
});

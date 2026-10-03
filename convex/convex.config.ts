import { defineApp } from "convex/server";
import { v } from "convex/values";

const app = defineApp({
  env: {
    /**
     * One-time first-admin bootstrap flag. Set to "1" on the deployment
     * (dev or prod) ONLY while bootstrapping, then remove it.
     * See convex/admin.ts and README.
     */
    ADMIN_BOOTSTRAP_ENABLED: v.optional(v.string()),

    /**
     * Development content seed flag. Set to "1" to allow running
     * `npx convex run seed:seedDevContent`. Keep OFF in production.
     */
    ALLOW_DEV_SEED: v.optional(v.string()),
  },
});

export default app;

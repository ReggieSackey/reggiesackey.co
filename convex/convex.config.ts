import { defineApp } from "convex/server";
import rateLimiter from "@convex-dev/rate-limiter/convex.config.js";
import { v } from "convex/values";

const app = defineApp({
  env: {
    /**
     * One-time first-admin bootstrap flag. Set to "1" on the deployment
     * (dev or prod) ONLY while bootstrapping, then remove it.
     * See convex/admin.ts and README.
     */
    ANALYSIS_SERVER_SECRET: v.optional(v.string()),
    ANALYSIS_BURST: v.optional(v.string()),
    ANALYSIS_HOURLY: v.optional(v.string()),
    ANALYSIS_DAILY_CALLS: v.optional(v.string()),
    ANALYSIS_CONCURRENCY: v.optional(v.string()),
    ANALYSIS_FAILURE_LIMIT: v.optional(v.string()),
    ADMIN_BOOTSTRAP_ENABLED: v.optional(v.string()),

    /**
     * Development content seed flag. Set to "1" to allow running
     * `npx convex run seed:seedDevContent`. Keep OFF in production.
     */
    ALLOW_DEV_SEED: v.optional(v.string()),
  },
});

app.use(rateLimiter);
export default app;

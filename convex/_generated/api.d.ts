/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as analysisGuards from "../analysisGuards.js";
import type * as canonicalCapabilities from "../canonicalCapabilities.js";
import type * as capabilities from "../capabilities.js";
import type * as caseStudies from "../caseStudies.js";
import type * as evidence from "../evidence.js";
import type * as jobAnalyses from "../jobAnalyses.js";
import type * as portfolioCaseStudy from "../portfolioCaseStudy.js";
import type * as profileDocuments from "../profileDocuments.js";
import type * as seed from "../seed.js";
import type * as seedData from "../seedData.js";
import type * as serverAuth from "../serverAuth.js";
import type * as testHelpers from "../testHelpers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  analysisGuards: typeof analysisGuards;
  canonicalCapabilities: typeof canonicalCapabilities;
  capabilities: typeof capabilities;
  caseStudies: typeof caseStudies;
  evidence: typeof evidence;
  jobAnalyses: typeof jobAnalyses;
  portfolioCaseStudy: typeof portfolioCaseStudy;
  profileDocuments: typeof profileDocuments;
  seed: typeof seed;
  seedData: typeof seedData;
  serverAuth: typeof serverAuth;
  testHelpers: typeof testHelpers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
};

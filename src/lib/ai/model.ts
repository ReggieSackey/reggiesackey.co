import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { wrapLanguageModel } from "ai";
import type { LanguageModel } from "ai";

/**
 * GLM via Z.AI's OpenAI-compatible API. Server-only — importing this
 * module from a client component is a build error ("server-only").
 *
 * Configuration (env):
 *   ZAI_API_KEY   — required. Server-side only; never NEXT_PUBLIC_.
 *   ZAI_BASE_URL  — optional override. Defaults to Z.AI's general API.
 *   ZAI_MODEL     — optional override. Defaults to glm-5.3-flash.
 *   ZAI_REASONING_EFFORT — optional override. low | high | max.
 *                   Defaults to low (see REASONING_EFFORT_DEFAULT).
 *
 * Fails loudly and clearly when configuration is missing.
 *
 * Z.AI GLM specifics this module encodes (per current Z.AI docs):
 *  1. Structured output must use Z.AI JSON object mode
 *     (response_format: {"type":"json_object"}) — Z.AI ignores/tolerates
 *     OpenAI's json_schema format, which let GLM drift into
 *     fenced/markdown/YAML-ish output. We force json mode at the model
 *     layer via middleware and never send a schema over the wire.
 *  2. Reasoning: GLM-5.3/5.3-Flash ALWAYS reasons — thinking cannot be
 *     disabled (thinking.type accepts only "enabled"). The cost/depth
 *     control is `reasoning_effort` (low | high | max, default max).
 *     Per Z.AI's migration notice, requests that used to send
 *     thinking.type "disabled" (our old GLM-4.6 setup) MUST change to
 *     enabled + reasoning_effort "low" before switching the model id.
 *     This pipeline runs constrained extraction/evaluation tasks, so we
 *     default to the LOWEST supported effort. Neither @ai-sdk/openai nor
 *     the OpenAI schema carries these fields, so we inject both via the
 *     provider's documented `fetch` interception point.
 *  3. response_format json_object remains supported on GLM-5.3-Flash.
 */

export const ZAI_BASE_URL_DEFAULT = "https://api.z.ai/api/paas/v4";

export const ZAI_MODEL_DEFAULT = "glm-5.3-flashx";

/** Lowest supported reasoning effort (low | high | max). */
export const ZAI_REASONING_EFFORT_DEFAULT = "low";

/** Allowed reasoning-effort values, per current Z.AI GLM-5.3 docs. */
export const REASONING_EFFORTS = ["low", "high", "max"] as const;
export type ReasoningEffort = (typeof REASONING_EFFORTS)[number];

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[ai] Missing ${name}. Set it in .env.local (dev) or the Vercel ` +
        `project environment (prod). See .env.example.`,
    );
  }
  return value;
}

export function getZaiConfig() {
  const effort = process.env.ZAI_REASONING_EFFORT?.trim() || ZAI_REASONING_EFFORT_DEFAULT;
  if (!REASONING_EFFORTS.includes(effort as ReasoningEffort)) {
    throw new Error(
      `[ai] Invalid ZAI_REASONING_EFFORT "${effort}". Supported: ${REASONING_EFFORTS.join(", ")}.`,
    );
  }
  return {
    apiKey: requireEnv("ZAI_API_KEY"),
    baseURL: process.env.ZAI_BASE_URL?.trim() || ZAI_BASE_URL_DEFAULT,
    model: process.env.ZAI_MODEL?.trim() || ZAI_MODEL_DEFAULT,
    reasoningEffort: effort as ReasoningEffort,
  };
}

/**
 * GLM-5.3 reasoning configuration applied to every chat-completions
 * request: thinking enabled (the only supported mode) + explicit
 * reasoning_effort (defaults to "low" for this constrained pipeline).
 */
export interface ReasoningConfig {
  thinkingType: "enabled";
  reasoningEffort: ReasoningEffort;
}

export function getReasoningConfig(): ReasoningConfig {
  const { reasoningEffort } = getZaiConfig();
  return { thinkingType: "enabled", reasoningEffort };
}

/** Exposed for diagnostics logging (never the key itself). */
export function isThinkingDisabled(): boolean {
  // GLM-5.3-Flash: reasoning is always on; it is controlled by
  // reasoning_effort, not by a disable switch.
  return false;
}

type FetchInit = Parameters<typeof globalThis.fetch>[1];

/**
 * Custom fetch that injects Z.AI's GLM-5.3 reasoning fields into the
 * chat-completions JSON body. postJsonToApi passes the body as a
 * pre-serialized string (verified against provider-utils 4.x), so we
 * parse, inject, and re-serialize.
 */
function zaiReasoningFetch(fetchFn: typeof globalThis.fetch) {
  return async function fetchWithReasoningConfig(
    url: Parameters<typeof fetchFn>[0],
    init?: FetchInit,
  ): Promise<Response> {
    if (
      typeof url === "string" &&
      url.includes("/chat/completions") &&
      typeof init?.body === "string"
    ) {
      try {
        const body = JSON.parse(init.body) as Record<string, unknown>;
        if (body && typeof body === "object") {
          const { thinkingType, reasoningEffort } = getReasoningConfig();
          init = {
            ...init,
            body: JSON.stringify({
              ...body,
              thinking: { type: thinkingType },
              reasoning_effort: reasoningEffort,
            }),
          };
        }
      } catch {
        // Not a JSON body (unexpected) — send unmodified.
      }
    }
    return fetchFn(url, init);
  };
}

/** Lazily-built provider; throws a clear error if not configured. */
let provider: ReturnType<typeof createOpenAI> | null = null;

export function getGLMModel(): LanguageModel {
  if (!provider) {
    const { apiKey, baseURL } = getZaiConfig();
    provider = createOpenAI({
      apiKey,
      baseURL,
      name: "zai",
      fetch: zaiReasoningFetch(globalThis.fetch),
    });
  }

  return wrapLanguageModel({
    model: provider.chat(getZaiConfig().model),
    middleware: {
      // Z.AI JSON object mode: the chat provider maps responseFormat
      // {type:"json"} (no schema) to response_format {"type":"json_object"}.
      transformParams: async ({ params }) => ({
        ...params,
        responseFormat: { type: "json" },
      }),
    },
  });
}

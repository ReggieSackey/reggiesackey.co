import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { getFunctionName } from "convex/server";
const calls = vi.hoisted(() => ({
  query: vi.fn(),
  mutation: vi.fn(),
  pipeline: vi.fn(),
}));
vi.mock("convex/nextjs", () => ({
  fetchQuery: calls.query,
  fetchMutation: calls.mutation,
}));
vi.mock("@/lib/ai/model", () => ({
  getZaiConfig: () => ({ model: "test", reasoningEffort: "low" }),
}));
vi.mock("@/lib/ai/pipeline", () => ({ runTargeted: calls.pipeline }));
import { POST } from "@/app/api/analyze/route";
const validRequest = () =>
  new Request("http://localhost/api/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jobDescription:
        "Build and own TypeScript applications with a team, using application databases and production debugging. ".repeat(
          2,
        ),
    }),
  });
beforeEach(() => {
  vi.stubEnv("ANALYSIS_SERVER_SECRET", "s".repeat(40));
  vi.stubEnv("ANALYSIS_IP_SALT", "x".repeat(40));
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VERCEL", "");
  calls.query.mockReset();
  calls.mutation.mockReset();
  calls.pipeline.mockReset();
  calls.query.mockImplementation(async (ref) =>
    getFunctionName(ref) === "capabilities:getSnapshot"
      ? { version: "v1", capabilities: [{ id: "cap", title: "Ownership" }] }
      : null,
  );
  calls.mutation.mockImplementation(async (ref) =>
    getFunctionName(ref) === "analysisGuards:admitRequest"
      ? { ok: true, retryAfter: 0 }
      : { status: "reserved", id: "analysis", lease: "lease", retryAfter: 0 },
  );
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
test("HTTP cache hit returns ID with no reservation, model call, or raw JD storage", async () => {
  calls.query.mockImplementation(async (ref) =>
    getFunctionName(ref) === "capabilities:getSnapshot"
      ? { version: "v1", capabilities: [] }
      : "cached-id",
  );
  const response = await POST(validRequest());
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ id: "cached-id" });
  expect(calls.pipeline).not.toHaveBeenCalled();
  expect(calls.mutation).toHaveBeenCalledTimes(1);
});
test("HTTP 429 includes Retry-After and never spends", async () => {
  calls.mutation.mockResolvedValue({ ok: false, retryAfter: 1200 });
  const response = await POST(validRequest());
  expect(response.status).toBe(429);
  expect(response.headers.get("Retry-After")).toBe("2");
  expect(calls.query).not.toHaveBeenCalled();
  expect(calls.pipeline).not.toHaveBeenCalled();
});
test.each(["budget", "busy", "circuit"])(
  "HTTP %s rejection never calls model",
  async (status) => {
    calls.mutation.mockImplementation(async (ref) =>
      getFunctionName(ref) === "analysisGuards:admitRequest"
        ? { ok: true, retryAfter: 0 }
        : { status, retryAfter: 60000 },
    );
    const response = await POST(validRequest());
    expect(response.status).toBe(503);
    expect(calls.pipeline).not.toHaveBeenCalled();
  },
);
test("malformed body cannot create analysis", async () => {
  const response = await POST(
    new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "null",
    }),
  );
  expect(response.status).toBe(400);
  expect(calls.pipeline).not.toHaveBeenCalled();
  expect(calls.query).not.toHaveBeenCalled();
});
test("provider failure releases lease and persists only a fixed safe error", async () => {
  calls.pipeline.mockRejectedValue(
    new Error("PRIVATE_JD SECRET_PROVIDER_BODY"),
  );
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  const response = await POST(validRequest());
  expect(response.status).toBe(503);
  const serialized = JSON.stringify([
    await response.json(),
    log.mock.calls,
    calls.mutation.mock.calls.map((c) => c[1]),
  ]);
  expect(serialized).not.toMatch(
    /PRIVATE_JD|SECRET_PROVIDER_BODY|rawJobDescription/,
  );
  expect(
    calls.mutation.mock.calls.some(
      (c) => getFunctionName(c[0]) === "analysisGuards:release" && c[1].failed,
    ),
  ).toBe(true);
});
test("evidence changing during generation prevents publication", async () => {
  let snapshots = 0;
  calls.query.mockImplementation(async (ref) =>
    getFunctionName(ref) === "capabilities:getSnapshot"
      ? {
          version: ++snapshots === 1 ? "v1" : "v2",
          capabilities: [{ id: "cap" }],
        }
      : null,
  );
  calls.pipeline.mockResolvedValue({
    extractedJob: { jobTitle: null, company: null },
    validated: {
      overallAssessment: { fit: "strong", narrative: "test" },
      themes: [],
      materialGaps: [],
      interviewQuestions: [],
    },
  });
  expect((await POST(validRequest())).status).toBe(503);
  expect(
    calls.mutation.mock.calls.some(
      (c) => getFunctionName(c[0]) === "jobAnalyses:markAnalysisComplete",
    ),
  ).toBe(false);
});

import { safeFailureCode } from "@/lib/ai/failures";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { hashJobDescription } from "@/lib/ai/jd";
import {
  readJobRequest,
  clientKey,
  analysisSecret,
  RequestError,
} from "@/lib/ai/request";
import { analysisCacheKey } from "@/lib/ai/cache";
import { getZaiConfig } from "@/lib/ai/model";
import { runTargeted } from "@/lib/ai/pipeline";
import { Timings, modelRun, newMetrics } from "@/lib/ai/telemetry";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  return modelRun.run(newMetrics(), async () => {
    const timing = new Timings();
    let id: Id<"jobAnalyses"> | undefined,
      lease: Id<"analysisLeases"> | undefined;
    let outcome = "failed",
      failed = true;
    try {
      const secret = analysisSecret();
      const admission = await timing.measure("rateLimit", () =>
        fetchMutation(api.analysisGuards.admitRequest, {
          secret,
          clientKey: clientKey(request),
        }),
      );
      if (!admission.ok) {
        outcome = "rate-limit";
        return Response.json(
          { error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(
                Math.max(1, Math.ceil(admission.retryAfter / 1000)),
              ),
            },
          },
        );
      }
      const jd = await timing.measure("parseNormalize", () =>
        readJobRequest(request),
      );
      const inputHash = await timing.measure("hash", () =>
        hashJobDescription(jd),
      );
      const snapshot = await timing.measure("snapshot", () =>
        fetchQuery(api.capabilities.getSnapshot, { secret }),
      );
      const model = getZaiConfig();
      const cacheKey = await analysisCacheKey(
        inputHash,
        snapshot.version,
        model.model,
        model.reasoningEffort,
      );
      const cached = await timing.measure("cache", () =>
        fetchQuery(api.analysisGuards.cached, { secret, cacheKey }),
      );
      if (cached) {
        outcome = "cache-hit";
        return Response.json({ id: cached });
      }
      if (!snapshot.capabilities.length)
        throw new RequestError(
          503,
          "Analysis is being prepared. Please check back soon.",
        );
      const reservation = await timing.measure("createReserve", () =>
        fetchMutation(api.analysisGuards.reserve, {
          secret,
          cacheKey,
          inputHash,
        }),
      );
      if (
        reservation.status === "cached" ||
        reservation.status === "processing"
      ) {
        outcome = reservation.status;
        return Response.json(
          { id: reservation.id },
          { status: reservation.status === "processing" ? 202 : 200 },
        );
      }
      if (
        reservation.status !== "reserved" ||
        !reservation.id ||
        !reservation.lease
      ) {
        outcome = reservation.status;
        return Response.json(
          {
            error:
              "Analysis is temporarily unavailable. Please try again later.",
          },
          {
            status: 503,
            headers: {
              "Retry-After": String(
                Math.max(1, Math.ceil(reservation.retryAfter / 1000)),
              ),
            },
          },
        );
      }
      id = reservation.id;
      lease = reservation.lease;
      const { extractedJob, validated } = await runTargeted({
        jd,
        capabilities: snapshot.capabilities,
        timing,
        retrieve: (ids) =>
          fetchQuery(api.capabilities.retrieve, {
            secret,
            version: snapshot.version,
            capabilityIds: ids as Id<"capabilities">[],
          }),
      });
      // Refuse to publish a result against evidence that changed during synthesis.
      const current = await fetchQuery(api.capabilities.getSnapshot, {
        secret,
      });
      if (current.version !== snapshot.version)
        throw new Error("Evidence changed");
      await timing.measure("persist", () =>
        fetchMutation(api.jobAnalyses.markAnalysisComplete, {
          secret,
          id: id!,
          jobTitle: extractedJob.jobTitle ?? undefined,
          company: extractedJob.company ?? undefined,
          overallFit: validated.overallAssessment.fit,
          overallNarrative: validated.overallAssessment.narrative,
          themes: validated.themes,
          materialGaps: validated.materialGaps,
          interviewQuestions: validated.interviewQuestions,
        }),
      );
      failed = false;
      outcome = "complete";
      return Response.json({ id });
    } catch (error) {
      outcome = safeFailureCode(error);
      if (id)
        await fetchMutation(api.jobAnalyses.markAnalysisFailed, {
          secret: analysisSecret(),
          id,
          errorMessage: "analysis_failed",
        }).catch(() => {});
      if (error instanceof RequestError) {
        outcome = `request-${error.status}`;
        return Response.json(
          { error: error.message },
          { status: error.status },
        );
      }
      return Response.json(
        {
          error: "Analysis is temporarily unavailable. Please try again later.",
        },
        { status: 503 },
      );
    } finally {
      if (lease)
        await fetchMutation(api.analysisGuards.release, {
          secret: analysisSecret(),
          lease,
          failed,
        }).catch(() => {
          console.error("[analyze] lease release failed");
        });
      timing.finish(outcome);
    }
  });
}

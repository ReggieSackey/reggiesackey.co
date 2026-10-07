import { withAuth } from "@workos-inc/authkit-nextjs";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { generateCapabilities } from "@/lib/ai/generateCapabilities";
import { modelRun, newMetrics, Timings } from "@/lib/ai/telemetry";
import { analysisSecret } from "@/lib/ai/request";
export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin" }, { status: 403 });
  return modelRun.run(newMetrics(), async () => {
    const timing = new Timings();
    let lease;
    let failed = true;
    try {
      const { accessToken } = await withAuth({ ensureSignedIn: true });
      const options = { token: accessToken };
      // Convex checks the actual administrator role before any provider call.
      const corpus = await fetchQuery(
        api.capabilities.adminCorpus,
        {},
        options,
      );
      const existing = await fetchQuery(
        api.capabilities.adminList,
        {},
        options,
      );
      const secret = analysisSecret();
      const reservation = await fetchMutation(api.analysisGuards.reserve, {
        secret,
      });
      if (reservation.status !== "reserved" || !reservation.lease)
        return Response.json(
          { error: "Generation temporarily unavailable" },
          { status: 503 },
        );
      lease = reservation.lease;
      const result = await generateCapabilities(
        corpus.sources,
        existing.capabilities,
      );
      await fetchMutation(
        api.capabilities.saveProposals,
        { corpusVersion: corpus.version, proposals: result.proposals },
        options,
      );
      failed = false;
      return Response.json({ count: result.proposals.length });
    } catch {
      return Response.json(
        {
          error:
            "Unable to generate proposals. Check admin access, configuration, and pending proposals.",
        },
        { status: 400 },
      );
    } finally {
      if (lease)
        await fetchMutation(api.analysisGuards.release, {
          secret: analysisSecret(),
          lease,
          failed,
        }).catch(() => {});
      timing.finish(
        failed
          ? "capability-generation-failed"
          : "capability-generation-complete",
      );
    }
  });
}

// @vitest-environment edge-runtime
/// <reference types="vite/client" />
import { beforeEach, afterEach, expect, test, vi } from "vitest";
import { convexTest } from "convex-test";
import rateLimiterTest from "@convex-dev/rate-limiter/test";
import schema from "./schema";
import { api } from "./_generated/api";
import { CANONICAL_CAPABILITIES } from "./canonicalCapabilities";
const modules = import.meta.glob("./**/*.ts");
const secret = "s".repeat(40),
  clientKey = "a".repeat(64);
function setup() {
  const t = convexTest(schema, modules);
  rateLimiterTest.register(t);
  return t;
}
beforeEach(() => {
  vi.stubEnv("ANALYSIS_SERVER_SECRET", secret);
});
afterEach(() => vi.unstubAllEnvs());

async function corpus(t: ReturnType<typeof setup>) {
  return t.run(async (ctx) => {
    await ctx.db.insert("users", {
      authId: "admin",
      email: "admin@example.test",
      role: "admin",
    });
    const id = await ctx.db.insert("caseStudies", {
      slug: "project",
      title: "Project",
      companyOrProject: "Example",
      summary: "Demo",
      published: true,
      createdAt: 1,
      updatedAt: 1,
    });
    const section = await ctx.db.insert("caseStudySections", {
      caseStudyId: id,
      slug: "engineering",
      heading: "Engineering",
      body: "Built a production application.",
      order: 0,
    });
    return { id, section };
  });
}
const proposal = {
  slug: "product-engineering",
  title: "Product engineering",
  description: "Build applications from customer needs",
  tags: [],
  evidence: [
    {
      sourceType: "caseStudy" as const,
      sourceId: "project",
      sectionId: "engineering",
      note: "Application ownership",
    },
  ],
};

async function canonicalCorpus(t: ReturnType<typeof setup>) {
  await t.run(async (ctx) => {
    const grouped = new Map<
      string,
      { sourceType: "caseStudy" | "profile"; sections: Set<string> }
    >();
    for (const capability of CANONICAL_CAPABILITIES) {
      for (const ref of capability.evidence) {
        const key = `${ref.sourceType}:${ref.sourceId}`;
        const group = grouped.get(key) ?? {
          sourceType: ref.sourceType,
          sections: new Set<string>(),
        };
        group.sections.add(ref.sectionId);
        grouped.set(key, group);
      }
    }
    for (const [key, group] of grouped) {
      const sourceId = key.slice(key.indexOf(":") + 1);
      if (group.sourceType === "caseStudy") {
        const parent = await ctx.db.insert("caseStudies", {
          slug: sourceId,
          title: sourceId,
          companyOrProject: "Test",
          summary: "Canonical test source",
          published: true,
          createdAt: 1,
          updatedAt: 1,
        });
        let order = 0;
        for (const sectionId of group.sections)
          await ctx.db.insert("caseStudySections", {
            caseStudyId: parent,
            slug: sectionId,
            heading: sectionId,
            body: `Published evidence for ${sectionId}.`,
            order: order++,
          });
      } else {
        const parent = await ctx.db.insert("profileDocuments", {
          type: sourceId,
          title: sourceId,
          published: true,
        });
        let order = 0;
        for (const sectionId of group.sections)
          await ctx.db.insert("profileSections", {
            profileDocumentId: parent,
            slug: sectionId,
            heading: sectionId,
            body: `Published evidence for ${sectionId}.`,
            order: order++,
          });
      }
    }
  });
}

test("anonymous callers cannot access registry administration or analysis writes", async () => {
  const t = setup();
  await expect(t.query(api.capabilities.adminList, {})).rejects.toThrow();
  await expect(
    t.mutation(api.capabilities.saveProposals, {
      corpusVersion: "x",
      proposals: [proposal],
    }),
  ).rejects.toThrow();
  await expect(
    t.mutation(api.analysisGuards.reserve, { secret: "wrong" }),
  ).rejects.toThrow("Unauthorized");
  const a = await t.mutation(api.analysisGuards.reserve, {
    secret,
    cacheKey: "x",
  });
  await expect(
    t.mutation(api.jobAnalyses.markAnalysisComplete, {
      secret: "wrong",
      id: a.id!,
    }),
  ).rejects.toThrow("Unauthorized");
  await expect(
    t.mutation(api.jobAnalyses.markAnalysisFailed, {
      secret: "wrong",
      id: a.id!,
      errorMessage: "x",
    }),
  ).rejects.toThrow("Unauthorized");
});
test("viewer identity cannot approve capabilities", async () => {
  const t = setup();
  await t.run((ctx) =>
    ctx.db.insert("users", {
      authId: "viewer",
      email: "viewer@example.test",
      role: "viewer",
    }),
  );
  await expect(
    t
      .withIdentity({ subject: "viewer" })
      .query(api.capabilities.adminCorpus, {}),
  ).rejects.toThrow("Admin role");
});
test("proposal references, stale approvals, explicit merge, and targeted retrieval", async () => {
  const t = setup();
  const source = await corpus(t);
  const admin = t.withIdentity({ subject: "admin" });
  const c = await admin.query(api.capabilities.adminCorpus, {});
  await expect(
    admin.mutation(api.capabilities.saveProposals, {
      corpusVersion: c.version,
      proposals: [
        {
          ...proposal,
          evidence: [{ ...proposal.evidence[0], sectionId: "invented" }],
        },
      ],
    }),
  ).rejects.toThrow("Invalid published");
  await admin.mutation(api.capabilities.saveProposals, {
    corpusVersion: c.version,
    proposals: [proposal],
  });
  const p = (await admin.query(api.capabilities.adminList, {})).proposals[0];
  await t.run((ctx) =>
    ctx.db.patch(source.section, { body: "Updated production application." }),
  );
  await expect(
    admin.mutation(api.capabilities.review, {
      id: p._id,
      decision: "approve",
      edited: proposal,
    }),
  ).rejects.toThrow("Corpus changed");
  await admin.mutation(api.capabilities.review, {
    id: p._id,
    decision: "reject",
    edited: proposal,
  });
  const current = await admin.query(api.capabilities.adminCorpus, {});
  await admin.mutation(api.capabilities.saveProposals, {
    corpusVersion: current.version,
    proposals: [proposal],
  });
  const next = (await admin.query(api.capabilities.adminList, {})).proposals[0];
  await admin.mutation(api.capabilities.review, {
    id: next._id,
    decision: "approve",
    edited: proposal,
  });
  const snapshot = await t.query(api.capabilities.getSnapshot, { secret });
  expect(snapshot.capabilities).toHaveLength(1);
  const evidence = await t.query(api.capabilities.retrieve, {
    secret,
    version: snapshot.version,
    capabilityIds: [snapshot.capabilities[0].id],
  });
  expect(evidence[0].body).toBe("Updated production application.");
  await t.run((ctx) => ctx.db.patch(source.id, { published: false }));
  await expect(
    t.query(api.capabilities.retrieve, {
      secret,
      version: snapshot.version,
      capabilityIds: [snapshot.capabilities[0].id],
    }),
  ).rejects.toThrow("Evidence changed");
  const changed = await t.query(api.capabilities.getSnapshot, { secret });
  await expect(
    t.query(api.capabilities.retrieve, {
      secret,
      version: changed.version,
      capabilityIds: [snapshot.capabilities[0].id],
    }),
  ).rejects.toThrow("No published evidence");
});
test("canonical registry sync validates evidence and is exact and idempotent", async () => {
  const t = setup();
  await t.run((ctx) =>
    ctx.db.insert("users", {
      authId: "admin",
      email: "admin@example.test",
      role: "admin",
    }),
  );
  const admin = t.withIdentity({ subject: "admin" });

  await expect(
    admin.mutation(api.capabilities.syncCanonicalRegistry, {}),
  ).rejects.toThrow("Invalid published evidence reference");
  expect((await admin.query(api.capabilities.adminList, {})).capabilities).toHaveLength(0);

  await canonicalCorpus(t);
  await t.run(async (ctx) => {
    await ctx.db.insert("capabilities", {
      slug: "obsolete-capability",
      title: "Obsolete",
      description: "Should be deactivated by exact canonical sync.",
      tags: [],
      active: true,
      createdAt: 1,
      updatedAt: 1,
    });
  });

  const first = await admin.mutation(api.capabilities.syncCanonicalRegistry, {});
  expect(first).toMatchObject({
    inserted: 12,
    updated: 0,
    unchanged: 0,
    deactivated: 1,
    activeCount: 12,
  });
  const second = await admin.mutation(api.capabilities.syncCanonicalRegistry, {});
  expect(second).toMatchObject({
    inserted: 0,
    updated: 0,
    unchanged: 12,
    deactivated: 0,
    activeCount: 12,
  });

  const active = (await admin.query(api.capabilities.adminList, {})).capabilities;
  expect(active).toHaveLength(12);
  expect(active.map(({ slug }) => slug).sort()).toEqual(
    CANONICAL_CAPABILITIES.map(({ slug }) => slug).sort(),
  );
  expect(new Set(active.map(({ slug }) => slug)).size).toBe(12);
  for (const capability of active) {
    const canonical = CANONICAL_CAPABILITIES.find(
      ({ slug }) => slug === capability.slug,
    );
    expect(capability).toMatchObject({
      title: canonical?.title,
      description: canonical?.description,
      tags: canonical?.tags,
    });
    expect(capability.evidence).toEqual(
      [...(canonical?.evidence ?? [])].sort((a, b) =>
        JSON.stringify([a.sourceType, a.sourceId, a.sectionId]).localeCompare(
          JSON.stringify([b.sourceType, b.sourceId, b.sectionId]),
        ),
      ),
    );
  }
});
test("shared burst and hourly limits survive separate calls", async () => {
  vi.stubEnv("ANALYSIS_BURST", "2");
  vi.stubEnv("ANALYSIS_HOURLY", "1");
  const t = setup();
  expect(
    (await t.mutation(api.analysisGuards.admitRequest, { secret, clientKey }))
      .ok,
  ).toBe(true);
  const limited = await t.mutation(api.analysisGuards.admitRequest, {
    secret,
    clientKey,
  });
  expect(limited.ok).toBe(false);
  expect(limited.retryAfter).toBeGreaterThan(0);
  expect(
    (
      await t.mutation(api.analysisGuards.admitRequest, {
        secret,
        clientKey: "b".repeat(64),
      })
    ).ok,
  ).toBe(true);
});
test("atomic reservations cap concurrency and daily calls, never refund failures", async () => {
  vi.stubEnv("ANALYSIS_CONCURRENCY", "1");
  vi.stubEnv("ANALYSIS_DAILY_CALLS", "3");
  const t = setup();
  const a = await t.mutation(api.analysisGuards.reserve, {
    secret,
    cacheKey: "a",
  });
  expect(a.status).toBe("reserved");
  expect(
    (await t.mutation(api.analysisGuards.reserve, { secret, cacheKey: "a" }))
      .status,
  ).toBe("processing");
  expect(
    (await t.mutation(api.analysisGuards.reserve, { secret, cacheKey: "b" }))
      .status,
  ).toBe("budget");
  await t.mutation(api.analysisGuards.release, {
    secret,
    lease: a.lease!,
    failed: true,
  });
  expect(
    (await t.mutation(api.analysisGuards.reserve, { secret, cacheKey: "b" }))
      .status,
  ).toBe("budget");
});
test("a failed analysis is immediately retryable after atomic lease cleanup", async () => {
  vi.stubEnv("ANALYSIS_FAILURE_LIMIT", "5");
  const t = setup();
  const first = await t.mutation(api.analysisGuards.reserve, {
    secret,
    cacheKey: "retry-after-failure",
  });
  expect(first.status).toBe("reserved");

  await t.mutation(api.analysisGuards.release, {
    secret,
    lease: first.lease!,
    failed: true,
  });

  const retry = await t.mutation(api.analysisGuards.reserve, {
    secret,
    cacheKey: "retry-after-failure",
  });
  expect(retry.status).toBe("reserved");
  expect(retry.id).not.toBe(first.id);
});
test("concurrency and failure circuit reject before spend", async () => {
  vi.stubEnv("ANALYSIS_CONCURRENCY", "1");
  vi.stubEnv("ANALYSIS_FAILURE_LIMIT", "1");
  const t = setup();
  const a = await t.mutation(api.analysisGuards.reserve, { secret });
  expect(
    (await t.mutation(api.analysisGuards.reserve, { secret })).status,
  ).toBe("busy");
  await t.mutation(api.analysisGuards.release, {
    secret,
    lease: a.lease!,
    failed: true,
  });
  expect(
    (await t.mutation(api.analysisGuards.reserve, { secret })).status,
  ).toBe("circuit");
});
test("cache reuse does not spend and stale content/relationships invalidate version", async () => {
  const t = setup();
  const source = await corpus(t);
  const before = await t.query(api.capabilities.getSnapshot, { secret });
  const a = await t.mutation(api.analysisGuards.reserve, {
    secret,
    cacheKey: before.version,
  });
  await t.mutation(api.jobAnalyses.markAnalysisComplete, { secret, id: a.id! });
  expect(
    await t.query(api.analysisGuards.cached, {
      secret,
      cacheKey: before.version,
    }),
  ).toBe(a.id);
  expect(
    (
      await t.mutation(api.analysisGuards.reserve, {
        secret,
        cacheKey: before.version,
      })
    ).status,
  ).toBe("cached");
  await t.run((ctx) =>
    ctx.db.patch(source.section, { body: "Changed canonical facts" }),
  );
  const after = await t.query(api.capabilities.getSnapshot, { secret });
  expect(after.version).not.toBe(before.version);
  expect(
    await t.query(api.analysisGuards.cached, {
      secret,
      cacheKey: after.version,
    }),
  ).toBeNull();
  await t.run(async (ctx) => {
    const id = await ctx.db.insert("capabilities", {
      slug: "ownership",
      title: "Ownership",
      description: "Own delivery",
      tags: [],
      active: true,
      createdAt: 1,
      updatedAt: 1,
    });
    await ctx.db.insert("capabilityEvidence", {
      capabilityId: id,
      ...proposal.evidence[0],
    });
  });
  expect(
    (await t.query(api.capabilities.getSnapshot, { secret })).version,
  ).not.toBe(after.version);
});

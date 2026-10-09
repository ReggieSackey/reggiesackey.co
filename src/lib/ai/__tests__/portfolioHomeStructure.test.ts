import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const componentPath = fileURLToPath(
  new URL("../../../components/PortfolioHome.tsx", import.meta.url),
);
const source = readFileSync(componentPath, "utf8");
const helper = "I’ll compare it to my work and tell you where I fit.";

describe("homepage writing-surface structure", () => {
  it("keeps both empty-state lines in one placeholder and out of the footer", () => {
    expect(source).toContain("className=\"job-placeholder\"");
    expect(source).toContain("className=\"job-placeholder-primary\"");
    expect(source).toContain("className=\"job-placeholder-secondary\"");
    expect(source).toContain("className=\"input-footer\"");
    expect(source.match(new RegExp(helper, "g"))).toHaveLength(1);
    expect(source).not.toMatch(/input-footer[\s\S]{0,500}I’ll compare it to my work/);
  });
});

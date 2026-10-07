import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { normalizeJobDescription, MAX_JD_LENGTH, MIN_JD_LENGTH } from "./jd";
export class RequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
export function analysisSecret() {
  const secret = process.env.ANALYSIS_SERVER_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("Analysis service is not configured");
  return secret;
}
export function clientKey(request: Request): string {
  const secret = process.env.ANALYSIS_IP_SALT;
  if (!secret || secret.length < 32)
    throw new Error("Rate limiting is not configured");
  let ip = "local-development";
  if (process.env.VERCEL === "1") {
    ip = request.headers.get("x-vercel-forwarded-for")?.trim() ?? "";
    if (!isIP(ip))
      throw new RequestError(503, "Unable to identify request origin.");
    // Normalize IPv6 spellings and group a /64 to limit trivial address rotation.
    if (isIP(ip) === 6) {
      const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1);
      const [left, right = ""] = canonical.split("::");
      const a = left ? left.split(":") : [],
        b = right ? right.split(":") : [];
      const expanded = canonical.includes("::")
        ? [...a, ...Array(8 - a.length - b.length).fill("0"), ...b]
        : a;
      ip = expanded.slice(0, 4).join(":") + "::/64";
    }
  } else if (process.env.NODE_ENV === "production")
    throw new RequestError(503, "Unsupported proxy configuration.");
  // Stable across UTC midnight; TTL/retention handled in datastore, never log this key.
  return createHmac("sha256", secret).update(ip).digest("hex");
}
export async function readJobRequest(request: Request) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new RequestError(415, "Use application/json.");
  const maxBytes = 96_000;
  const declared = request.headers.get("content-length");
  if (declared && (!/^\d+$/.test(declared) || Number(declared) > maxBytes))
    throw new RequestError(413, "Request body is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new RequestError(400, "Invalid request body.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  const deadline = Date.now() + 10_000;
  try {
    while (true) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const result = await Promise.race([
        reader.read(),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () => reject(new RequestError(408, "Request timed out.")),
            Math.max(1, deadline - Date.now()),
          );
        }),
      ]).finally(() => clearTimeout(timer));
      if (result.done) break;
      size += result.value.length;
      if (size > maxBytes)
        throw new RequestError(413, "Request body is too large.");
      chunks.push(result.value);
    }
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError(400, "Invalid JSON body.");
  }
  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !("jobDescription" in body) ||
    typeof body.jobDescription !== "string"
  )
    throw new RequestError(400, "Job description is required.");
  if (body.jobDescription.length > MAX_JD_LENGTH)
    throw new RequestError(
      413,
      `Job descriptions are limited to ${MAX_JD_LENGTH} characters.`,
    );
  const jd = normalizeJobDescription(body.jobDescription);
  if (jd.length < MIN_JD_LENGTH)
    throw new RequestError(400, `Paste at least ${MIN_JD_LENGTH} characters.`);
  return jd;
}

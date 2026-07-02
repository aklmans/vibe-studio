// Deployment mode for the marketing-vs-app split.
//
// The repo ships both a marketing landing (src/app/landing/*) and the Vibe
// Studio builder (/studio, /demo, /obs/*). They serve different audiences: the
// landing is the owner's public showcase; the builder is what anyone clones and
// self-hosts. On a self-hosted / forked instance the landing is dead weight —
// and it carries the owner's brand — so it must not be the entry there.
//
// VIBE_SHOWCASE gates which surface owns "/". It is an opt-in, server-only flag:
//   - unset (default) → "app" mode: "/" belongs to the studio; the landing is
//     not the entry. Self-hosted and forked deploys land here, so they never
//     surface the owner-branded promo page.
//   - "1" / "true"    → "showcase" mode: "/" serves the marketing landing. Only
//     the owner's hosted showcase sets this.
//
// Keep this server-only (import it from server components / scripts, never from
// a "use client" module) so the flag stays out of the client bundle.

export type SiteMode = "showcase" | "app";

export function getSiteMode(
  env: Record<string, string | undefined> = process.env,
): SiteMode {
  const flag = (env.VIBE_SHOWCASE ?? "").trim().toLowerCase();
  return flag === "1" || flag === "true" ? "showcase" : "app";
}

export function isShowcase(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return getSiteMode(env) === "showcase";
}

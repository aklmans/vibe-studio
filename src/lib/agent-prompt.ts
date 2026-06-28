import type { OverlayState } from "../types";
import { CONFIG_BADGE_PROMPT_RULE } from "./badges";
import { projectConfigText } from "./session-config-drift";

/*
 * Compose a copy-paste prompt that hands the current config off to an external
 * AI tool, asking it to return an updated v1 `live-session.config.json`.
 *
 * This is pure string composition — no network, no LLM call, no dependency.
 * The user copies the result, runs it in their own AI tool, then imports the
 * returned JSON via the JSON drawer (which never auto-applies).
 *
 * `task` is an optional focused instruction (driven by the AI Prepare task
 * chips, e.g. "update only the sections"); `brief` is the user's plain-language
 * description of the stream.
 */
export function buildAgentPrompt(
  state: OverlayState,
  brief: string,
  task = "",
): string {
  const config = projectConfigText(state).trim();
  const trimmedBrief = brief.trim() || "(none)";
  const taskLine =
    task.trim() || "Task: prepare or update the config from the brief below.";
  return [
    "You are preparing live-session.config.json (v1) for a livestream config center.",
    "Return ONLY valid JSON matching this shape:",
    "{ version: 1, title, subtitle, author?, profile { avatarUrl, avatarVisible },",
    "  cover { visual, portraitUrl, sceneUrl }, badges: string[], stack: string[],",
    "  socials: [{ icon?, label, value, color? }], sections: [{ title, bullets: string[] }] }",
    CONFIG_BADGE_PROMPT_RULE,
    "Do NOT include runtime fields: bottomBar, liveSession.startedAt, activeSection, sectionsDone.",
    "",
    taskLine,
    `Brief: ${trimmedBrief}`,
    "",
    "Current config (edit this, keep version: 1):",
    config,
  ].join("\n");
}

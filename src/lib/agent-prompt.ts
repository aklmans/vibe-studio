import type { OverlayState } from "../types";
import { CONFIG_BADGE_PROMPT_RULE } from "./badges";
import { sanitizeConfigTextForProvider } from "./config-privacy";
import { projectConfigText } from "./session-config-drift";

/*
 * Compose a copy-paste prompt that hands the current stream *content* off to an
 * external AI tool, asking it to return updated content for the v1
 * `live-session.config.json`.
 *
 * This is pure string composition — no network, no LLM call, no dependency.
 * The user copies the result, runs it in their own AI tool, then imports the
 * returned JSON via the JSON drawer (which never auto-applies; identity + brand
 * are preserved from current state on apply).
 *
 * `task` is an optional focused instruction (driven by the AI Prepare task
 * chips, e.g. "update only the sections"); `brief` is the user's plain-language
 * description of the stream.
 */
export function buildAgentPrompt(
  state: OverlayState,
  brief: string,
  task = "",
  locale: "zh" | "en" = "zh",
): string {
  const config = sanitizeConfigTextForProvider(projectConfigText(state)).trim();
  const trimmedBrief = brief.trim() || "(none)";
  const fallbackLanguage = locale === "zh" ? "Simplified Chinese (简体中文)" : "English";
  const taskLine =
    task.trim() || "Task: prepare or update the stream content from the brief below.";
  return [
    "You are preparing the per-stream content of live-session.config.json (v1) for a livestream config center.",
    "Return ONLY valid JSON with this shape (content only):",
    "{ version: 1, title, subtitle, badges: string[], stack: string[],",
    "  sections: [{ title, minutes?, bullets?: string[] }] }",
    "Up to 12 sections. minutes is the optional planned duration in whole minutes;",
    "bullets are optional — a pure agenda item is just a title + minutes.",
    CONFIG_BADGE_PROMPT_RULE,
    "Identity and brand (author, avatar, socials, cover, theme, fonts) are fixed and not shown — never add them.",
    `Write every content string (title, subtitle, section titles, bullets, stack labels) in the same language as the Brief; if the brief is empty or its language is unclear, use ${fallbackLanguage}.`,
    "",
    taskLine,
    `Brief: ${trimmedBrief}`,
    "",
    "Current content (edit this, keep version: 1):",
    config,
  ].join("\n");
}

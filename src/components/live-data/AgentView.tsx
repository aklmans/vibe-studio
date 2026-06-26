import { useMemo, useState, type CSSProperties } from "react";
import type { OverlayState } from "../../types";
import type { TranslationKey } from "../../lib/i18n";
import { useLocale } from "../../hooks/useLocale";
import { UI_BORDERS, UI_COLORS, cssAlpha } from "../../lib/design-tokens";
import { buildAgentPrompt } from "../../lib/agent-prompt";
import {
  WorkbenchButton,
  applyWorkbenchFocus,
  clearWorkbenchFocus,
  monoInputStyle,
} from "../shared/Field";

interface AgentViewProps {
  state: OverlayState;
  /** Open the global drift-safe JSON drawer (single import / apply path). */
  onOpenJson: () => void;
}

interface AgentTask {
  id: string;
  labelKey: TranslationKey;
  line: string;
}

// Task chips: label localized, the handoff line stays English for AI tools.
const TASKS: AgentTask[] = [
  { id: "generate", labelKey: "agentTask.generate", line: "Task: generate the full config for this stream." },
  { id: "sections", labelKey: "agentTask.sections", line: "Task: update only the sections (titles + bullets); keep everything else." },
  { id: "titleCover", labelKey: "agentTask.titleCover", line: "Task: update the title, subtitle, author and cover copy; keep everything else." },
  { id: "assets", labelKey: "agentTask.assets", line: "Task: update the stack, badges and socials; keep everything else." },
  { id: "check", labelKey: "agentTask.check", line: "Task: review the current config for issues and return a corrected version." },
];

// Context chips — what the agent receives + the guarantees (informational).
const CONTEXT: { id: string; labelKey: TranslationKey }[] = [
  { id: "config", labelKey: "agentContext.config" },
  { id: "core", labelKey: "agentContext.core" },
  { id: "noRuntime", labelKey: "agentContext.noRuntime" },
  { id: "obs", labelKey: "agentContext.obs" },
];

const eyebrow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: UI_COLORS.text,
  fontFamily: "var(--app-font-mono)",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const hint: CSSProperties = {
  fontSize: 11,
  color: UI_COLORS.textMuted,
  lineHeight: 1.5,
  maxWidth: 640,
};

const subLabel: CSSProperties = {
  fontFamily: "var(--app-font-mono)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: UI_COLORS.textMuted,
};

/**
 * Agent mode — a prepare panel inside the same editorial workbench, not a chat
 * product. The user states what to prepare, picks a task + sees the attached
 * context, then copies a handoff for their own AI tool. The handoff preview is
 * collapsed by default. Import / Apply always route to the drift-safe JSON
 * drawer — no second apply path, no live LLM, no network.
 */
export default function AgentView({ state, onOpenJson }: AgentViewProps) {
  const { t } = useLocale();
  const [brief, setBrief] = useState("");
  const [taskId, setTaskId] = useState("generate");
  const [showHandoff, setShowHandoff] = useState(false);
  const [message, setMessage] = useState("");

  const task = TASKS.find((item) => item.id === taskId) ?? TASKS[0];
  const handoff = useMemo(
    () => buildAgentPrompt(state, brief, task.line),
    [state, brief, task.line],
  );

  const copyHandoff = () => {
    if (!navigator.clipboard) {
      setMessage(t("agent.copyFailed"));
      return;
    }
    void navigator.clipboard
      .writeText(handoff)
      .then(() => setMessage(t("agent.copied")))
      .catch(() => setMessage(t("agent.copyFailed")));
  };

  return (
    <div
      data-testid="agent-view"
      style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={eyebrow}>
          <Mark />
          {t("agent.title")}
        </div>
        <div style={hint}>{t("agent.intro")}</div>
      </header>

      {/* Prepare panel — a single ruled conversation/task region. */}
      <section
        data-testid="agent-panel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          border: `1px solid ${UI_COLORS.border}`,
          borderRadius: 4,
          background: UI_COLORS.appSurface,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={subLabel}>{t("agent.youLabel")}</span>
          <textarea
            data-testid="agent-brief-input"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder={t("agent.briefPlaceholder")}
            spellCheck={false}
            style={{
              ...monoInputStyle,
              width: "100%",
              minHeight: 96,
              resize: "vertical",
              border: UI_BORDERS.control,
              borderRadius: 4,
              background: UI_COLORS.inputInset,
              padding: "10px 12px",
              lineHeight: 1.55,
              fontSize: 13,
            }}
            onFocus={(e) => applyWorkbenchFocus(e.currentTarget)}
            onBlur={(e) => clearWorkbenchFocus(e.currentTarget)}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={subLabel}>{t("agent.tasksLabel")}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TASKS.map((item) => {
              const active = item.id === taskId;
              return (
                <button
                  key={item.id}
                  data-testid={`agent-task-${item.id}`}
                  aria-pressed={active}
                  onClick={() => setTaskId(item.id)}
                  style={{
                    appearance: "none",
                    cursor: "pointer",
                    borderRadius: 4,
                    border: `1px solid ${active ? cssAlpha(UI_COLORS.accent, 44) : UI_COLORS.controlBorder}`,
                    background: active ? cssAlpha(UI_COLORS.accent, 12) : "transparent",
                    color: active ? UI_COLORS.text : UI_COLORS.textMuted,
                    fontFamily: "var(--app-font-mono)",
                    fontSize: 11,
                    fontWeight: active ? 700 : 500,
                    letterSpacing: "0.02em",
                    padding: "5px 10px",
                    transition: "color 0.12s, border-color 0.12s, background 0.12s",
                  }}
                >
                  {t(item.labelKey)}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={subLabel}>{t("agent.contextLabel")}</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CONTEXT.map((item) => (
              <span
                key={item.id}
                data-testid={`agent-context-${item.id}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 3,
                  border: `1px solid ${UI_COLORS.controlBorder}`,
                  background: UI_COLORS.inputInset,
                  color: UI_COLORS.textMuted,
                  fontFamily: "var(--app-font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.02em",
                  padding: "3px 8px",
                }}
              >
                <span
                  aria-hidden
                  style={{ width: 4, height: 4, borderRadius: "50%", background: cssAlpha(UI_COLORS.accent, 70) }}
                />
                {t(item.labelKey)}
              </span>
            ))}
          </div>
        </div>

        {/* Actions — copy the handoff; Import / Apply go to the JSON drawer. */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <WorkbenchButton
            data-testid="agent-copy-handoff"
            onClick={copyHandoff}
            tone="accent"
            accentColor={UI_COLORS.accent}
            style={{ minWidth: 130, height: 32, padding: "0 12px" }}
          >
            {t("agent.copyHandoff")}
          </WorkbenchButton>
          <WorkbenchButton
            data-testid="open-json-agent"
            onClick={onOpenJson}
            style={{ height: 32, padding: "0 12px" }}
          >
            {t("drawer.openJson")}
          </WorkbenchButton>
          <WorkbenchButton
            data-testid="agent-import-result"
            onClick={onOpenJson}
            style={{ height: 32, padding: "0 12px" }}
          >
            {t("agent.openJsonToImport")}
          </WorkbenchButton>
          <WorkbenchButton
            data-testid="agent-apply-config"
            onClick={onOpenJson}
            style={{ height: 32, padding: "0 12px" }}
          >
            {t("agent.reviewInJson")}
          </WorkbenchButton>
          {message && (
            <span style={{ fontSize: 11, color: UI_COLORS.accentText, lineHeight: 1.4 }}>
              {message}
            </span>
          )}
        </div>

        {/* Handoff preview — collapsed by default, not the visual centre. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            data-testid="agent-handoff-toggle"
            aria-expanded={showHandoff}
            onClick={() => setShowHandoff((v) => !v)}
            style={{
              appearance: "none",
              border: "none",
              background: "transparent",
              color: UI_COLORS.textMuted,
              cursor: "pointer",
              fontFamily: "var(--app-font-mono)",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: 0,
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              alignSelf: "flex-start",
            }}
          >
            <span aria-hidden style={{ transform: showHandoff ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
              ▸
            </span>
            {t("agent.handoffPreview")}
          </button>
          {showHandoff && (
            <pre
              data-testid="agent-handoff-preview"
              style={{
                margin: 0,
                maxHeight: 200,
                overflow: "auto",
                fontFamily: "var(--app-font-mono)",
                fontSize: 11,
                lineHeight: 1.5,
                color: UI_COLORS.textSoft,
                background: UI_COLORS.inputInset,
                border: UI_BORDERS.control,
                borderRadius: 4,
                padding: "10px 12px",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
              }}
            >
              {handoff}
            </pre>
          )}
        </div>
      </section>

      <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.6 }}>
        <li>{t("agent.step1")}</li>
        <li>{t("agent.step2")}</li>
        <li>{t("agent.step3")}</li>
      </ol>
    </div>
  );
}

function Mark({ muted = false }: { muted?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 3,
        height: 13,
        borderRadius: 2,
        background: muted ? cssAlpha(UI_COLORS.accent, 52) : UI_COLORS.accent,
      }}
    />
  );
}

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

interface AgentPrepareViewProps {
  state: OverlayState;
  /** Open the global JSON drawer to import / review / apply the agent result. */
  onOpenJson: () => void;
}

interface AgentTask {
  id: string;
  labelKey: TranslationKey;
  line: string;
}

// Task chips: label is localized, the prompt line stays English for AI tools.
const TASKS: AgentTask[] = [
  { id: "generate", labelKey: "agentTask.generate", line: "Task: generate the full config for this stream." },
  { id: "sections", labelKey: "agentTask.sections", line: "Task: update only the sections (titles + bullets); keep everything else." },
  { id: "titleCover", labelKey: "agentTask.titleCover", line: "Task: update the title, subtitle, author and cover copy; keep everything else." },
  { id: "assets", labelKey: "agentTask.assets", line: "Task: update the stack, badges and socials; keep everything else." },
  { id: "check", labelKey: "agentTask.check", line: "Task: review the current config for issues and return a corrected version." },
];

const eyebrowStyle: CSSProperties = {
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

const hintStyle: CSSProperties = {
  fontSize: 11,
  color: UI_COLORS.textMuted,
  lineHeight: 1.5,
  maxWidth: 660,
};

/**
 * AI Prepare — the "let an agent prepare my config" mode. A big brief input +
 * task chips compose a copy-paste handoff prompt (current config included); the
 * user runs it in their own AI tool, then opens the JSON drawer to import,
 * review and Apply. No Recipe/Brief, no live LLM, no new dependency.
 */
export default function AgentPrepareView({ state, onOpenJson }: AgentPrepareViewProps) {
  const { t } = useLocale();
  const [brief, setBrief] = useState("");
  const [taskId, setTaskId] = useState("generate");
  const [message, setMessage] = useState("");

  const task = TASKS.find((item) => item.id === taskId) ?? TASKS[0];
  const prompt = useMemo(
    () => buildAgentPrompt(state, brief, task.line),
    [state, brief, task.line],
  );

  const copyPrompt = () => {
    if (!navigator.clipboard) {
      setMessage(t("agentPrepare.copyFailed"));
      return;
    }
    void navigator.clipboard
      .writeText(prompt)
      .then(() => setMessage(t("agentPrepare.copied")))
      .catch(() => setMessage(t("agentPrepare.copyFailed")));
  };

  return (
    <div
      data-testid="agent-prepare"
      style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={eyebrowStyle}>
          <Mark />
          {t("agentPrepare.title")}
        </div>
        <div style={hintStyle}>{t("agentPrepare.intro")}</div>
      </header>

      {/* Big brief input — the centre of the agent mode. */}
      <textarea
        data-testid="agent-brief-input"
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        placeholder={t("agentPrepare.briefPlaceholder")}
        spellCheck={false}
        style={{
          ...monoInputStyle,
          width: "100%",
          minHeight: 132,
          resize: "vertical",
          border: UI_BORDERS.control,
          borderRadius: 4,
          background: UI_COLORS.inputInset,
          padding: "12px 14px",
          lineHeight: 1.55,
          fontSize: 13,
        }}
        onFocus={(e) => applyWorkbenchFocus(e.currentTarget)}
        onBlur={(e) => clearWorkbenchFocus(e.currentTarget)}
      />

      {/* Task chips */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <span style={{ ...subLabel }}>{t("agentPrepare.tasksLabel")}</span>
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

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <WorkbenchButton
          data-testid="agent-copy-prompt"
          onClick={copyPrompt}
          tone="accent"
          accentColor={UI_COLORS.accent}
          style={{ minWidth: 150, height: 32, padding: "0 12px" }}
        >
          {t("agentPrepare.copyPrompt")}
        </WorkbenchButton>
        <WorkbenchButton
          data-testid="open-json-prepare"
          onClick={onOpenJson}
          style={{ minWidth: 110, height: 32, padding: "0 12px" }}
        >
          {t("drawer.openJson")}
        </WorkbenchButton>
        {message && (
          <span style={{ fontSize: 11, color: UI_COLORS.accentText, lineHeight: 1.4 }}>
            {message}
          </span>
        )}
      </div>

      {/* Prompt preview */}
      <section style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 18, borderTop: `1px solid ${UI_COLORS.rule}` }}>
        <div style={eyebrowStyle}>
          <Mark muted />
          {t("agentPrepare.promptTitle")}
        </div>
        <pre
          data-testid="agent-prompt-preview"
          style={{
            margin: 0,
            maxHeight: 220,
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
          {prompt}
        </pre>
      </section>

      {/* Next steps */}
      <section style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 18, borderTop: `1px solid ${UI_COLORS.rule}` }}>
        <div style={eyebrowStyle}>
          <Mark muted />
          {t("agentPrepare.nextTitle")}
        </div>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.6 }}>
          <li>{t("agentPrepare.step1")}</li>
          <li>{t("agentPrepare.step2")}</li>
          <li>{t("agentPrepare.step3")}</li>
        </ol>
      </section>
    </div>
  );
}

const subLabel: CSSProperties = {
  fontFamily: "var(--app-font-mono)",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: UI_COLORS.textMuted,
};

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

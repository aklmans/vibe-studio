import { Fragment, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { OverlayState } from "../../types";
import type { TranslationKey } from "../../lib/i18n";
import { useLocale } from "../../hooks/useLocale";
import { UI_BORDERS, UI_COLORS, cssAlpha } from "../../lib/design-tokens";
import { buildAgentPrompt } from "../../lib/agent-prompt";
import { resolveCopyResult, turnMessageKey, type CopyStatus } from "./agent-copy";
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
  descKey: TranslationKey;
  line: string;
}

// Quick-intent chips: label + intent localized; the handoff line stays English for AI tools.
const TASKS: AgentTask[] = [
  { id: "generate", labelKey: "agentTask.generate", descKey: "agentTask.generateDesc", line: "Task: generate the full config for this stream." },
  { id: "sections", labelKey: "agentTask.sections", descKey: "agentTask.sectionsDesc", line: "Task: update only the sections (titles + bullets); keep everything else." },
  { id: "titleCover", labelKey: "agentTask.titleCover", descKey: "agentTask.titleCoverDesc", line: "Task: update the title, subtitle, author and cover copy; keep everything else." },
  { id: "assets", labelKey: "agentTask.assets", descKey: "agentTask.assetsDesc", line: "Task: update the stack, badges and socials; keep everything else." },
  { id: "check", labelKey: "agentTask.check", descKey: "agentTask.checkDesc", line: "Task: review the current config for issues and return a corrected version." },
];

// Context chips — what the handoff carries + the guarantees (informational).
const CONTEXT: { id: string; labelKey: TranslationKey }[] = [
  { id: "config", labelKey: "agentContext.config" },
  { id: "core", labelKey: "agentContext.core" },
  { id: "noRuntime", labelKey: "agentContext.noRuntime" },
  { id: "obs", labelKey: "agentContext.obs" },
];

interface Turn {
  id: number;
  brief: string;
  taskLabel: string;
  handoff: string;
  status: CopyStatus;
}

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
 * Agent mode — a light, local prep conversation inside the same editorial
 * workbench. The user describes the stream and picks an intent; "Copy handoff"
 * assembles a prompt from the current config, copies it, and logs the turn to a
 * local transcript with the next step. No model is connected, nothing is sent,
 * and the only way a returned config re-enters the app is the drift-safe JSON
 * drawer (Open JSON → Import → review → Apply). No second apply path.
 */
export default function AgentView({ state, onOpenJson }: AgentViewProps) {
  const { t } = useLocale();
  const [brief, setBrief] = useState("");
  const [taskId, setTaskId] = useState("generate");
  const [showHandoff, setShowHandoff] = useState(false);
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const nextTurnId = useRef(1);

  const task = TASKS.find((item) => item.id === taskId) ?? TASKS[0];
  const handoff = useMemo(
    () => buildAgentPrompt(state, brief, task.line),
    [state, brief, task.line],
  );

  // Record the turn only after we know the clipboard outcome, so a turn never
  // claims "copied" when the copy was blocked or rejected. A failed copy still
  // logs a manual-copy turn (with the handoff snapshot to copy by hand).
  const recordTurn = (copied: boolean) => {
    const { messageKey, turnStatus } = resolveCopyResult(copied);
    setMessage(t(messageKey));
    setTurns((prev) => [
      ...prev,
      {
        id: nextTurnId.current++,
        brief: brief.trim(),
        taskLabel: t(task.labelKey),
        handoff,
        status: turnStatus,
      },
    ]);
  };

  const copyHandoff = () => {
    if (!navigator.clipboard) {
      recordTurn(false);
      return;
    }
    void navigator.clipboard
      .writeText(handoff)
      .then(() => recordTurn(true))
      .catch(() => recordTurn(false));
  };

  return (
    <div
      data-testid="agent-view"
      style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 720 }}
    >
      <header style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={eyebrow}>
            <Mark />
            {t("agent.title")}
          </div>
          <span
            data-testid="agent-local-badge"
            style={{
              fontFamily: "var(--app-font-mono)",
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: UI_COLORS.textMuted,
              border: `1px solid ${UI_COLORS.controlBorder}`,
              borderRadius: 3,
              padding: "2px 7px",
            }}
          >
            {t("agent.localBadge")}
          </span>
        </div>
        <div style={hint}>{t("agent.intro")}</div>
      </header>

      {/* Transcript — a local prep conversation. Always opens with a seed
          guidance turn; each Copy handoff appends a user + assistant pair. */}
      <div data-testid="agent-transcript" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Bubble role="assistant" testId="agent-msg-seed">
          {t("agent.seedMessage")}
        </Bubble>
        {turns.map((turn) => (
          <Fragment key={turn.id}>
            <Bubble role="user" testId={`agent-turn-user-${turn.id}`}>
              <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span>{turn.brief || t("agent.noBrief")}</span>
                <span style={{ ...subLabel, fontSize: 9 }}>{turn.taskLabel}</span>
              </span>
            </Bubble>
            <Bubble role="assistant" testId={`agent-turn-assistant-${turn.id}`}>
              <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span data-testid={`agent-turn-status-${turn.id}`}>{t(turnMessageKey(turn.status))}</span>
                <TurnHandoff id={turn.id} handoff={turn.handoff} toggleLabel={t("agent.handoffPreview")} />
              </span>
            </Bubble>
          </Fragment>
        ))}
      </div>

      {/* Composer — quick-intent chips + a brief, then Copy handoff. Reads like a
          chat input, not a stack of form fields. */}
      <section
        data-testid="agent-panel"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          border: `1px solid ${UI_COLORS.border}`,
          borderRadius: 4,
          background: UI_COLORS.appSurface,
          padding: 16,
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
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
                  borderRadius: 999,
                  border: `1px solid ${active ? cssAlpha(UI_COLORS.accent, 44) : UI_COLORS.controlBorder}`,
                  background: active ? cssAlpha(UI_COLORS.accent, 12) : "transparent",
                  color: active ? UI_COLORS.text : UI_COLORS.textMuted,
                  fontFamily: "var(--app-font-mono)",
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  letterSpacing: "0.02em",
                  padding: "4px 11px",
                  transition: "color 0.12s, border-color 0.12s, background 0.12s",
                }}
              >
                {t(item.labelKey)}
              </button>
            );
          })}
        </div>
        <div
          data-testid="agent-task-intent"
          style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.45 }}
        >
          {t(task.descKey)}
        </div>

        <textarea
          data-testid="agent-brief-input"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder={t("agent.briefPlaceholder")}
          spellCheck={false}
          style={{
            ...monoInputStyle,
            width: "100%",
            minHeight: 84,
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

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ ...subLabel, fontSize: 9 }}>{t("agent.contextLabel")}</span>
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

        {/* Actions — two distinct verbs only: copy the handoff (which logs the
            turn), and open the single drift-safe JSON drawer. The import →
            review → Apply round-trip is guidance text, not extra buttons. */}
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
          <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>
            {message || t("agent.openJsonHint")}
          </span>
        </div>

        {/* Draft handoff preview — collapsed by default; what the next Copy sends. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <button
            data-testid="agent-handoff-toggle"
            aria-expanded={showHandoff}
            onClick={() => setShowHandoff((v) => !v)}
            style={toggleStyle}
          >
            <span aria-hidden style={{ transform: showHandoff ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
              ▸
            </span>
            {t("agent.draftPreview")}
          </button>
          {showHandoff && (
            <pre data-testid="agent-handoff-preview" style={preStyle}>
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

const toggleStyle: CSSProperties = {
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
};

const preStyle: CSSProperties = {
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
};

/** A per-turn collapsible snapshot of the handoff that was copied. */
function TurnHandoff({ id, handoff, toggleLabel }: { id: number; handoff: string; toggleLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button
        data-testid={`agent-turn-handoff-toggle-${id}`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        style={toggleStyle}
      >
        <span aria-hidden style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
          ▸
        </span>
        {toggleLabel}
      </button>
      {open && (
        <pre data-testid={`agent-turn-handoff-${id}`} style={preStyle}>
          {handoff}
        </pre>
      )}
    </div>
  );
}

/** A chat bubble — a left-ruled aside for the assistant, a quiet card for the user. */
function Bubble({
  role,
  testId,
  children,
}: {
  role: "assistant" | "user";
  testId: string;
  children: ReactNode;
}) {
  const isUser = role === "user";
  return (
    <div
      data-testid={testId}
      data-role={role}
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "88%",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontSize: 12,
        lineHeight: 1.5,
        color: isUser ? UI_COLORS.text : UI_COLORS.textSoft,
        background: isUser ? UI_COLORS.inputInset : "transparent",
        border: isUser ? `1px solid ${UI_COLORS.controlBorder}` : "none",
        borderLeft: isUser ? `1px solid ${UI_COLORS.controlBorder}` : `2px solid ${cssAlpha(UI_COLORS.accent, 52)}`,
        borderRadius: isUser ? 6 : 0,
        padding: isUser ? "8px 12px" : "2px 0 2px 12px",
      }}
    >
      {children}
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

import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { OverlayState } from "../../types";
import type { TranslationKey } from "../../lib/i18n";
import { useLocale } from "../../hooks/useLocale";
import { UI_BORDERS, UI_COLORS, cssAlpha } from "../../lib/design-tokens";
import { buildAgentPrompt } from "../../lib/agent-prompt";
import { projectConfigText } from "../../lib/session-config-drift";
import type { SessionAgentStatus } from "../../lib/session-agent";
import { fetchAgentStatus, runSessionAgent } from "../../lib/session-agent-client";
import { resolveCopyResult, shortConfigHash, turnMessageKey, type CopyStatus } from "./agent-copy";
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
  /** Open the JSON drawer with text seeded into the editing buffer (review path). */
  onReviewJson?: (text: string) => void;
  /** Seed the connection status (tests); the mount effect refreshes it from the route. */
  initialStatus?: SessionAgentStatus;
}

interface AgentTask {
  id: string;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  line: string;
}

// Quick-intent chips: label + intent localized; the task line stays English.
const TASKS: AgentTask[] = [
  { id: "generate", labelKey: "agentTask.generate", descKey: "agentTask.generateDesc", line: "Task: generate the full config for this stream." },
  { id: "sections", labelKey: "agentTask.sections", descKey: "agentTask.sectionsDesc", line: "Task: update only the sections (titles + bullets); keep everything else." },
  { id: "titleCover", labelKey: "agentTask.titleCover", descKey: "agentTask.titleCoverDesc", line: "Task: update the title, subtitle, author and cover copy; keep everything else." },
  { id: "assets", labelKey: "agentTask.assets", descKey: "agentTask.assetsDesc", line: "Task: update the stack, badges and socials; keep everything else." },
  { id: "check", labelKey: "agentTask.check", descKey: "agentTask.checkDesc", line: "Task: review the current config for issues and return a corrected version." },
];

const CONTEXT: { id: string; labelKey: TranslationKey }[] = [
  { id: "config", labelKey: "agentContext.config" },
  { id: "core", labelKey: "agentContext.core" },
  { id: "noRuntime", labelKey: "agentContext.noRuntime" },
  { id: "obs", labelKey: "agentContext.obs" },
];

interface TurnBase {
  id: number;
  brief: string;
  taskLabel: string;
  snapshot: string;
}
type LocalTurn = TurnBase & { kind: "local"; status: CopyStatus; handoff: string };
type AiTurn = TurnBase & {
  kind: "ai";
  status: "running" | "success" | "error";
  message: string;
  configText: string | null;
  provider?: string;
  model?: string;
};
type Turn = LocalTurn | AiTurn;

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
 * Agent mode — a local prep conversation that can optionally call a real AI.
 *
 * When a provider is configured (server-side env), "Run with AI" sends the
 * brief + task + the current v1 config projection to `/api/session-config/agent`
 * and shows the reply as a transcript turn; if the reply contains JSON, a
 * "Review in JSON" action seeds the drift-safe JSON drawer buffer — it is never
 * auto-imported or auto-applied. When no provider is configured, the badge reads
 * "Local prep · no model connected" and only the local handoff (Copy handoff)
 * is offered. The API key lives only on the server route; the client only knows
 * the provider / model name.
 */
export default function AgentView({ state, onOpenJson, onReviewJson, initialStatus }: AgentViewProps) {
  const { t, locale } = useLocale();
  const [brief, setBrief] = useState("");
  const [taskId, setTaskId] = useState("generate");
  const [showHandoff, setShowHandoff] = useState(false);
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState<SessionAgentStatus>(initialStatus ?? { configured: false });
  const [running, setRunning] = useState(false);
  const nextTurnId = useRef(1);

  const task = TASKS.find((item) => item.id === taskId) ?? TASKS[0];
  const handoff = useMemo(
    () => buildAgentPrompt(state, brief, task.line),
    [state, brief, task.line],
  );

  // Connection status (key-free). Effects don't run during SSR/tests, so the
  // default stays "not configured" → the local badge + handoff path.
  useEffect(() => {
    let active = true;
    void fetchAgentStatus().then((next) => {
      if (active) setStatus(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const patchTurn = (id: number, patch: Partial<AiTurn>) => {
    setTurns((prev) =>
      prev.map((turn) => (turn.id === id && turn.kind === "ai" ? { ...turn, ...patch } : turn)),
    );
  };

  // Local handoff: record the turn only after the clipboard outcome is known, so
  // a turn never claims "copied" when the copy was blocked or rejected.
  const recordLocalTurn = (copied: boolean) => {
    const { messageKey, turnStatus } = resolveCopyResult(copied);
    setMessage(t(messageKey));
    setTurns((prev) => [
      ...prev,
      {
        kind: "local",
        id: nextTurnId.current++,
        brief: brief.trim(),
        taskLabel: t(task.labelKey),
        snapshot: shortConfigHash(handoff),
        handoff,
        status: turnStatus,
      },
    ]);
  };

  const copyHandoff = () => {
    if (!navigator.clipboard) {
      recordLocalTurn(false);
      return;
    }
    void navigator.clipboard
      .writeText(handoff)
      .then(() => recordLocalTurn(true))
      .catch(() => recordLocalTurn(false));
  };

  const runWithAi = () => {
    if (running) return;
    // Always send the latest projection — never a stale snapshot.
    const configText = projectConfigText(state);
    const id = nextTurnId.current++;
    const aiTurn: AiTurn = {
      kind: "ai",
      id,
      brief: brief.trim(),
      taskLabel: t(task.labelKey),
      snapshot: shortConfigHash(configText),
      status: "running",
      message: "",
      configText: null,
      provider: status.provider,
      model: status.model,
    };
    setTurns((prev) => [...prev, aiTurn]);
    setRunning(true);
    setMessage("");
    void runSessionAgent({ brief: brief.trim(), task: task.line, configText, locale })
      .then((result) => {
        if (result.mode === "ai") {
          patchTurn(id, {
            status: "success",
            message: result.message ?? "",
            configText: result.configText ?? null,
            provider: result.provider,
            model: result.model,
          });
        } else if (result.mode === "local") {
          // Provider stopped being configured mid-session — fall back honestly.
          patchTurn(id, { status: "error", message: t("agent.aiNotConfigured") });
        } else {
          patchTurn(id, { status: "error", message: result.error ?? t("agent.aiError") });
        }
      })
      .finally(() => setRunning(false));
  };

  const copyText = (text: string) => {
    if (navigator.clipboard) void navigator.clipboard.writeText(text).catch(() => {});
  };

  const connected = status.configured;

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
          {connected ? (
            <span data-testid="agent-connected-badge" style={badgeStyle(UI_COLORS.accentText, cssAlpha(UI_COLORS.accent, 40))}>
              {`${t("agent.connected")}: ${status.provider ?? ""}${status.model ? ` · ${status.model}` : ""}`}
            </span>
          ) : (
            <span data-testid="agent-local-badge" style={badgeStyle(UI_COLORS.textMuted, UI_COLORS.controlBorder)}>
              {t("agent.localBadge")}
            </span>
          )}
        </div>
        <div style={hint}>{t("agent.intro")}</div>
      </header>

      {/* Transcript — local + AI turns. Always opens with a seed guidance turn. */}
      <div data-testid="agent-transcript" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Bubble role="assistant" testId="agent-msg-seed">
          {connected ? t("agent.seedConnected") : t("agent.seedMessage")}
        </Bubble>
        {turns.map((turn) => (
          <Fragment key={turn.id}>
            <Bubble role="user" testId={`agent-turn-user-${turn.id}`}>
              <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span>{turn.brief || t("agent.noBrief")}</span>
                <span style={{ ...subLabel, fontSize: 9 }}>
                  {turn.taskLabel} · {t("agent.snapshot")} {turn.snapshot}
                </span>
              </span>
            </Bubble>
            <Bubble role="assistant" testId={`agent-turn-assistant-${turn.id}`}>
              {turn.kind === "local" ? (
                <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span data-testid={`agent-turn-status-${turn.id}`}>{t(turnMessageKey(turn.status))}</span>
                  <TurnPreview id={turn.id} text={turn.handoff} toggleLabel={t("agent.handoffPreview")} />
                </span>
              ) : (
                <AiTurnBody turn={turn} onReviewJson={onReviewJson} onCopy={copyText} />
              )}
            </Bubble>
          </Fragment>
        ))}
      </div>

      {/* Composer — quick-intent chips + a brief, then Run with AI / Copy handoff. */}
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
              <span aria-hidden style={{ width: 4, height: 4, borderRadius: "50%", background: cssAlpha(UI_COLORS.accent, 70) }} />
              {t(item.labelKey)}
            </span>
          ))}
        </div>

        {/* Actions — Run with AI (when a provider is configured) is the primary
            path; Copy handoff is always available as the local fallback. The AI
            reply is reviewed in the JSON drawer; it is never auto-applied. */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {connected && (
            <WorkbenchButton
              data-testid="agent-run-ai"
              onClick={runWithAi}
              disabled={running}
              tone="accent"
              accentColor={UI_COLORS.accent}
              style={{ minWidth: 130, height: 32, padding: "0 12px" }}
            >
              {running ? t("agent.running") : t("agent.runAi")}
            </WorkbenchButton>
          )}
          <WorkbenchButton
            data-testid="agent-copy-handoff"
            onClick={copyHandoff}
            tone={connected ? "neutral" : "accent"}
            accentColor={connected ? UI_COLORS.textSoft : UI_COLORS.accent}
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

function badgeStyle(color: string, borderColor: string): CSSProperties {
  return {
    fontFamily: "var(--app-font-mono)",
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color,
    border: `1px solid ${borderColor}`,
    borderRadius: 3,
    padding: "2px 7px",
  };
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

/** The assistant body for an AI turn: status, reply text, and review actions. */
function AiTurnBody({
  turn,
  onReviewJson,
  onCopy,
}: {
  turn: AiTurn;
  onReviewJson?: (text: string) => void;
  onCopy: (text: string) => void;
}) {
  const { t } = useLocale();
  const statusText =
    turn.status === "running"
      ? `${t("agent.asking")} ${turn.provider ?? t("agent.title")}…`
      : turn.status === "error"
        ? t("agent.aiError")
        : turn.configText
          ? t("agent.aiSuccessJson")
          : t("agent.aiSuccessText");

  return (
    <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span data-testid={`agent-turn-status-${turn.id}`} style={{ color: turn.status === "error" ? UI_COLORS.danger : undefined }}>
        {statusText}
      </span>
      {turn.status !== "running" && turn.message && (
        <pre data-testid={`agent-turn-message-${turn.id}`} style={preStyle}>
          {turn.message}
        </pre>
      )}
      {turn.status !== "running" && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {turn.configText && onReviewJson && (
            <WorkbenchButton
              data-testid={`agent-turn-review-${turn.id}`}
              onClick={() => onReviewJson(turn.configText as string)}
              tone="accent"
              accentColor={UI_COLORS.accent}
              style={{ height: 28, padding: "0 10px" }}
            >
              {t("agent.reviewInJson")}
            </WorkbenchButton>
          )}
          {turn.message && (
            <WorkbenchButton
              data-testid={`agent-turn-copy-${turn.id}`}
              onClick={() => onCopy(turn.message)}
              style={{ height: 28, padding: "0 10px" }}
            >
              {t("agent.copyReply")}
            </WorkbenchButton>
          )}
        </div>
      )}
    </span>
  );
}

/** A per-turn collapsible snapshot of the handoff that was copied. */
function TurnPreview({ id, text, toggleLabel }: { id: number; text: string; toggleLabel: string }) {
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
          {text}
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

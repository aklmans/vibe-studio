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
  /** Navigate to a Settings group (e.g. AI Provider). Settings are never edited via chat. */
  onOpenSettings?: (group?: string) => void;
  /** Seed the connection status (tests); the mount effect refreshes it from the route. */
  initialStatus?: SessionAgentStatus;
}

interface AgentTask {
  id: string;
  labelKey: TranslationKey;
  descKey: TranslationKey;
  line: string;
}

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

/**
 * Slash commands — a lightweight, natural-language command surface in the
 * composer. Task commands set the active intent; nav commands jump to the JSON
 * drawer or a Settings group (the Agent never edits settings itself).
 */
const SLASH_COMMANDS: { cmd: string; task?: string; group?: string; json?: boolean }[] = [
  { cmd: "generate", task: "generate" },
  { cmd: "sections", task: "sections" },
  { cmd: "cover", task: "titleCover" },
  { cmd: "socials", task: "assets" },
  { cmd: "check", task: "check" },
  { cmd: "json", json: true },
  { cmd: "display", group: "display" },
  { cmd: "provider", group: "provider" },
  { cmd: "settings", group: "session" },
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

const mono = "var(--app-font-mono)";

const subLabel: CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: UI_COLORS.textMuted,
};

/**
 * Agent mode — a full chat window. The user converses; "Run with AI" (when a
 * provider is configured server-side) sends the brief + task + current v1
 * projection to `/api/session-config/agent` and shows the reply as a turn. A
 * returned config renders as a JSON card whose "Review in JSON" seeds the
 * drift-safe drawer buffer — never auto-imported, never auto-applied. With no
 * provider, the pill reads "local · no model" and Copy handoff is the path. The
 * API key stays on the server; the client only knows provider / model names.
 */
export default function AgentView({ state, onOpenJson, onReviewJson, onOpenSettings, initialStatus }: AgentViewProps) {
  const { t, locale } = useLocale();
  const [brief, setBrief] = useState("");
  const [taskId, setTaskId] = useState("generate");
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [status, setStatus] = useState<SessionAgentStatus>(initialStatus ?? { configured: false });
  const [running, setRunning] = useState(false);
  const [intentsOpen, setIntentsOpen] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const nextTurnId = useRef(1);

  const task = TASKS.find((item) => item.id === taskId) ?? TASKS[0];
  const handoff = useMemo(() => buildAgentPrompt(state, brief, task.line), [state, brief, task.line]);
  const connected = status.configured;
  const showChips = turns.length === 0 || intentsOpen;
  const [slashActive, setSlashActive] = useState(0);
  const [slashDismissed, setSlashDismissed] = useState(false);

  // Slash commands: a leading "/" with no space yet opens a filtered menu with a
  // full keyboard contract (↑/↓ move, Enter run, Esc dismiss without clearing).
  const slashQuery = brief.startsWith("/") && !brief.includes(" ") ? brief.slice(1).toLowerCase() : null;
  const slashMatches = slashQuery !== null ? SLASH_COMMANDS.filter((s) => s.cmd.startsWith(slashQuery)) : [];
  const slashOpen = slashMatches.length > 0 && !slashDismissed;
  const slashIndex = Math.min(slashActive, Math.max(slashMatches.length - 1, 0));

  const runSlash = (s: (typeof SLASH_COMMANDS)[number]) => {
    setBrief("");
    setSlashDismissed(false);
    setSlashActive(0);
    if (s.task) setTaskId(s.task);
    else if (s.json) onOpenJson();
    else onOpenSettings?.(s.group);
  };

  // The slash keyboard owns ↑/↓/Enter/Esc while open. A document capture
  // listener — registered before the dialog's (child effects run first) — lets
  // Esc dismiss the menu without closing the dialog. The mount-only listener
  // reads live state through a ref so it never goes stale.
  const slashRef = useRef({ open: slashOpen, matches: slashMatches, index: slashIndex, run: runSlash });
  slashRef.current = { open: slashOpen, matches: slashMatches, index: slashIndex, run: runSlash };
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const st = slashRef.current;
      if (!st.open || st.matches.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSlashActive((i) => (i + 1) % st.matches.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSlashActive((i) => (i - 1 + st.matches.length) % st.matches.length);
      } else if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        st.run(st.matches[st.index]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setSlashDismissed(true);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

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
    void navigator.clipboard.writeText(handoff).then(() => recordLocalTurn(true)).catch(() => recordLocalTurn(false));
  };

  const runWithAi = () => {
    if (running) return;
    const configText = projectConfigText(state);
    const id = nextTurnId.current++;
    setTurns((prev) => [
      ...prev,
      {
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
      },
    ]);
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

  return (
    <div
      data-testid="agent-view"
      style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, width: "100%" }}
    >
      {/* Header — connection + new chat + open JSON. */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexWrap: "wrap",
          padding: "14px 28px",
          borderBottom: `1px solid ${UI_COLORS.border}`,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ ...subLabel, color: UI_COLORS.text }}>{t("agent.title")}</span>
          {connected ? (
            <span data-testid="agent-connected-badge" style={pillStyle(UI_COLORS.accentText, cssAlpha(UI_COLORS.accent, 12))}>
              <Dot color={UI_COLORS.accent} />
              {`${t("agent.connected")} · ${status.provider ?? ""}${status.model ? ` · ${status.model}` : ""}`}
            </span>
          ) : (
            <span data-testid="agent-local-badge" style={pillStyle(UI_COLORS.textMuted, UI_COLORS.inputInset)}>
              <Dot color={UI_COLORS.textSubtle} />
              {t("agent.localBadge")}
            </span>
          )}
          {!connected && onOpenSettings && (
            <GhostButton testId="agent-setup-provider" onClick={() => onOpenSettings("provider")}>
              {t("agent.setupProvider")}
            </GhostButton>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {turns.length > 0 && (
            <GhostButton testId="agent-new-chat" onClick={() => { setTurns([]); setMessage(""); }}>
              {t("agent.newChat")}
            </GhostButton>
          )}
          <GhostButton testId="open-json-agent" onClick={onOpenJson}>
            {t("drawer.openJson")} ↗
          </GhostButton>
        </div>
      </header>

      {/* Thread — the conversation; scrolls, composer stays pinned. The empty
          state centers so the dialog doesn't leave a large blank gap. */}
      <div
        data-testid="agent-transcript"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: "20px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          justifyContent: turns.length === 0 ? "center" : "flex-start",
        }}
      >
        <div style={{ maxWidth: 760, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          <AssistantRow testId="agent-msg-seed">
            <span style={{ color: UI_COLORS.textSoft, lineHeight: 1.6 }}>
              {connected ? t("agent.seedConnected") : t("agent.seedMessage")}
            </span>
          </AssistantRow>

          {turns.map((turn) => (
            <Fragment key={turn.id}>
              <UserBubble testId={`agent-turn-user-${turn.id}`}>
                <span>{turn.brief || t("agent.noBrief")}</span>
                <span style={{ ...subLabel, fontSize: 9, marginTop: 4 }}>
                  {turn.taskLabel} · {t("agent.snapshot")} {turn.snapshot}
                </span>
              </UserBubble>
              <AssistantRow testId={`agent-turn-assistant-${turn.id}`}>
                {turn.kind === "local" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <span data-testid={`agent-turn-status-${turn.id}`}>{t(turnMessageKey(turn.status))}</span>
                    <Collapsible id={turn.id} text={turn.handoff} toggleLabel={t("agent.handoffPreview")} />
                  </div>
                ) : (
                  <AiTurnBody turn={turn} onReviewJson={onReviewJson} onCopy={copyText} />
                )}
              </AssistantRow>
            </Fragment>
          ))}
        </div>
      </div>

      {/* Composer — pinned. Suggestion chips collapse after the first turn. */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${UI_COLORS.border}`, padding: "12px 28px 16px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          {showChips ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
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
                        fontFamily: mono,
                        fontSize: 11,
                        fontWeight: active ? 700 : 500,
                        padding: "4px 11px",
                        transition: "color 0.12s, border-color 0.12s, background 0.12s",
                      }}
                    >
                      {t(item.labelKey)}
                    </button>
                  );
                })}
              </div>
              <div data-testid="agent-task-intent" style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>
                {t(task.descKey)}
              </div>
            </div>
          ) : (
            <button data-testid="agent-intents-toggle" onClick={() => setIntentsOpen(true)} style={toggleStyle}>
              <span aria-hidden>▸</span>
              {t("agent.intents")}
            </button>
          )}

          {slashOpen && (
            <ul
              id="agent-slash-menu"
              data-testid="agent-slash-menu"
              role="listbox"
              aria-label={t("agent.slashHint")}
              style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", border: UI_BORDERS.control, borderRadius: 8, background: UI_COLORS.appSurface, overflow: "hidden" }}
            >
              {slashMatches.map((s, i) => {
                const active = i === slashIndex;
                return (
                  <li key={s.cmd} role="option" aria-selected={active} id={`agent-slash-opt-${i}`}>
                    <button
                      data-testid={`agent-slash-${s.cmd}`}
                      tabIndex={-1}
                      onClick={() => runSlash(s)}
                      onMouseEnter={() => setSlashActive(i)}
                      style={{
                        appearance: "none",
                        textAlign: "left",
                        width: "100%",
                        border: "none",
                        borderLeft: `2px solid ${active ? UI_COLORS.accent : "transparent"}`,
                        background: active ? cssAlpha(UI_COLORS.accent, 12) : "transparent",
                        color: UI_COLORS.accentText,
                        cursor: "pointer",
                        fontFamily: mono,
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "7px 12px",
                        transition: "background 0.1s, border-color 0.1s",
                      }}
                    >
                      /{s.cmd}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 8,
              border: UI_BORDERS.control,
              borderRadius: 10,
              background: UI_COLORS.inputInset,
              padding: "8px 8px 8px 12px",
            }}
          >
            <textarea
              data-testid="agent-brief-input"
              value={brief}
              onChange={(e) => { setBrief(e.target.value); setSlashActive(0); setSlashDismissed(false); }}
              placeholder={t("agent.briefPlaceholder")}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={slashOpen}
              aria-controls="agent-slash-menu"
              aria-activedescendant={slashOpen ? `agent-slash-opt-${slashIndex}` : undefined}
              spellCheck={false}
              style={{
                ...monoInputStyle,
                flex: 1,
                minHeight: 44,
                maxHeight: 160,
                resize: "vertical",
                border: "none",
                background: "transparent",
                padding: "6px 0",
                lineHeight: 1.5,
                fontSize: 13,
                boxShadow: "none",
              }}
              onFocus={(e) => applyWorkbenchFocus(e.currentTarget.parentElement as HTMLElement)}
              onBlur={(e) => clearWorkbenchFocus(e.currentTarget.parentElement as HTMLElement)}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              {connected && (
                <WorkbenchButton
                  data-testid="agent-copy-handoff"
                  onClick={copyHandoff}
                  style={{ height: 30, padding: "0 10px" }}
                >
                  {t("agent.copyHandoff")}
                </WorkbenchButton>
              )}
              <WorkbenchButton
                data-testid={connected ? "agent-run-ai" : "agent-copy-handoff"}
                onClick={connected ? runWithAi : copyHandoff}
                disabled={connected && running}
                tone="accent"
                accentColor={UI_COLORS.accent}
                style={{ height: 30, minWidth: 116, padding: "0 12px" }}
              >
                {connected ? (running ? t("agent.running") : t("agent.runAi")) : t("agent.copyHandoff")}
              </WorkbenchButton>
            </div>
          </div>

          <div data-testid="agent-slash-hint" style={{ fontSize: 10, color: UI_COLORS.textSubtle, fontFamily: mono, letterSpacing: "0.04em" }}>
            {t("agent.slashHint")}
          </div>

          {/* Meta — context (what the agent sees) + handoff preview + status. */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", fontSize: 10, color: UI_COLORS.textSubtle, fontFamily: mono }}>
              <span style={subLabel}>{t("agent.contextLabel")}</span>
              {CONTEXT.map((item) => (
                <span key={item.id} data-testid={`agent-context-${item.id}`} style={{ letterSpacing: "0.02em" }}>
                  · {t(item.labelKey)}
                </span>
              ))}
            </div>
            <button data-testid="agent-handoff-toggle" aria-expanded={showHandoff} onClick={() => setShowHandoff((v) => !v)} style={toggleStyle}>
              <span aria-hidden style={{ transform: showHandoff ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
              {t("agent.draftPreview")}
            </button>
          </div>
          {showHandoff && (
            <pre data-testid="agent-handoff-preview" style={preStyle}>
              {handoff}
            </pre>
          )}

          <div style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 6 }}>
            {message || (connected ? t("agent.footerConnected") : t("agent.footerLocal"))}
          </div>
          <div data-testid="agent-provider-guide" style={{ fontSize: 10, color: UI_COLORS.textSubtle, lineHeight: 1.45 }}>
            {t("agent.providerGuide")}
          </div>
        </div>
      </div>
    </div>
  );
}

function pillStyle(color: string, bg: string): CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: mono,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.04em",
    color,
    background: bg,
    borderRadius: 999,
    padding: "3px 10px",
  };
}

const toggleStyle: CSSProperties = {
  appearance: "none",
  border: "none",
  background: "transparent",
  color: UI_COLORS.textMuted,
  cursor: "pointer",
  fontFamily: mono,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

const preStyle: CSSProperties = {
  margin: 0,
  maxHeight: 220,
  overflow: "auto",
  fontFamily: mono,
  fontSize: 11,
  lineHeight: 1.5,
  color: UI_COLORS.textSoft,
  background: UI_COLORS.inputInset,
  border: UI_BORDERS.control,
  borderRadius: 6,
  padding: "10px 12px",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};

/** AI turn body: status, the reply (or a JSON card), and review actions. */
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
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span data-testid={`agent-turn-status-${turn.id}`} style={{ color: turn.status === "error" ? UI_COLORS.danger : undefined }}>
        {statusText}
      </span>

      {turn.status === "success" && turn.configText ? (
        <div style={{ border: `1px solid ${UI_COLORS.border}`, borderRadius: 10, overflow: "hidden", background: UI_COLORS.appSurface }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${UI_COLORS.border}` }}>
            <span style={{ fontFamily: mono, fontSize: 10, color: UI_COLORS.textMuted, letterSpacing: "0.04em" }}>
              live-session.config.json · v1
            </span>
          </div>
          <pre data-testid={`agent-turn-message-${turn.id}`} style={{ ...preStyle, margin: 0, border: "none", borderRadius: 0, background: "transparent", maxHeight: 200 }}>
            {turn.configText}
          </pre>
          <div style={{ display: "flex", gap: 8, padding: "10px 12px", borderTop: `1px solid ${UI_COLORS.border}` }}>
            {onReviewJson && (
              <WorkbenchButton
                data-testid={`agent-turn-review-${turn.id}`}
                onClick={() => onReviewJson(turn.configText as string)}
                tone="accent"
                accentColor={UI_COLORS.accent}
                style={{ height: 28, padding: "0 10px" }}
              >
                {t("agent.reviewInJson")} ↗
              </WorkbenchButton>
            )}
            <WorkbenchButton data-testid={`agent-turn-copy-${turn.id}`} onClick={() => onCopy(turn.message)} style={{ height: 28, padding: "0 10px" }}>
              {t("agent.copyReply")}
            </WorkbenchButton>
          </div>
        </div>
      ) : turn.status !== "running" && turn.message ? (
        <>
          <pre data-testid={`agent-turn-message-${turn.id}`} style={preStyle}>
            {turn.message}
          </pre>
          <div>
            <WorkbenchButton data-testid={`agent-turn-copy-${turn.id}`} onClick={() => onCopy(turn.message)} style={{ height: 28, padding: "0 10px" }}>
              {t("agent.copyReply")}
            </WorkbenchButton>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Collapsible({ id, text, toggleLabel }: { id: number; text: string; toggleLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <button data-testid={`agent-turn-handoff-toggle-${id}`} aria-expanded={open} onClick={() => setOpen((v) => !v)} style={toggleStyle}>
        <span aria-hidden style={{ transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>▸</span>
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

/** Assistant row — a spark mark + left-aligned readable content. */
function AssistantRow({ testId, children }: { testId: string; children: ReactNode }) {
  return (
    <div data-testid={testId} data-role="assistant" style={{ display: "flex", gap: 10, maxWidth: "94%", fontSize: 13 }}>
      <span
        aria-hidden
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          flexShrink: 0,
          background: cssAlpha(UI_COLORS.accent, 12),
          color: UI_COLORS.accentText,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 11,
        }}
      >
        ✦
      </span>
      <div style={{ flex: 1, minWidth: 0, color: UI_COLORS.textSoft, lineHeight: 1.55 }}>{children}</div>
    </div>
  );
}

/** User bubble — right-aligned quiet card. */
function UserBubble({ testId, children }: { testId: string; children: ReactNode }) {
  return (
    <div
      data-testid={testId}
      data-role="user"
      style={{
        alignSelf: "flex-end",
        maxWidth: "78%",
        display: "flex",
        flexDirection: "column",
        background: UI_COLORS.inputInset,
        border: `1px solid ${UI_COLORS.controlBorder}`,
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 13,
        lineHeight: 1.5,
        color: UI_COLORS.text,
      }}
    >
      {children}
    </div>
  );
}

function GhostButton({ testId, onClick, children }: { testId: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      style={{
        appearance: "none",
        cursor: "pointer",
        border: `1px solid ${UI_COLORS.controlBorder}`,
        borderRadius: 4,
        background: "transparent",
        color: UI_COLORS.textSoft,
        fontFamily: mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "4px 10px",
      }}
    >
      {children}
    </button>
  );
}

function Dot({ color }: { color: string }) {
  return <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

import { Fragment, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { OverlayState } from "../../types";
import type { TranslationKey } from "../../lib/i18n";
import { useLocale } from "../../hooks/useLocale";
import { UI_BORDERS, UI_COLORS, cssAlpha } from "../../lib/design-tokens";
import { buildAgentPrompt } from "../../lib/agent-prompt";
import { parseConfigText, projectConfigText } from "../../lib/session-config-drift";
import { configToOverlayState } from "../../lib/live-studio-config";
import { diffConfigProposal, type ConfigChange, type DiffGroup, type FieldDiff } from "../../lib/config-proposal";
import type { SessionAgentStatus } from "../../lib/session-agent";
import { fetchAgentStatus, runSessionAgent } from "../../lib/session-agent-client";
import {
  appendAgentConversationMessage,
  archiveAgentConversationClient,
  createAgentConversationClient,
  fetchAgentConversation,
  fetchAgentConversations,
  markAgentProposalReviewedClient,
} from "../../lib/agent-conversation-client";
import type {
  AgentConversationDetail,
  AgentConversationMessage,
  AgentConversationSummary,
  AgentProposalStatus,
} from "../../db/agent-conversation-repository";
import { resolveCopyResult, shortConfigHash, turnMessageKey, type CopyStatus } from "./agent-copy";
import {
  WorkbenchButton,
  applyWorkbenchFocus,
  choiceChipStyle,
  clearWorkbenchFocus,
  monoInputStyle,
} from "../shared/Field";
import { activeAgenda } from "../../lib/agenda";

interface AgentViewProps {
  state: OverlayState;
  dateKey: string;
  /** Public demo mode: local handoff only; no provider or conversation persistence calls. */
  demoMode?: boolean;
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
  { id: "generate", labelKey: "agentTask.generate", descKey: "agentTask.generateDesc", line: "Task: generate the stream content (title, subtitle, sections, stack, badges). Keep identity and brand as-is." },
  { id: "sections", labelKey: "agentTask.sections", descKey: "agentTask.sectionsDesc", line: "Task: update only the sections (titles + bullets); keep everything else." },
  { id: "titleCover", labelKey: "agentTask.titleCover", descKey: "agentTask.titleCoverDesc", line: "Task: update the title and subtitle (today's topic); keep everything else." },
  { id: "assets", labelKey: "agentTask.assets", descKey: "agentTask.assetsDesc", line: "Task: update the stack and optional topic-matched badges; keep everything else." },
  { id: "check", labelKey: "agentTask.check", descKey: "agentTask.checkDesc", line: "Task: review the current stream content for issues and return a corrected version." },
];

const CONTEXT: { id: string; labelKey: TranslationKey }[] = [
  { id: "config", labelKey: "agentContext.config" },
  { id: "core", labelKey: "agentContext.core" },
  { id: "noRuntime", labelKey: "agentContext.noRuntime" },
  { id: "obs", labelKey: "agentContext.obs" },
];

/** Top-level v1 field → its "changed" label, for the proposal review summary. */
const CHANGE_LABEL: Record<ConfigChange["field"], TranslationKey> = {
  title: "agent.changeTitle",
  subtitle: "agent.changeSubtitle",
  author: "agent.changeAuthor",
  profile: "agent.changeProfile",
  cover: "agent.changeCover",
  badges: "agent.changeBadges",
  stack: "agent.changeStack",
  socials: "agent.changeSocials",
  sections: "agent.changeSections",
};

/**
 * Slash commands — a lightweight, natural-language command surface in the
 * composer. Task commands set the active intent; nav commands jump to the JSON
 * drawer or a Settings group (the Agent never edits settings itself).
 */
const SLASH_COMMANDS: { cmd: string; task?: string; group?: string; json?: boolean }[] = [
  { cmd: "generate", task: "generate" },
  { cmd: "sections", task: "sections" },
  { cmd: "title", task: "titleCover" },
  { cmd: "stack", task: "assets" },
  { cmd: "check", task: "check" },
  { cmd: "json", json: true },
  { cmd: "broadcast", group: "broadcast" },
  { cmd: "provider", group: "provider" },
  { cmd: "settings", group: "session" },
];

interface TurnBase {
  id: number;
  taskId: string;
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
  proposalId?: string;
  proposalStatus?: AgentProposalStatus;
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

function summaryFromDetail(detail: AgentConversationDetail): AgentConversationSummary {
  const { messages: _messages, ...summary } = detail;
  return summary;
}

function messagesToTurns(messages: AgentConversationMessage[]): Turn[] {
  const turns: Turn[] = [];
  let pendingUser: AgentConversationMessage | null = null;
  let nextId = 1;

  for (const message of messages) {
    if (message.role === "user") {
      pendingUser = message;
      continue;
    }

    const user = pendingUser;
    pendingUser = null;
    const base = {
      id: nextId++,
      taskId: user?.taskId || message.taskId || "generate",
      brief: user?.content || "",
      taskLabel: user?.taskLabel || message.taskLabel || "",
      snapshot: user?.snapshot || message.snapshot || "",
    };

    if (message.kind === "local") {
      turns.push({
        ...base,
        kind: "local",
        status: message.status === "copied" ? "copied" : "manual",
        handoff: message.content,
      });
    } else {
      turns.push({
        ...base,
        kind: "ai",
        status: message.status === "error" ? "error" : "success",
        message: message.content,
        configText: message.proposal?.configText ?? null,
        provider: message.provider || undefined,
        model: message.model || undefined,
        proposalId: message.proposal?.id,
        proposalStatus: message.proposal?.status,
      });
    }
  }

  return turns;
}

/**
 * Agent mode — a full chat window. The user converses; "Run with AI" (when a
 * provider is configured server-side) sends the brief + task + current v1
 * projection to `/api/session-config/agent` and shows the reply as a turn. A
 * returned config renders as a compact proposal card (no full JSON in the chat);
 * the proposal rail summarizes what would change and "Review in JSON" seeds the
 * drift-safe drawer buffer — never auto-imported, never auto-applied. With no
 * provider, the pill reads "local · no model" and Copy handoff is the path. The
 * API key stays on the server; the client only knows provider / model names.
 */
export default function AgentView({ state, dateKey, demoMode = false, onOpenJson, onReviewJson, onOpenSettings, initialStatus }: AgentViewProps) {
  const { t, locale } = useLocale();
  const [brief, setBrief] = useState("");
  const [taskId, setTaskId] = useState("generate");
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<AgentConversationSummary[]>([]);
  const [conversationAvailable, setConversationAvailable] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [status, setStatus] = useState<SessionAgentStatus>(initialStatus ?? { configured: false });
  const [running, setRunning] = useState(false);
  const [intentsOpen, setIntentsOpen] = useState(false);
  const [showHandoff, setShowHandoff] = useState(false);
  const nextTurnId = useRef(1);

  const task = TASKS.find((item) => item.id === taskId) ?? TASKS[0];
  const handoff = useMemo(() => buildAgentPrompt(state, brief, task.line, locale), [state, brief, task.line, locale]);
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
    // The demo reflects the deploy's real provider status too: a showcase that
    // configured a key can run the (rate-limited) agent; with none it falls back
    // to the local handoff. The status GET is key-free.
    let active = true;
    void fetchAgentStatus().then((next) => {
      if (active) setStatus(next);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (demoMode) {
      setConversationAvailable(false);
      setConversations([]);
      setConversationId(null);
      return;
    }

    let active = true;
    void fetchAgentConversations(locale, dateKey).then((result) => {
      if (!active) return;
      setConversationAvailable(result.databaseConfigured === true);
      setConversations(result.conversations);
      setConversationId(result.current?.id ?? null);
      if (result.current) {
        const hydrated = messagesToTurns(result.current.messages);
        setTurns(hydrated);
        nextTurnId.current = hydrated.length + 1;
      }
    });
    return () => {
      active = false;
    };
  }, [demoMode, locale, dateKey]);

  const refreshConversationList = () => {
    if (demoMode) return;
    void fetchAgentConversations(locale, dateKey).then((result) => {
      setConversationAvailable(result.databaseConfigured === true);
      if (result.databaseConfigured) setConversations(result.conversations);
    });
  };

  const patchTurn = (id: number, patch: Partial<AiTurn>) => {
    setTurns((prev) =>
      prev.map((turn) => (turn.id === id && turn.kind === "ai" ? { ...turn, ...patch } : turn)),
    );
  };

  const persistTurnPair = (turn: LocalTurn | AiTurn) => {
    if (demoMode) return;
    if (!conversationId) return;
    void appendAgentConversationMessage(conversationId, {
      role: "user",
      content: turn.brief || t("agent.noBrief"),
      taskId: turn.taskId,
      taskLabel: turn.taskLabel,
      snapshot: turn.snapshot,
    }).then(() =>
      appendAgentConversationMessage(conversationId, {
        role: "assistant",
        kind: turn.kind,
        status: turn.status === "running" ? "success" : turn.status,
        content: turn.kind === "local" ? turn.handoff : turn.message || t("agent.aiSuccessText"),
        taskId: turn.taskId,
        taskLabel: turn.taskLabel,
        snapshot: turn.snapshot,
        provider: turn.kind === "ai" ? turn.provider : undefined,
        model: turn.kind === "ai" ? turn.model : undefined,
        proposal:
          turn.kind === "ai" && turn.configText
            ? { configText: turn.configText }
            : undefined,
      }),
    ).then((result) => {
      if (turn.kind === "ai" && result.message?.proposal?.id) {
        patchTurn(turn.id, {
          proposalId: result.message.proposal.id,
          proposalStatus: result.message.proposal.status,
        });
      }
      refreshConversationList();
    });
  };

  const loadConversation = (id: string) => {
    if (demoMode) return;
    void fetchAgentConversation(id).then((result) => {
      setConversationAvailable(result.databaseConfigured === true);
      if (!result.conversation) return;
      const hydrated = messagesToTurns(result.conversation.messages);
      setConversationId(result.conversation.id);
      setTurns(hydrated);
      setMessage("");
      setHistoryOpen(false);
      nextTurnId.current = hydrated.length + 1;
    });
  };

  const startNewConversation = () => {
    setTurns([]);
    setMessage("");
    setHistoryOpen(false);
    if (demoMode) {
      setConversationId(null);
      nextTurnId.current = 1;
      return;
    }
    void createAgentConversationClient(locale, dateKey).then((result) => {
      setConversationAvailable(result.databaseConfigured === true);
      if (!result.conversation) {
        setConversationId(null);
        return;
      }
      setConversationId(result.conversation.id);
      setConversations((prev) => [
        summaryFromDetail(result.conversation as AgentConversationDetail),
        ...prev.filter((conversation) => conversation.id !== result.conversation?.id),
      ]);
      nextTurnId.current = 1;
    });
  };

  const archiveConversation = (id: string) => {
    if (demoMode) return;
    void archiveAgentConversationClient(id).then((result) => {
      setConversationAvailable(result.databaseConfigured === true);
      if (!result.databaseConfigured) return;
      setConversations((prev) => prev.filter((conversation) => conversation.id !== id));
      if (id === conversationId) startNewConversation();
    });
  };

  const recordLocalTurn = (copied: boolean) => {
    const { messageKey, turnStatus } = resolveCopyResult(copied);
    const turn: LocalTurn = {
      kind: "local",
      id: nextTurnId.current++,
      taskId: task.id,
      brief: brief.trim(),
      taskLabel: t(task.labelKey),
      snapshot: shortConfigHash(handoff),
      handoff,
      status: turnStatus,
    };
    setMessage(t(messageKey));
    setTurns((prev) => [...prev, turn]);
    persistTurnPair(turn);
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
    // The demo runs the real agent too when the deploy is configured (this path
    // is only reached while connected). Nothing is persisted: persistTurnPair
    // stays demo-guarded, so the turn lives only in local state.
    const configText = projectConfigText(state);
    const id = nextTurnId.current++;
    const baseTurn = {
      kind: "ai" as const,
      id,
      taskId: task.id,
      brief: brief.trim(),
      taskLabel: t(task.labelKey),
      snapshot: shortConfigHash(configText),
      provider: status.provider,
      model: status.model,
    };
    setTurns((prev) => [
      ...prev,
      {
        ...baseTurn,
        status: "running",
        message: "",
        configText: null,
      },
    ]);
    setRunning(true);
    setMessage("");
    void runSessionAgent({ brief: brief.trim(), task: task.line, configText, locale })
      .then((result) => {
        if (result.mode === "ai") {
          const patch = {
            status: "success",
            message: result.message ?? "",
            configText: result.configText ?? null,
            provider: result.provider,
            model: result.model,
          } satisfies Partial<AiTurn>;
          patchTurn(id, patch);
          persistTurnPair({ ...baseTurn, ...patch } as AiTurn);
        } else if (result.mode === "local") {
          const patch = { status: "error", message: t("agent.aiNotConfigured"), configText: null } satisfies Partial<AiTurn>;
          patchTurn(id, patch);
          persistTurnPair({ ...baseTurn, ...patch } as AiTurn);
        } else {
          const message = result.rateLimited ? t("agent.rateLimited") : result.error ?? t("agent.aiError");
          const patch = { status: "error", message, configText: null } satisfies Partial<AiTurn>;
          patchTurn(id, patch);
          persistTurnPair({ ...baseTurn, ...patch } as AiTurn);
        }
      })
      .finally(() => setRunning(false));
  };

  const copyText = (text: string) => {
    if (navigator.clipboard) void navigator.clipboard.writeText(text).catch(() => {});
  };

  const reviewProposal = (turn: AiTurn) => {
    if (conversationId && turn.proposalId) {
      void markAgentProposalReviewedClient(conversationId, turn.proposalId).then((result) => {
        if (result.proposal) patchTurn(turn.id, { proposalStatus: result.proposal.status });
      });
    }
    if (turn.configText) onReviewJson?.(turn.configText);
  };

  // The latest AI proposal (a successful turn that returned a config) drives the
  // split review rail. No proposal → the Agent stays centered.
  const proposal = useMemo<AiTurn | null>(() => {
    for (let i = turns.length - 1; i >= 0; i--) {
      const turn = turns[i];
      if (turn.kind === "ai" && turn.status === "success" && turn.configText) return turn;
    }
    return null;
  }, [turns]);

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
          <span data-testid="agent-conversation-status" style={pillStyle(UI_COLORS.textMuted, UI_COLORS.inputInset)}>
            <Dot color={conversationAvailable ? UI_COLORS.success : UI_COLORS.textSubtle} />
            {conversationAvailable ? t("agent.conversationSaved") : t("agent.conversationLocal")}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ position: "relative" }}>
            <GhostButton testId="agent-history-toggle" onClick={() => setHistoryOpen((open) => !open)}>
              {t("agent.history")}
            </GhostButton>
            {historyOpen && (
              <div
                data-testid="agent-history-list"
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 6px)",
                  zIndex: 4,
                  width: 260,
                  maxHeight: 260,
                  overflowY: "auto",
                  border: UI_BORDERS.control,
                  borderRadius: 8,
                  background: UI_COLORS.appSurface,
                  boxShadow: "0 16px 38px rgba(0,0,0,0.22)",
                  padding: 6,
                }}
              >
                {conversations.length === 0 ? (
                  <div style={{ padding: "8px 10px", fontSize: 11, color: UI_COLORS.textMuted }}>
                    {t("agent.noHistory")}
                  </div>
                ) : (
                  conversations.map((conversation) => {
                    const active = conversation.id === conversationId;
                    return (
                      <div
                        key={conversation.id}
                        data-testid={`agent-history-item-${conversation.id}`}
                        style={{
                          width: "100%",
                          borderLeft: `2px solid ${active ? UI_COLORS.accent : "transparent"}`,
                          borderRadius: 0,
                          background: active ? cssAlpha(UI_COLORS.accent, 10) : "transparent",
                          padding: "7px 7px 7px 9px",
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <button
                          data-testid={`agent-history-load-${conversation.id}`}
                          onClick={() => loadConversation(conversation.id)}
                          style={{
                            appearance: "none",
                            border: "none",
                            background: "transparent",
                            color: UI_COLORS.text,
                            cursor: "pointer",
                            padding: 0,
                            textAlign: "left",
                            minWidth: 0,
                            flex: 1,
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conversation.title}</span>
                          <span style={{ ...subLabel, fontSize: 9, letterSpacing: "0.04em" }}>
                            {conversation.updatedAt.slice(0, 10)}
                          </span>
                        </button>
                        <button
                          data-testid={`agent-history-archive-${conversation.id}`}
                          onClick={() => archiveConversation(conversation.id)}
                          style={{
                            ...toggleStyle,
                            flexShrink: 0,
                            color: UI_COLORS.textSubtle,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {t("agent.archive")}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          {turns.length > 0 && (
            <GhostButton testId="agent-new-chat" onClick={startNewConversation}>
              {t("agent.newChat")}
            </GhostButton>
          )}
          <GhostButton testId="open-json-agent" onClick={onOpenJson}>
            {t("drawer.openJson")} ↗
          </GhostButton>
        </div>
      </header>

      <div
        data-testid="agent-body"
        style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}
      >
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
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
                  <AiTurnBody turn={turn} onReviewProposal={reviewProposal} onCopy={copyText} />
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
                      style={{ ...choiceChipStyle(active), padding: "4px 11px" }}
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
        {proposal && (
          <aside
            data-testid="agent-proposal-rail"
            aria-label={t("agent.proposalTitle")}
            style={{
              width: 320,
              minWidth: 280,
              flexShrink: 0,
              borderLeft: `1px solid ${UI_COLORS.border}`,
              overflowY: "auto",
              padding: "18px 18px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <ProposalRail
              proposal={proposal}
              currentConfigText={projectConfigText(state)}
              state={state}
              onReviewProposal={reviewProposal}
              onCopy={copyText}
              onOpenSettings={onOpenSettings}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

/**
 * Proposal review rail — the right side of the Agent split once the AI returns a
 * config. It summarizes what would change (a pure diff), but never applies:
 * Review in JSON is the only path into the drift-safe drawer.
 */
const DIFF_GROUPS: { id: DiffGroup; labelKey: TranslationKey }[] = [
  { id: "identity", labelKey: "agent.diffGroup.identity" },
  { id: "media", labelKey: "agent.diffGroup.media" },
  { id: "assets", labelKey: "agent.diffGroup.assets" },
  { id: "sections", labelKey: "agent.diffGroup.sections" },
];

/**
 * Proposal review rail — a grouped before/after field diff once the AI returns a
 * config, an optional read-only preview of the applied result (derived, never
 * written to state), and the single path forward: Review in JSON. It never
 * applies and never writes OverlayState / localStorage.
 */
function ProposalRail({
  proposal,
  currentConfigText,
  state,
  onReviewProposal,
  onCopy,
  onOpenSettings,
}: {
  proposal: AiTurn;
  currentConfigText: string;
  state: OverlayState;
  onReviewProposal?: (turn: AiTurn) => void;
  onCopy: (text: string) => void;
  onOpenSettings?: (group?: string) => void;
}) {
  const { t } = useLocale();
  const [previewing, setPreviewing] = useState(false);
  const diff = diffConfigProposal(currentConfigText, proposal.configText ?? "");
  const parsed = parseConfigText(proposal.configText ?? "");
  // Ephemeral preview — derived from the proposal each render, never written to
  // OverlayState / localStorage. Only computed while previewing a valid config.
  const previewState = previewing && parsed.ok ? configToOverlayState(state, parsed.config) : null;

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ ...subLabel, color: UI_COLORS.accentText }}>{t("agent.proposalTitle")}</span>
        <span style={{ fontFamily: "var(--app-font-serif)", fontSize: 17, fontWeight: 500, color: UI_COLORS.text }}>
          {proposal.taskLabel}
        </span>
        <span style={{ fontFamily: mono, fontSize: 10, color: UI_COLORS.textMuted }}>
          live-session.config.json · v1 · {t("agent.snapshot")} {proposal.snapshot}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={subLabel}>{t("agent.reviewChanges")}</span>
        {!diff.ok ? (
          <span data-testid="agent-proposal-invalid" style={{ fontSize: 12, color: UI_COLORS.textMuted, lineHeight: 1.5 }}>
            {t("agent.proposalInvalid")}
          </span>
        ) : diff.fields.length === 0 ? (
          <span data-testid="agent-proposal-nochanges" style={{ fontSize: 12, color: UI_COLORS.textMuted, lineHeight: 1.5 }}>
            {t("agent.proposalNoChanges")}
          </span>
        ) : (
          <div data-testid="agent-proposal-changes" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DIFF_GROUPS.map((group) => {
              const fields = diff.fields.filter((f) => f.group === group.id);
              if (fields.length === 0) return null;
              return (
                <div key={group.id} data-testid={`agent-proposal-group-${group.id}`} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontFamily: mono, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: UI_COLORS.textMuted }}>
                    {t(group.labelKey)}
                  </span>
                  {fields.map((f) => (
                    <DiffRow key={f.field} field={f} />
                  ))}
                </div>
              );
            })}
            <div
              data-testid="agent-proposal-runtime-safe"
              style={{ marginTop: 2, paddingTop: 8, borderTop: `1px solid ${UI_COLORS.border}`, fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.5 }}
            >
              {t("agent.proposalRuntimeSafe")}
            </div>
          </div>
        )}
      </div>

      {/* Preview — read-only, derived; never writes state. */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {parsed.ok ? (
          <button
            data-testid={previewing ? "agent-proposal-stop-preview" : "agent-proposal-preview"}
            aria-pressed={previewing}
            onClick={() => setPreviewing((v) => !v)}
            style={toggleStyle}
          >
            <span aria-hidden>{previewing ? "■" : "▸"}</span>
            {previewing ? t("agent.stopPreview") : t("agent.previewProposal")}
          </button>
        ) : (
          <span data-testid="agent-proposal-preview-disabled" style={{ fontSize: 10, color: UI_COLORS.textSubtle, lineHeight: 1.4 }}>
            {t("agent.previewDisabled")}
          </span>
        )}
        {previewState && <ProposalPreview previewState={previewState} />}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto" }}>
        {onReviewProposal && (
          <WorkbenchButton
            data-testid="agent-proposal-review"
            onClick={() => onReviewProposal(proposal)}
            tone="accent"
            accentColor={UI_COLORS.accent}
            style={{ height: 32, padding: "0 12px" }}
          >
            {t("agent.reviewInJson")} ↗
          </WorkbenchButton>
        )}
        <WorkbenchButton data-testid="agent-proposal-copy" onClick={() => onCopy(proposal.message)} style={{ height: 30, padding: "0 12px" }}>
          {t("agent.copyReply")}
        </WorkbenchButton>
        {onOpenSettings && (
          <button data-testid="agent-proposal-settings" onClick={() => onOpenSettings()} style={toggleStyle}>
            {t("agent.proposalOpenSettings")}
          </button>
        )}
      </div>
    </>
  );
}

/** One field's before → after row (scalar / object summary, or array counts + items). */
function DiffRow({ field }: { field: FieldDiff }) {
  const { t } = useLocale();
  const statusColor =
    field.optionalEmpty || field.status === "changed"
      ? UI_COLORS.textMuted
      : field.status === "added"
        ? UI_COLORS.accentText
        : UI_COLORS.danger;
  const statusKey = (field.optionalEmpty || field.status === "changed" ? "agent.diffChanged" : field.status === "added" ? "agent.diffAdded" : "agent.diffRemoved") as TranslationKey;
  const isArray = field.oldCount !== undefined;
  return (
    <div data-testid={`agent-proposal-change-${field.field}`} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: UI_COLORS.textSoft }}>{t(CHANGE_LABEL[field.field])}</span>
        <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: "0.04em", textTransform: "uppercase", color: statusColor }}>{t(statusKey)}</span>
      </div>
      {isArray ? (
        <div style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.45 }}>
          <span style={{ fontFamily: mono }}>{field.oldCount} → {field.newCount}</span>
          {field.optionalEmpty && <div>{t("agent.badgesOptionalEmpty")}</div>}
          {field.added && field.added.length > 0 && <div>{t("agent.diffAdded")}: {field.added.join(", ")}</div>}
          {!field.optionalEmpty && field.removed && field.removed.length > 0 && <div>{t("agent.diffRemoved")}: {field.removed.join(", ")}</div>}
          {field.changed && field.changed.length > 0 && <div>{t("agent.diffChanged")}: {field.changed.join(", ")}</div>}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.45, overflowWrap: "anywhere" }}>
          <span style={{ textDecoration: field.status === "removed" ? "line-through" : undefined }}>{field.oldValue || "∅"}</span>
          {" → "}
          <span style={{ color: UI_COLORS.textSoft }}>{field.newValue || "∅"}</span>
        </div>
      )}
    </div>
  );
}

/** A small read-only preview of the proposal applied — derived, never written. */
function ProposalPreview({ previewState }: { previewState: OverlayState }) {
  const { t } = useLocale();
  const sectionTitles = activeAgenda(previewState).sections.map((s, i) => s.title || `#${i + 1}`).join(" · ");
  const stackLabels = previewState.stack.items.map((i) => i.label || i.iconKey).filter(Boolean).join(" · ");
  return (
    <div
      data-testid="agent-proposal-preview"
      style={{ border: `1px solid ${UI_COLORS.border}`, borderRadius: 8, background: UI_COLORS.inputInset, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}
    >
      <span style={{ ...subLabel, color: UI_COLORS.accentText }}>{t("agent.previewLabel")}</span>
      <span style={{ fontFamily: "var(--app-font-serif)", fontSize: 15, fontWeight: 500, color: UI_COLORS.text }}>{previewState.cover.title || "∅"}</span>
      <span style={{ fontSize: 12, color: UI_COLORS.textSoft }}>{previewState.cover.todayTopic || "∅"}</span>
      <PreviewLine label={t("settingsField.sections")} value={sectionTitles} />
      <PreviewLine label={t("group.stack")} value={stackLabels} />
      <span style={{ fontSize: 10, color: UI_COLORS.textSubtle, lineHeight: 1.4, marginTop: 2 }}>{t("agent.previewNote")}</span>
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 6, fontSize: 11 }}>
      <span style={{ ...subLabel, fontSize: 9, flexShrink: 0 }}>{label}</span>
      <span style={{ color: UI_COLORS.textMuted, overflowWrap: "anywhere" }}>{value || "∅"}</span>
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
    borderRadius: 0,
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

/**
 * AI turn body: status + a compact "proposal ready" card (Review in JSON / Copy)
 * for a returned config, or the plain reply for a text answer. The full config
 * JSON is never dumped in the chat — the summary lives in the proposal rail and
 * the full text in the drift-safe JSON drawer.
 */
function AiTurnBody({
  turn,
  onReviewProposal,
  onCopy,
}: {
  turn: AiTurn;
  onReviewProposal?: (turn: AiTurn) => void;
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
        <div
          data-testid={`agent-turn-proposal-ready-${turn.id}`}
          style={{
            border: `1px solid ${UI_COLORS.border}`,
            borderRadius: 8,
            background: cssAlpha(UI_COLORS.accent, 7),
            padding: "10px 12px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <span style={{ color: UI_COLORS.textSoft, lineHeight: 1.5, fontSize: 12 }}>{t("agent.proposalReady")}</span>
          <div style={{ display: "flex", gap: 8 }}>
            {onReviewProposal && (
              <WorkbenchButton
                data-testid={`agent-turn-review-${turn.id}`}
                onClick={() => onReviewProposal(turn)}
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
        borderRadius: 0,
        background: "transparent",
        color: UI_COLORS.accentText,
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

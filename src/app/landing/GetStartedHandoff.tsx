"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { AgentTask } from "./content";

interface GetStartedHandoffProps {
  tasks: ReadonlyArray<AgentTask>;
  setupPrompt: string;
  humanItems: ReadonlyArray<{ label: string; value: string; href?: string }>;
  githubUrl: string;
  // i18n strings
  agentTabLabel: string;
  humanTabLabel: string;
  agentTasksLabel: string;
  copyPromptLabel: string;
  copiedLabel: string;
  copyFailedLabel: string;
  readmeGithub: string;
  setupModeLabel: string;
}

type Mode = "agent" | "human";
type CopyState = "idle" | "copied" | "failed";

export default function GetStartedHandoff({
  tasks,
  setupPrompt,
  humanItems,
  githubUrl,
  agentTabLabel,
  humanTabLabel,
  agentTasksLabel,
  copyPromptLabel,
  copiedLabel,
  copyFailedLabel,
  readmeGithub,
  setupModeLabel,
}: GetStartedHandoffProps) {
  const [mode, setMode] = useState<Mode>("agent");
  const [taskIndex, setTaskIndex] = useState(0);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const agentTabRef = useRef<HTMLButtonElement | null>(null);
  const humanTabRef = useRef<HTMLButtonElement | null>(null);
  const baseId = useId();

  const agentTabId = `${baseId}-tab-agent`;
  const humanTabId = `${baseId}-tab-human`;
  const agentPanelId = `${baseId}-panel-agent`;
  const humanPanelId = `${baseId}-panel-human`;

  const currentTask = tasks[taskIndex] ?? tasks[0];
  const currentPrompt = currentTask?.prompt ?? setupPrompt;

  const resetCopyState = useCallback(() => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    setCopyState("idle");
  }, []);

  const copyPrompt = useCallback(
    async (text: string) => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      try {
        if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
          setCopyState("failed");
          copyTimerRef.current = setTimeout(() => setCopyState("idle"), 3000);
          return;
        }
        await navigator.clipboard.writeText(text);
        setCopyState("copied");
        copyTimerRef.current = setTimeout(() => setCopyState("idle"), 2500);
      } catch {
        setCopyState("failed");
        copyTimerRef.current = setTimeout(() => setCopyState("idle"), 3000);
      }
    },
    [],
  );

  const onSegmentedKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const next = mode === "agent" ? "human" : "agent";
        setMode(next);
        (next === "agent" ? agentTabRef : humanTabRef).current?.focus();
      }
    },
    [mode],
  );

  return (
    <div className="akl-handoff" data-testid="landing-handoff">
      <div className="akl-handoff-segmented" role="tablist" aria-label={setupModeLabel}>
        <button
          ref={agentTabRef}
          type="button"
          role="tab"
          id={agentTabId}
          aria-selected={mode === "agent"}
          aria-controls={agentPanelId}
          tabIndex={mode === "agent" ? 0 : -1}
          className="akl-handoff-seg"
          data-selected={mode === "agent" || undefined}
          onClick={() => {
            setMode("agent");
            resetCopyState();
          }}
          onKeyDown={onSegmentedKeyDown}
        >
          {agentTabLabel}
        </button>
        <button
          ref={humanTabRef}
          type="button"
          role="tab"
          id={humanTabId}
          aria-selected={mode === "human"}
          aria-controls={humanPanelId}
          tabIndex={mode === "human" ? 0 : -1}
          className="akl-handoff-seg"
          data-selected={mode === "human" || undefined}
          onClick={() => {
            setMode("human");
            resetCopyState();
          }}
          onKeyDown={onSegmentedKeyDown}
        >
          {humanTabLabel}
        </button>
      </div>

      <div
        id={agentPanelId}
        role="tabpanel"
        aria-labelledby={agentTabId}
        hidden={mode !== "agent"}
        className="akl-handoff-panel"
        data-testid="landing-agent-panel"
      >
        <div className="akl-handoff-tasks" role="group" aria-label={agentTasksLabel}>
          {tasks.map((task, index) => (
            <button
              key={task.id}
              type="button"
              className="akl-handoff-chip"
              data-selected={index === taskIndex || undefined}
              onClick={() => {
                setTaskIndex(index);
                resetCopyState();
              }}
            >
              {task.label}
            </button>
          ))}
        </div>
        <div className="akl-handoff-prompt">
          <pre className="akl-handoff-prompt-text">{currentPrompt}</pre>
          <button
            type="button"
            className="akl-handoff-copy"
            data-state={copyState}
            onClick={() => copyPrompt(currentPrompt)}
            aria-label={copyPromptLabel}
          >
            {copyState === "copied"
              ? copiedLabel
              : copyState === "failed"
                ? copyFailedLabel
                : copyPromptLabel}
          </button>
        </div>
      </div>

      <div
        id={humanPanelId}
        role="tabpanel"
        aria-labelledby={humanTabId}
        hidden={mode !== "human"}
        className="akl-handoff-panel"
        data-testid="landing-human-panel"
      >
        <ul className="akl-handoff-checklist">
          {humanItems.map((item) => (
            <li key={item.value}>
              <span className="akl-handoff-checklist-label">{item.label}</span>
              {item.href ? (
                <a href={item.href} className="akl-handoff-checklist-value">
                  {item.value}
                </a>
              ) : (
                <code className="akl-handoff-checklist-value">{item.value}</code>
              )}
            </li>
          ))}
        </ul>
        <a href={githubUrl} className="akl-get-started-link" target="_blank" rel="noopener noreferrer">
          {readmeGithub}
        </a>
      </div>
    </div>
  );
}

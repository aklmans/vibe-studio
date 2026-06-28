import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { UI_COLORS, cssAlpha } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import { WorkbenchButton } from "../shared/Field";
import type { SessionAgentStatus, SessionAgentTestResponse } from "../../lib/session-agent";
import { fetchAgentStatus, testAgentConnection } from "../../lib/session-agent-client";

const mono = "var(--app-font-mono)";
const ENV_TEMPLATE = [
  "SESSION_AGENT_PROVIDER=deepseek",
  "SESSION_AGENT_BASE_URL=https://provider.example/v1",
  "SESSION_AGENT_MODEL=deepseek-chat",
  "SESSION_AGENT_USER_AGENT=Vibe-Coding-Live/1.0",
  "SESSION_AGENT_API_KEY=...",
].join("\n");

interface AIProviderSettingsProps {
  /** Seed status for tests; the mount effect refreshes it from the route. */
  initialStatus?: SessionAgentStatus;
}

/**
 * AI Provider settings — a read-only connection panel + a connection test. The
 * API key is configured server-side via env (SESSION_AGENT_*) and is never
 * entered, stored, echoed, or logged in the client; the panel only ever shows
 * configured / not set. Base URL, model, provider and User-Agent are non-secret
 * and shown for reference. The Agent links here but cannot change any of this —
 * settings are never edited through the chat.
 */
export default function AIProviderSettings({ initialStatus }: AIProviderSettingsProps) {
  const { t } = useLocale();
  const [status, setStatus] = useState<SessionAgentStatus>(initialStatus ?? { configured: false });
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<SessionAgentTestResponse | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    let active = true;
    void fetchAgentStatus().then((next) => {
      if (active) setStatus(next);
    });
    return () => {
      active = false;
    };
  }, []);

  const connected = status.configured;

  const runTest = () => {
    if (testing || !connected) return;
    setTesting(true);
    setResult(null);
    void testAgentConnection()
      .then(setResult)
      .finally(() => setTesting(false));
  };

  const copyEnvTemplate = () => {
    if (!navigator.clipboard) {
      setCopyStatus("failed");
      return;
    }
    void navigator.clipboard.writeText(ENV_TEMPLATE).then(() => setCopyStatus("copied")).catch(() => setCopyStatus("failed"));
  };

  return (
    <div data-testid="ai-provider-settings" style={{ display: "flex", flexDirection: "column" }}>
      <Row rowId="provider" title={t("aiProvider.statusLabel")}>
        {connected ? (
          <span data-testid="ai-provider-status-connected" style={pill(UI_COLORS.accentText, cssAlpha(UI_COLORS.accent, 12))}>
            <Dot color={UI_COLORS.accent} />
            {`${t("agent.connected")} · ${status.provider ?? ""}${status.model ? ` · ${status.model}` : ""}`}
          </span>
        ) : (
          <span data-testid="ai-provider-status-local" style={pill(UI_COLORS.textMuted, UI_COLORS.inputInset)}>
            <Dot color={UI_COLORS.textSubtle} />
            {t("aiProvider.missingKey")}
          </span>
        )}
      </Row>

      <ReadRow rowId="baseUrl" label={t("aiProvider.baseUrl")} value={status.baseUrl} testId="ai-provider-base-url" />
      <ReadRow rowId="model" label={t("aiProvider.model")} value={status.model} testId="ai-provider-model" />
      <ReadRow rowId="userAgent" label={t("aiProvider.userAgent")} value={status.userAgent} testId="ai-provider-user-agent" />
      <ReadRow
        rowId="apiKey"
        label={t("aiProvider.apiKey")}
        value={connected ? t("aiProvider.apiKeyConfigured") : t("aiProvider.apiKeyEmpty")}
        testId="ai-provider-api-key"
        note={t("aiProvider.keyNote")}
      />

      <Row rowId="test" title={t("aiProvider.test")} description={t("aiProvider.examples")}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <WorkbenchButton
            data-testid="ai-provider-test"
            onClick={runTest}
            disabled={testing || !connected}
            style={{ height: 30, padding: "0 12px" }}
          >
            {testing ? t("aiProvider.testing") : t("aiProvider.test")}
          </WorkbenchButton>
          {result && (
            <span
              data-testid="ai-provider-test-result"
              style={{
                fontFamily: mono,
                fontSize: 12,
                color: result.ok ? UI_COLORS.accentText : UI_COLORS.danger,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {result.ok ? t("aiProvider.testOk") : `${t("aiProvider.testFail")}${result.error ? ` · ${result.error}` : ""}`}
            </span>
          )}
        </div>
      </Row>

      <p
        data-testid="ai-provider-env-note"
        style={{ margin: "18px 0 0", fontSize: 11, lineHeight: 1.6, color: UI_COLORS.textMuted, fontFamily: mono }}
      >
        {t("aiProvider.envNote")}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 14, marginTop: 14, borderTop: `1px solid ${UI_COLORS.border}` }}>
        <p
          data-testid="ai-provider-env-edit-note"
          style={{ margin: 0, fontSize: 11, lineHeight: 1.6, color: UI_COLORS.textMuted }}
        >
          {t("aiProvider.envEditNote")}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <WorkbenchButton
            data-testid="ai-provider-copy-env-template"
            onClick={copyEnvTemplate}
            style={{ height: 30, padding: "0 12px" }}
          >
            {t("aiProvider.copyEnvTemplate")}
          </WorkbenchButton>
          {copyStatus !== "idle" && (
            <span
              data-testid="ai-provider-copy-status"
              style={{
                fontFamily: mono,
                fontSize: 11,
                color: copyStatus === "copied" ? UI_COLORS.accentText : UI_COLORS.danger,
              }}
            >
              {t(copyStatus === "copied" ? "aiProvider.copied" : "aiProvider.copyFailed")}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** A calm settings row: title + description on the left, control stacked below. */
function Row({ rowId, title, description, children }: { rowId?: string; title: string; description?: string; children: ReactNode }) {
  return (
    <div id={rowId ? `settings-row-${rowId}` : undefined} style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 16, marginTop: 16, borderTop: `1px solid ${UI_COLORS.border}` }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: UI_COLORS.textSoft }}>{title}</span>
        {description && <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>{description}</span>}
      </div>
      {children}
    </div>
  );
}

/** A read-only field row — label + mono value (+ optional note). */
function ReadRow({ rowId, label, value, testId, note }: { rowId?: string; label: string; value?: string; testId: string; note?: string }) {
  return (
    <div id={rowId ? `settings-row-${rowId}` : undefined} style={{ display: "flex", flexDirection: "column", gap: 6, paddingTop: 16, marginTop: 16, borderTop: `1px solid ${UI_COLORS.border}` }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <span style={fieldLabel}>{label}</span>
        <span
          data-testid={testId}
          style={{ fontFamily: mono, fontSize: 12, color: UI_COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}
        >
          {value || "—"}
        </span>
      </div>
      {note && <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.5 }}>{note}</span>}
    </div>
  );
}

function pill(color: string, bg: string): CSSProperties {
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

const fieldLabel: CSSProperties = {
  fontFamily: mono,
  fontSize: 10,
  fontWeight: 600,
  color: UI_COLORS.textMuted,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  flexShrink: 0,
};

function Dot({ color }: { color: string }) {
  return <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

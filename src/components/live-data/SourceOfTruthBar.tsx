import type { CSSProperties, ReactNode } from "react";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import { WorkbenchButton } from "../shared/Field";

export interface SessionPersistence {
  databaseConfigured: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  savedAt: string | null;
  session: { status: "draft" | "live" | "ended"; title: string } | null;
}

interface SourceOfTruthBarProps {
  dateKey: string;
  persistence: SessionPersistence;
  onReload: () => void;
  onStartSession: () => void;
  onEndSession: () => void;
  onOpenJson: () => void;
}

const monoLabel: CSSProperties = {
  fontFamily: "var(--app-font-mono)",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
};

/**
 * Source-of-truth bar — the one place that says where the config actually lives
 * right now. Three honest signals:
 *  - Authority: the local working draft (OverlayState) drives everything.
 *  - DB: session persistence status (or local-draft mode when no DATABASE_URL).
 *  - OBS: live-state mirrors the current state one-way. We do NOT invent a
 *    revision number we cannot read — it is a current-state indicator only.
 * Reload / Start / End keep their existing session-lifecycle behavior.
 */
export default function SourceOfTruthBar({
  dateKey,
  persistence,
  onReload,
  onStartSession,
  onEndSession,
  onOpenJson,
}: SourceOfTruthBarProps) {
  const { t } = useLocale();
  const canWrite = persistence.databaseConfigured && !persistence.loading;

  const statusLabel = persistence.session
    ? t(`liveData.status.${persistence.session.status}`)
    : t("liveData.status.local");
  const statusColor =
    persistence.session?.status === "live"
      ? UI_COLORS.accent
      : persistence.session?.status === "ended"
        ? UI_COLORS.textMuted
        : UI_COLORS.textSubtle;

  // Short chip label + the full status sentence as a tooltip — honest about
  // local-draft vs DB, never inventing a connection that is not configured.
  const db = persistence.error
    ? { value: t("sourceBar.dbError"), title: persistence.error, danger: true }
    : persistence.loading
      ? { value: t("sourceBar.dbLoading"), title: t("liveData.loading"), danger: false }
      : !persistence.databaseConfigured
        ? { value: t("sourceBar.dbLocal"), title: t("liveData.localMode"), danger: false }
        : persistence.saving
          ? { value: t("sourceBar.dbSaving"), title: t("liveData.saving"), danger: false }
          : persistence.savedAt
            ? { value: t("sourceBar.dbSaved"), title: t("liveData.saved"), danger: false }
            : { value: t("sourceBar.dbReady"), title: t("liveData.database"), danger: false };

  return (
    <section
      data-testid="live-data-session-bar"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        padding: "12px 16px 14px",
        borderBottom: `1px solid ${UI_COLORS.border}`,
        flexShrink: 0,
      }}
    >
      {/* Row 1 — title · status · date · lifecycle actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <span style={{ ...monoLabel, fontSize: 11, fontWeight: 700, color: UI_COLORS.text }}>
          {t("tab.live")}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Dot color={statusColor} />
          <span style={{ ...monoLabel, fontSize: 10, fontWeight: 600, color: statusColor }}>
            {statusLabel}
          </span>
        </span>
        <span
          style={{
            fontFamily: "var(--app-font-mono)",
            fontSize: 11,
            color: UI_COLORS.textMuted,
          }}
        >
          {`${t("liveData.date")} ${dateKey}`}
        </span>

        <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexShrink: 0 }}>
          <BarButton onClick={onReload} disabled={persistence.loading}>
            {t("liveData.reload")}
          </BarButton>
          <BarButton
            onClick={onStartSession}
            disabled={!canWrite || persistence.saving}
            tone="accent"
          >
            {t("liveData.startSession")}
          </BarButton>
          <BarButton onClick={onEndSession} disabled={!canWrite || persistence.saving}>
            {t("liveData.endSession")}
          </BarButton>
        </div>
      </div>

      {/* Row 2 — authority / DB / OBS truth chips */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          flexWrap: "wrap",
          fontSize: 11,
        }}
      >
        <Chip
          label={t("sourceBar.authority")}
          value={t("sourceBar.localDraft")}
          valueColor={UI_COLORS.text}
        />
        <Chip
          label={t("sourceBar.db")}
          value={db.value}
          valueColor={db.danger ? UI_COLORS.danger : UI_COLORS.textMuted}
          title={db.title}
        />
        <Chip
          label={t("sourceBar.obs")}
          value={t("sourceBar.obsState")}
          valueColor={UI_COLORS.textMuted}
          title={t("sourceBar.obsHint")}
          dot
        />

        <button
          data-testid="open-json-bar"
          onClick={onOpenJson}
          style={{
            marginLeft: "auto",
            appearance: "none",
            cursor: "pointer",
            borderRadius: 4,
            border: `1px solid ${UI_COLORS.controlBorder}`,
            background: "transparent",
            color: UI_COLORS.textSoft,
            fontFamily: "var(--app-font-mono)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            padding: "4px 10px",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          {t("drawer.openJson")}
          <span aria-hidden>↗</span>
        </button>
      </div>
    </section>
  );
}

function Chip({
  label,
  value,
  valueColor,
  title,
  dot,
}: {
  label: string;
  value: string;
  valueColor: string;
  title?: string;
  dot?: boolean;
}) {
  return (
    <span
      title={title}
      style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}
    >
      <span style={{ ...monoLabel, fontSize: 9, fontWeight: 600, color: UI_COLORS.textSubtle }}>
        {label}
      </span>
      {dot && <Dot color={UI_COLORS.textSubtle} />}
      <span
        style={{
          fontFamily: "var(--app-font-mono)",
          fontSize: 11,
          color: valueColor,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{ width: 5, height: 5, borderRadius: "50%", background: color, flexShrink: 0 }}
    />
  );
}

function BarButton({
  children,
  onClick,
  disabled,
  tone = "neutral",
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "neutral" | "accent";
}) {
  return (
    <WorkbenchButton
      onClick={onClick}
      disabled={disabled}
      tone={tone}
      style={{ minWidth: 82, height: 30, padding: "0 12px" }}
    >
      {children}
    </WorkbenchButton>
  );
}

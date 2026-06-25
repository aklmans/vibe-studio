import type { CSSProperties } from "react";
import { UI_COLORS, cssAlpha } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import type { TranslationKey } from "../../lib/i18n";

export type ConfigView = "prepare" | "settings";

interface SessionConfigOutlineProps {
  view: ConfigView;
  onSelectView: (view: ConfigView) => void;
  /** Switch to Settings and scroll a group into view. */
  onSelectSettingsAnchor: (anchorId: string) => void;
  /** Open the global JSON drawer. */
  onOpenJson: () => void;
}

interface SettingsAnchor {
  id: string;
  testId: string;
  labelKey: TranslationKey;
}

const SETTINGS_ANCHORS: SettingsAnchor[] = [
  { id: "config-settings-core", testId: "config-nav-core", labelKey: "settingsGroup.core" },
  { id: "config-settings-runtime", testId: "config-nav-runtime", labelKey: "settingsGroup.runtime" },
  { id: "config-settings-display", testId: "config-nav-display", labelKey: "settingsGroup.display" },
  { id: "config-settings-appearance", testId: "config-nav-appearance", labelKey: "settingsGroup.appearance" },
  { id: "config-settings-persistence", testId: "config-nav-persistence", labelKey: "settingsGroup.persistence" },
];

const groupLabel: CSSProperties = {
  fontFamily: "var(--app-font-mono)",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: UI_COLORS.textSubtle,
  padding: "0 12px",
};

/**
 * Left config outline — two primary modes only. AI Prepare ("let an agent
 * prepare my config") and Settings ("manually adjust config + runtime"). The
 * Settings group jumps to a section. JSON is NOT a third page — it is a global
 * drawer reachable from the Open JSON action here, the source bar, and both views.
 */
export default function SessionConfigOutline({
  view,
  onSelectView,
  onSelectSettingsAnchor,
  onOpenJson,
}: SessionConfigOutlineProps) {
  const { t } = useLocale();

  return (
    <aside
      data-testid="config-outline"
      style={{
        width: 200,
        minWidth: 200,
        flexShrink: 0,
        borderRight: `1px solid ${UI_COLORS.border}`,
        padding: "16px 0",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        overflowY: "auto",
      }}
    >
      <div style={groupLabel}>{t("configOutline.workspace")}</div>
      <NavRow
        testId="config-nav-prepare"
        label={t("configView.prepare")}
        active={view === "prepare"}
        onClick={() => onSelectView("prepare")}
      />
      <NavRow
        testId="config-nav-settings"
        label={t("configView.settings")}
        active={view === "settings"}
        onClick={() => onSelectView("settings")}
      />

      <div style={{ ...groupLabel, marginTop: 12 }}>{t("configView.settings")}</div>
      {SETTINGS_ANCHORS.map((anchor) => (
        <NavRow
          key={anchor.id}
          testId={anchor.testId}
          label={t(anchor.labelKey)}
          active={false}
          sub
          onClick={() => onSelectSettingsAnchor(anchor.id)}
        />
      ))}

      <div style={{ marginTop: "auto", paddingTop: 14 }}>
        <button
          data-testid="open-json-outline"
          onClick={onOpenJson}
          style={{
            appearance: "none",
            width: "calc(100% - 24px)",
            margin: "0 12px",
            cursor: "pointer",
            borderRadius: 4,
            border: `1px solid ${UI_COLORS.controlBorder}`,
            background: "transparent",
            color: UI_COLORS.textSoft,
            fontFamily: "var(--app-font-mono)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "7px 10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            transition: "color 0.12s, border-color 0.12s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = UI_COLORS.text;
            e.currentTarget.style.borderColor = cssAlpha(UI_COLORS.accent, 44);
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = UI_COLORS.textSoft;
            e.currentTarget.style.borderColor = UI_COLORS.controlBorder;
          }}
        >
          {t("drawer.openJson")}
          <span aria-hidden>↗</span>
        </button>
      </div>
    </aside>
  );
}

function NavRow({
  label,
  active,
  sub = false,
  testId,
  onClick,
}: {
  label: string;
  active: boolean;
  sub?: boolean;
  testId: string;
  onClick: () => void;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      style={{
        appearance: "none",
        textAlign: "left",
        width: "100%",
        background: active ? cssAlpha(UI_COLORS.accent, 8) : "transparent",
        border: "none",
        boxShadow: active ? `inset 2px 0 0 ${UI_COLORS.accent}` : "none",
        padding: sub ? "5px 12px 5px 22px" : "6px 12px",
        cursor: "pointer",
        fontFamily: "var(--app-font-mono)",
        fontSize: 11,
        fontWeight: active ? 700 : sub ? 500 : 600,
        letterSpacing: "0.04em",
        color: active ? UI_COLORS.text : sub ? UI_COLORS.textMuted : UI_COLORS.textSoft,
        transition: "color 0.12s, box-shadow 0.12s, background 0.12s",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.color = UI_COLORS.text;
      }}
      onMouseLeave={(e) => {
        if (!active)
          e.currentTarget.style.color = sub ? UI_COLORS.textMuted : UI_COLORS.textSoft;
      }}
    >
      {sub ? `· ${label}` : label}
    </button>
  );
}

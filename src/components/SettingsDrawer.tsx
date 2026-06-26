import { useCallback, useEffect, useRef } from "react";
import type { OverlayState } from "../types";
import { UI_COLORS } from "../lib/design-tokens";
import { useLocale } from "../hooks/useLocale";
import type { Locale } from "../lib/i18n";
import StudioAppearanceControls, {
  SettingsSelector,
  Section,
} from "./live-data/StudioAppearanceControls";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  onReset: () => void;
}

export default function SettingsDrawer({
  open,
  onClose,
  state,
  onChange,
  onReset,
}: SettingsDrawerProps) {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const { t, locale, setLocale } = useLocale();

  const closeDrawer = useCallback(() => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && drawerRef.current?.contains(active)) {
      active.blur();
    }
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeDrawer]);

  return (
    <>
      <div
        data-testid="settings-scrim"
        onClick={closeDrawer}
        style={{
          position: "fixed",
          inset: 0,
          background: UI_COLORS.overlayScrim,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.18s",
          zIndex: 60,
        }}
      />
      <aside
        ref={drawerRef}
        data-testid="settings-drawer"
        aria-hidden={!open}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 360,
          height: "100vh",
          background: UI_COLORS.appSurface,
          borderLeft: `1px solid ${UI_COLORS.border}`,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.2s ease",
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "15px 16px",
            borderBottom: `1px solid ${UI_COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--app-font-mono)",
                fontSize: 11,
                fontWeight: 600,
                color: UI_COLORS.text,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              {t("settings.title")}
            </div>
            <div style={{ fontSize: 11, color: UI_COLORS.textMuted, marginTop: 2 }}>
              {t("settings.subtitle")}
            </div>
          </div>
          <button
            data-testid="settings-close"
            onClick={closeDrawer}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: `1px solid ${UI_COLORS.border}`,
              background: "transparent",
              color: UI_COLORS.textMuted,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 15,
              transition: "color 0.12s, border-color 0.12s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = UI_COLORS.textSoft;
              (e.currentTarget as HTMLElement).style.borderColor = UI_COLORS.rule;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = UI_COLORS.textMuted;
              (e.currentTarget as HTMLElement).style.borderColor = UI_COLORS.border;
            }}
            aria-label={t("settings.closeSettings")}
          >
            ×
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <Section first title={t("language.zh") === "中文" ? "语言 / Language" : "Language / 语言"}>
            <SettingsSelector
              options={[
                { value: "zh", label: "中文", testId: "locale-zh" },
                { value: "en", label: "English", testId: "locale-en" },
              ]}
              active={locale}
              onSelect={(loc) => setLocale(loc as Locale)}
            />
          </Section>

          <StudioAppearanceControls
            state={state}
            onChange={onChange}
            onReset={() => {
              onReset();
              closeDrawer();
            }}
          />
        </div>
      </aside>
    </>
  );
}

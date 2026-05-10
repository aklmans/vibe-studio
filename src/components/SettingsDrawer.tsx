import { useEffect, useRef, useState } from "react";
import type { OverlayState } from "../types";
import { UI_COLORS } from "../lib/design-tokens";
import { produceState } from "../lib/state";
import { THEME_PRESETS, type ThemeMode } from "../lib/theme";
import { useLocale } from "../hooks/useLocale";
import type { Locale } from "../lib/i18n";
import { ColorInput } from "./shared/Field";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const updateColor = (key: keyof typeof state.colors, value: string) => {
    onChange(
      produceState(state, (draft) => {
        draft.colors[key] = value;
      }),
    );
  };

  const applyTheme = (mode: ThemeMode) => {
    onChange(
      produceState(state, (draft) => {
        draft.theme = mode;
        draft.colors = { ...THEME_PRESETS[mode] };
      }),
    );
  };

  return (
    <>
      <div
        data-testid="settings-scrim"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
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
          borderLeft: `1px solid ${UI_COLORS.panelSurface}`,
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.22s ease",
          zIndex: 70,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${UI_COLORS.panelSurface}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: UI_COLORS.text,
              }}
            >
              {t("settings.title")}
            </div>
            <div
              style={{
                fontSize: 11,
                color: UI_COLORS.textMuted,
                marginTop: 2,
              }}
            >
              {t("settings.subtitle")}
            </div>
          </div>
          <button
            data-testid="settings-close"
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: `1px solid ${UI_COLORS.controlBorder}`,
              background: "transparent",
              color: UI_COLORS.textSoft,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
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
          <Section title={t("language.zh") === "中文" ? "语言 / Language" : "Language / 语言"}>
            <div
              style={{
                display: "flex",
                gap: 4,
                background: UI_COLORS.controlSurface,
                padding: 3,
                borderRadius: 8,
                border: `1px solid ${UI_COLORS.panelSurface}`,
              }}
            >
              {(["zh", "en"] as const).map((loc) => (
                <button
                  key={loc}
                  data-testid={`locale-${loc}`}
                  onClick={() => setLocale(loc as Locale)}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    background: locale === loc ? UI_COLORS.panelSurface : "transparent",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    color: locale === loc ? UI_COLORS.text : UI_COLORS.textMuted,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {loc === "zh" ? "中文" : "English"}
                </button>
              ))}
            </div>
          </Section>

          <Section title={t("settings.theme")} hint={t("settings.themeHint")}>
            <div
              style={{
                display: "flex",
                gap: 4,
                background: UI_COLORS.controlSurface,
                padding: 3,
                borderRadius: 8,
                border: `1px solid ${UI_COLORS.panelSurface}`,
              }}
            >
              {(["neon", "editorial"] as const).map((mode) => (
                <button
                  key={mode}
                  data-testid={`theme-${mode}`}
                  onClick={() => applyTheme(mode)}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    background: state.theme === mode ? UI_COLORS.panelSurface : "transparent",
                    border: "none",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 500,
                    color: state.theme === mode ? UI_COLORS.text : UI_COLORS.textMuted,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    textTransform: "capitalize",
                    transition: "all 0.15s",
                  }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </Section>

          <Section title={t("settings.colorsSurface")}>
            <ColorInput
              label={t("color.bgDark")}
              hint={t("color.bgDarkHint")}
              value={state.colors.bgDark}
              onChange={(v) => updateColor("bgDark", v)}
              testId="color-bg-dark"
            />
            <ColorInput
              label={t("color.bgPanel")}
              hint={t("color.bgPanelHint")}
              value={state.colors.bgPanel}
              onChange={(v) => updateColor("bgPanel", v)}
              testId="color-bg-panel"
            />
            <ColorInput
              label={t("color.border")}
              hint={t("color.borderHint")}
              value={state.colors.borderColor}
              onChange={(v) => updateColor("borderColor", v)}
              testId="color-border"
            />
          </Section>

          <Section title={t("settings.colorsText")}>
            <ColorInput
              label={t("color.text")}
              hint={t("color.textHint")}
              value={state.colors.textColor}
              onChange={(v) => updateColor("textColor", v)}
              testId="color-text"
            />
            <ColorInput
              label={t("color.mutedText")}
              hint={t("color.mutedTextHint")}
              value={state.colors.mutedText}
              onChange={(v) => updateColor("mutedText", v)}
              testId="color-muted"
            />
            <ColorInput
              label={t("color.subtleText")}
              hint={t("color.subtleTextHint")}
              value={state.colors.subtleText}
              onChange={(v) => updateColor("subtleText", v)}
              testId="color-subtle"
            />
          </Section>

          <Section title={t("settings.colorsAccent")}>
            <ColorInput
              label={t("color.cyan")}
              hint={t("color.cyanHint")}
              value={state.colors.cyanAccent}
              onChange={(v) => updateColor("cyanAccent", v)}
              testId="color-cyan"
            />
            <ColorInput
              label={t("color.pink")}
              hint={t("color.pinkHint")}
              value={state.colors.pinkAccent}
              onChange={(v) => updateColor("pinkAccent", v)}
              testId="color-pink"
            />
            <ColorInput
              label={t("color.warm")}
              hint={t("color.warmHint")}
              value={state.colors.warmAccent}
              onChange={(v) => updateColor("warmAccent", v)}
              testId="color-warm"
            />
          </Section>

          <Section title={t("group.dangerZone")}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  data-testid="btn-reset"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    background: "transparent",
                    border: `1px solid ${UI_COLORS.resetBorder}`,
                    borderRadius: 7,
                    color: UI_COLORS.textMuted,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.color = UI_COLORS.text;
                    (e.target as HTMLElement).style.borderColor = UI_COLORS.subtleBorderHover;
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.color = UI_COLORS.textMuted;
                    (e.target as HTMLElement).style.borderColor = UI_COLORS.resetBorder;
                  }}
                >
                  {t("reset.button")}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("reset.title")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("reset.description")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="btn-reset-cancel">
                    {t("btn.cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    data-testid="btn-reset-confirm"
                    onClick={() => {
                      onReset();
                      onClose();
                    }}
                  >
                    {t("reset.confirm")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Section>
        </div>
      </aside>
    </>
  );
}

interface SectionProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
}

function Section({ title, hint, children }: SectionProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: UI_COLORS.focus,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        {hint && (
          <div style={{ fontSize: 10, color: UI_COLORS.textMuted, marginTop: 2 }}>
            {hint}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {children}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import type { OverlayState } from "../types";
import { UI_COLORS, cssAlpha } from "../lib/design-tokens";
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
          <Section title={t("language.zh") === "中文" ? "语言 / Language" : "Language / 语言"}>
            <Segmented
              options={[
                { value: "zh", label: "中文", testId: "locale-zh" },
                { value: "en", label: "English", testId: "locale-en" },
              ]}
              active={locale}
              onSelect={(loc) => setLocale(loc as Locale)}
            />
          </Section>

          <Section title={t("settings.theme")} hint={t("settings.themeHint")}>
            <Segmented
              options={[
                { value: "light", label: t("theme.light"), testId: "theme-light" },
                { value: "dark", label: t("theme.dark"), testId: "theme-dark" },
              ]}
              active={state.theme}
              onSelect={(mode) => applyTheme(mode as ThemeMode)}
            />
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
                    border: `1px solid ${UI_COLORS.border}`,
                    borderRadius: 6,
                    color: UI_COLORS.textMuted,
                    fontSize: 12,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "color 0.12s, border-color 0.12s",
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.color = UI_COLORS.danger;
                    (e.target as HTMLElement).style.borderColor = cssAlpha(
                      UI_COLORS.danger,
                      34,
                    );
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.color = UI_COLORS.textMuted;
                    (e.target as HTMLElement).style.borderColor = UI_COLORS.border;
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
            fontFamily: "var(--app-font-mono)",
            fontSize: 10,
            fontWeight: 600,
            color: UI_COLORS.textMuted,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        {hint && (
          <div style={{ fontSize: 10, color: UI_COLORS.textSubtle, marginTop: 3 }}>
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

interface SegmentedOption {
  value: string;
  label: string;
  testId?: string;
}

/**
 * Quiet editorial segmented control — a hairline-bordered row where the active
 * option carries a subtle warm fill instead of a filled pill. Shared by the
 * language and theme switches so they read as the same calm control.
 */
function Segmented({
  options,
  active,
  onSelect,
}: {
  options: SegmentedOption[];
  active: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        border: `1px solid ${UI_COLORS.border}`,
        borderRadius: 6,
        overflow: "hidden",
        background: UI_COLORS.controlSurface,
      }}
    >
      {options.map((opt, i) => {
        const isActive = opt.value === active;
        return (
          <button
            key={opt.value}
            data-testid={opt.testId}
            onClick={() => onSelect(opt.value)}
            style={{
              flex: 1,
              padding: "7px 0",
              background: isActive ? UI_COLORS.hoverSurface : "transparent",
              border: "none",
              borderLeft: i > 0 ? `1px solid ${UI_COLORS.border}` : "none",
              fontFamily: "var(--app-font-mono)",
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "0.04em",
              color: isActive ? UI_COLORS.text : UI_COLORS.textMuted,
              cursor: "pointer",
              transition: "color 0.12s, background 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLElement).style.color =
                  UI_COLORS.accentText;
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLElement).style.color =
                  UI_COLORS.textMuted;
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

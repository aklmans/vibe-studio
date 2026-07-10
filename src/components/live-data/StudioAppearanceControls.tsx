import type { ReactNode } from "react";
import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { produceState } from "../../lib/state";
import { THEME_PRESETS, type ThemeMode } from "../../lib/theme";
import { useLocale } from "../../hooks/useLocale";
import { WorkbenchButton } from "../shared/Field";
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
} from "../ui/alert-dialog";

interface StudioAppearanceControlsProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  onReset: () => void;
  /** Prefix to namespace the testids (the Session Config group uses "studio-"). */
  testIdPrefix?: string;
}

/**
 * The studio-level appearance controls — theme, asset palette colors and the
 * safe reset. The single home for studio appearance, rendered in the Session
 * Config "Studio Appearance" group, so there is one source of truth for the
 * logic (produceState + THEME_PRESETS) and the tokens. Visual is warm editorial.
 */
export default function StudioAppearanceControls({
  state,
  onChange,
  onReset,
  testIdPrefix = "",
}: StudioAppearanceControlsProps) {
  const { t } = useLocale();

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
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Section first title={t("settings.theme")} hint={t("settings.themeHint")}>
        <SettingsSelector
          options={[
            { value: "light", label: t("theme.light"), testId: `${testIdPrefix}theme-light` },
            { value: "dark", label: t("theme.dark"), testId: `${testIdPrefix}theme-dark` },
          ]}
          active={state.theme}
          onSelect={(mode) => applyTheme(mode as ThemeMode)}
        />
      </Section>

      <Section title={t("settings.colorsSurface")}>
        <ColorRow
          label={t("color.bgDark")}
          hint={t("color.bgDarkHint")}
          value={state.colors.bgDark}
          onChange={(v) => updateColor("bgDark", v)}
          testId={`${testIdPrefix}color-bg-dark`}
        />
        <ColorRow
          label={t("color.bgPanel")}
          hint={t("color.bgPanelHint")}
          value={state.colors.bgPanel}
          onChange={(v) => updateColor("bgPanel", v)}
          testId={`${testIdPrefix}color-bg-panel`}
        />
        <ColorRow
          label={t("color.border")}
          hint={t("color.borderHint")}
          value={state.colors.borderColor}
          onChange={(v) => updateColor("borderColor", v)}
          testId={`${testIdPrefix}color-border`}
        />
      </Section>

      <Section title={t("settings.colorsText")}>
        <ColorRow
          label={t("color.text")}
          hint={t("color.textHint")}
          value={state.colors.textColor}
          onChange={(v) => updateColor("textColor", v)}
          testId={`${testIdPrefix}color-text`}
        />
        <ColorRow
          label={t("color.mutedText")}
          hint={t("color.mutedTextHint")}
          value={state.colors.mutedText}
          onChange={(v) => updateColor("mutedText", v)}
          testId={`${testIdPrefix}color-muted`}
        />
        <ColorRow
          label={t("color.subtleText")}
          hint={t("color.subtleTextHint")}
          value={state.colors.subtleText}
          onChange={(v) => updateColor("subtleText", v)}
          testId={`${testIdPrefix}color-subtle`}
        />
      </Section>

      <Section title={t("settings.colorsAccent")}>
        <ColorRow
          label={t("color.cyan")}
          hint={t("color.cyanHint")}
          value={state.colors.cyanAccent}
          onChange={(v) => updateColor("cyanAccent", v)}
          testId={`${testIdPrefix}color-cyan`}
        />
        <ColorRow
          label={t("color.pink")}
          hint={t("color.pinkHint")}
          value={state.colors.pinkAccent}
          onChange={(v) => updateColor("pinkAccent", v)}
          testId={`${testIdPrefix}color-pink`}
        />
        <ColorRow
          label={t("color.warm")}
          hint={t("color.warmHint")}
          value={state.colors.warmAccent}
          onChange={(v) => updateColor("warmAccent", v)}
          testId={`${testIdPrefix}color-warm`}
        />
      </Section>

      <Section title={t("group.dangerZone")}>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <WorkbenchButton
              testId={`${testIdPrefix}btn-reset`}
              style={{ width: "100%", padding: "0 12px" }}
              tone="danger"
            >
              {t("reset.button")}
            </WorkbenchButton>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("reset.title")}</AlertDialogTitle>
              <AlertDialogDescription>{t("reset.description")}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid={`${testIdPrefix}btn-reset-cancel`}>
                {t("btn.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                data-testid={`${testIdPrefix}btn-reset-confirm`}
                onClick={onReset}
              >
                {t("reset.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Section>
    </div>
  );
}

interface SettingsSelectorOption<T extends string> {
  value: T;
  label: string;
  testId: string;
}

export function SettingsSelector<T extends string>({
  options,
  active,
  onSelect,
}: {
  options: SettingsSelectorOption<T>[];
  active: T;
  onSelect: (value: T) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))`,
        borderTop: `1px solid ${UI_COLORS.border}`,
        borderBottom: `1px solid ${UI_COLORS.border}`,
      }}
    >
      {options.map((option, index) => {
        const isActive = option.value === active;
        return (
          <button
            key={option.value}
            data-testid={option.testId}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(option.value)}
            style={{
              height: 38,
              border: "none",
              borderRight:
                index === options.length - 1 ? "none" : `1px solid ${UI_COLORS.border}`,
              background: "transparent",
              color: isActive ? UI_COLORS.accentText : UI_COLORS.textMuted,
              cursor: "pointer",
              fontFamily: "var(--app-font-mono)",
              fontSize: 11,
              fontWeight: isActive ? 650 : 600,
              letterSpacing: "0.08em",
              boxShadow: isActive ? `inset 0 -2px 0 ${UI_COLORS.accent}` : "none",
              transition: "color 0.12s, box-shadow 0.12s",
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
  hint,
  testId,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  testId?: string;
}) {
  return (
    <label
      title={hint}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto auto",
        alignItems: "center",
        gap: 10,
        padding: "10px 0",
        borderTop: `1px solid ${UI_COLORS.border}`,
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", color: UI_COLORS.textSoft, fontSize: 12, lineHeight: 1.25 }}>
          {label}
        </span>
        {hint && (
          <span
            style={{ display: "block", color: UI_COLORS.textMuted, fontSize: 10, lineHeight: 1.35, marginTop: 2 }}
          >
            {hint}
          </span>
        )}
      </span>
      <span
        aria-hidden
        style={{
          width: 18,
          height: 18,
          borderRadius: 2,
          background: value,
          border: `1px solid ${UI_COLORS.controlBorder}`,
        }}
      />
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          data-testid={testId}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 24,
            height: 22,
            border: `1px solid ${UI_COLORS.controlBorder}`,
            borderRadius: 2,
            padding: 1,
            background: "transparent",
            cursor: "pointer",
          }}
        />
        <span
          style={{
            minWidth: 66,
            color: UI_COLORS.textMuted,
            fontFamily: "var(--app-font-mono)",
            fontSize: 10,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          {value}
        </span>
      </span>
    </label>
  );
}

export function Section({
  title,
  hint,
  first,
  children,
}: {
  title: string;
  hint?: string;
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingTop: first ? 0 : 14,
        borderTop: first ? "none" : `1px solid ${UI_COLORS.border}`,
      }}
    >
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
          <div style={{ fontSize: 10, color: UI_COLORS.textSubtle, marginTop: 3 }}>{hint}</div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>{children}</div>
    </div>
  );
}

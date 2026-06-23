import type { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import {
  BADGE_PRESETS,
  type BadgeConfig,
  type BadgeKind,
} from "../lib/badges";
import { UI_COLORS } from "../lib/design-tokens";
import { useLocale } from "../hooks/useLocale";
import { TextInput, ToggleButton, WorkbenchSegmented } from "./shared/Field";

interface BadgesEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  testIdPrefix?: string;
}

/**
 * Editor for the agent badges shown on Cover/Poster top toolbar.
 * Each row: visibility toggle + kind picker + label input + (custom URL).
 * Used by both the Cover and Poster tabs in EditorPanel.
 */
export default function BadgesEditor({
  state,
  onChange,
  testIdPrefix = "badge",
}: BadgesEditorProps) {
  const { t } = useLocale();
  const KIND_OPTIONS: { value: BadgeKind; label: string }[] = [
    { value: "claude", label: t("badge.claude") },
    { value: "codex", label: t("badge.codex") },
    { value: "gemini", label: t("badge.gemini") },
    { value: "grok", label: t("badge.grok") },
    { value: "custom", label: t("badge.custom") },
  ];

  const updateBadge = (idx: number, patch: Partial<BadgeConfig>) => {
    const badges = state.cover.badges.map((b, i) =>
      i === idx ? { ...b, ...patch } : b,
    );
    onChange(patchSection(state, "cover", { badges }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {state.cover.badges.map((badge, idx) => {
        const presetIcon =
          badge.kind === "custom"
            ? badge.customIconUrl
            : BADGE_PRESETS[badge.kind]?.iconUrl ?? "";
        return (
          <div
            key={idx}
            style={{
              background: UI_COLORS.inputInset,
              border: `1px solid ${UI_COLORS.controlBorder}`,
              borderRadius: 6,
              padding: 10,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              opacity: badge.visible ? 1 : 0.55,
            }}
          >
            {/* Row 1: preview + visibility toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: UI_COLORS.inputInset,
                  border: `1px solid ${UI_COLORS.controlBorder}`,
                  borderRadius: 6,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {presetIcon ? (
                  <img
                    src={presetIcon}
                    alt={badge.label}
                    style={{
                      width: 18,
                      height: 18,
                      objectFit: "contain",
                      opacity: 0.9,
                    }}
                  />
                ) : (
                  <span style={{ fontSize: 10, color: UI_COLORS.textMuted }}>?</span>
                )}
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  fontWeight: 600,
                  color: UI_COLORS.textSoft,
                  letterSpacing: "0.04em",
                }}
              >
                {`${t("label.badge")} ${idx + 1}`}
              </span>
              <div style={{ width: 38, flexShrink: 0 }}>
                <ToggleButton
                  label=""
                  checked={badge.visible}
                  onChange={(visible) => updateBadge(idx, { visible })}
                  testId={`${testIdPrefix}-${idx}-visible`}
                />
              </div>
            </div>

            {/* Row 2: kind picker */}
            <WorkbenchSegmented
              active={badge.kind}
              onSelect={(value) => {
                const kind = value as BadgeKind;
                const patch: Partial<BadgeConfig> = { kind };
                if (kind !== "custom") {
                  patch.label = BADGE_PRESETS[kind].label;
                }
                updateBadge(idx, patch);
              }}
              options={KIND_OPTIONS.map((opt) => ({
                value: opt.value,
                label: opt.label,
                testId: `${testIdPrefix}-${idx}-kind-${opt.value}`,
              }))}
            />

            {/* Row 3: label input */}
            <TextInput
              testId={`${testIdPrefix}-${idx}-label`}
              value={badge.label}
              onChange={(label) => updateBadge(idx, { label })}
              placeholder={t("label.displayLabel")}
            />

            {/* Row 4: custom icon URL (only when kind === custom) */}
            {badge.kind === "custom" && (
              <TextInput
                testId={`${testIdPrefix}-${idx}-icon-url`}
                value={badge.customIconUrl}
                onChange={(customIconUrl) => updateBadge(idx, { customIconUrl })}
                placeholder={t("label.iconUrl")}
                mono
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

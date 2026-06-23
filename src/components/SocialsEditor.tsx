import type { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import {
  getSocialKindOptions,
  defaultSocialLabel,
  type SocialConfig,
  type SocialKind,
} from "../lib/socials";
import { UI_COLORS } from "../lib/design-tokens";
import { useLocale } from "../hooks/useLocale";
import { editorialPalette } from "./lib/editorial-palette";
import { TextInput, ToggleButton, WorkbenchSegmented } from "./shared/Field";

interface SocialsEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  testIdPrefix?: string;
}

/**
 * Editor for the social-link list shown in Sidebar / Overlay sidebar / Poster
 * footer. Each row: visibility toggle + kind picker + label + value (URL or
 * handle), plus a custom color field when kind === "custom".
 */
export default function SocialsEditor({
  state,
  onChange,
  testIdPrefix = "social",
}: SocialsEditorProps) {
  const { locale, t } = useLocale();
  const palette = editorialPalette(state.colors);
  const updateSocial = (idx: number, patch: Partial<SocialConfig>) => {
    const socials = state.cover.socials.map((s, i) =>
      i === idx ? { ...s, ...patch } : s,
    );
    onChange(patchSection(state, "cover", { socials }));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {state.cover.socials.map((social, idx) => (
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
            opacity: social.visible ? 1 : 0.55,
          }}
        >
          {/* Row 1: kind summary + visibility toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span
              style={{
                flex: 1,
                fontSize: 12,
                fontWeight: 600,
                color: UI_COLORS.textSoft,
                letterSpacing: "0.04em",
              }}
            >
              {social.label || `${t("label.social")} ${idx + 1}`}
            </span>
            <div style={{ width: 38, flexShrink: 0 }}>
              <ToggleButton
                label=""
                checked={social.visible}
                onChange={(visible) => updateSocial(idx, { visible })}
                testId={`${testIdPrefix}-${idx}-visible`}
              />
            </div>
          </div>

          {/* Row 2: kind picker (wraps onto two rows when narrow) */}
          <WorkbenchSegmented
            active={social.kind}
            columns={4}
            onSelect={(value) => {
              const kind = value as SocialKind;
              const patch: Partial<SocialConfig> = { kind };
              // Only refresh the label when the user is rotating between
              // presets. Keep custom labels intact when they switch *to*
              // custom from a preset.
              if (kind !== "custom") {
                patch.label = defaultSocialLabel(kind, locale);
              } else if (!social.label.trim()) {
                patch.label = t("label.custom");
              }
              updateSocial(idx, patch);
            }}
            options={getSocialKindOptions(locale).map((opt) => ({
              value: opt.value,
              label: opt.label,
              testId: `${testIdPrefix}-${idx}-kind-${opt.value}`,
            }))}
          />

          {/* Row 3: label */}
          <TextInput
            testId={`${testIdPrefix}-${idx}-label`}
            value={social.label}
            onChange={(label) => updateSocial(idx, { label })}
            placeholder={t("label.socialLabel")}
          />

          {/* Row 4: value (URL / handle / id) */}
          <TextInput
            testId={`${testIdPrefix}-${idx}-value`}
            value={social.value}
            onChange={(value) => updateSocial(idx, { value })}
            placeholder={t("label.socialValue")}
            mono
          />

          {/* Row 5: custom color (only when kind === custom) */}
          {social.kind === "custom" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingTop: 4,
              }}
            >
              <span
                style={{ flex: 1, fontSize: 11, color: UI_COLORS.accent }}
                title="Drives chip text/border/fill colors"
              >
                {t("label.customColor")}
              </span>
              <input
                data-testid={`${testIdPrefix}-${idx}-color`}
                type="color"
                value={social.customColor || palette.primaryMark}
                onChange={(e) =>
                  updateSocial(idx, { customColor: e.target.value })
                }
                style={{
                  width: 28,
                  height: 24,
                  border: `1px solid ${UI_COLORS.controlBorder}`,
                  borderRadius: 4,
                  padding: 1,
                  background: UI_COLORS.inputInset,
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: 11, color: UI_COLORS.accent, fontFamily: "monospace" }}>
                {social.customColor || "—"}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
import { TextInput, ToggleButton } from "./shared/Field";
import {
  EditorRow,
  FieldLine,
  FIELD_CONTENT_INSET,
  LineSegmented,
  RuleNote,
} from "./inspector/EditorRow";

interface SocialsEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  testIdPrefix?: string;
}

/**
 * Editor for the social-link list shown in Sidebar / Overlay sidebar / Poster
 * footer. A ruled spec-sheet list: index gutter + live label identity +
 * visibility on the right, with the kind picker and label / value (and a custom
 * colour when kind === "custom") aligned into stable columns below. No cards.
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
      <RuleNote>{t("mapping.socials")}</RuleNote>
      <div style={{ display: "flex", flexDirection: "column" }}>
      {state.cover.socials.map((social, idx) => (
        <EditorRow
          key={idx}
          index={idx + 1}
          dimmed={!social.visible}
          title={social.label || `${t("label.social")} ${idx + 1}`}
          action={
            <ToggleButton
              label=""
              checked={social.visible}
              onChange={(visible) => updateSocial(idx, { visible })}
              testId={`${testIdPrefix}-${idx}-visible`}
            />
          }
        >
          <LineSegmented
            active={social.kind}
            columns={4}
            onSelect={(value) => {
              const kind = value as SocialKind;
              const patch: Partial<SocialConfig> = { kind };
              // Only refresh the label when rotating between presets. Keep a
              // custom label intact when switching *to* custom from a preset.
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

          <FieldLine label={t("label.socialLabel")}>
            <TextInput
              testId={`${testIdPrefix}-${idx}-label`}
              value={social.label}
              onChange={(label) => updateSocial(idx, { label })}
              placeholder={t("label.socialLabel")}
            />
          </FieldLine>

          <FieldLine label={t("label.socialValue")}>
            <TextInput
              testId={`${testIdPrefix}-${idx}-value`}
              value={social.value}
              onChange={(value) => updateSocial(idx, { value })}
              placeholder={t("label.socialValue")}
              mono
            />
          </FieldLine>

          {/* Custom colour: a compact inline control aligned to the field
              column — swatch + label + hex, no boxed card. */}
          {social.kind === "custom" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingLeft: FIELD_CONTENT_INSET,
              }}
            >
              <input
                data-testid={`${testIdPrefix}-${idx}-color`}
                type="color"
                value={social.customColor || palette.primaryMark}
                onChange={(e) =>
                  updateSocial(idx, { customColor: e.target.value })
                }
                style={{
                  width: 22,
                  height: 18,
                  border: `1px solid ${UI_COLORS.controlBorder}`,
                  borderRadius: 3,
                  padding: 1,
                  background: "transparent",
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--app-font-mono)",
                  fontSize: 10,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: UI_COLORS.textMuted,
                }}
              >
                {t("label.customColor")}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  fontFamily: "var(--app-font-mono)",
                  color: UI_COLORS.textSubtle,
                }}
              >
                {social.customColor || "—"}
              </span>
            </div>
          )}
        </EditorRow>
      ))}
      </div>
    </div>
  );
}

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
            background: UI_COLORS.controlSurface,
            border: `1px solid ${UI_COLORS.panelSurface}`,
            borderRadius: 8,
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
            <button
              data-testid={`${testIdPrefix}-${idx}-visible`}
              onClick={() => updateSocial(idx, { visible: !social.visible })}
              style={{
                width: 38,
                height: 20,
                borderRadius: 10,
                border: "none",
                cursor: "pointer",
                background: social.visible ? UI_COLORS.focus : UI_COLORS.panelSurface,
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: UI_COLORS.text,
                  position: "absolute",
                  top: 3,
                  left: social.visible ? 21 : 3,
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>

          {/* Row 2: kind picker (wraps onto two rows when narrow) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 4,
              background: UI_COLORS.inputInset,
              padding: 3,
              borderRadius: 6,
              border: `1px solid ${UI_COLORS.panelSurface}`,
            }}
          >
            {getSocialKindOptions(locale).map((opt) => {
              const active = social.kind === opt.value;
              return (
                <button
                  key={opt.value}
                  data-testid={`${testIdPrefix}-${idx}-kind-${opt.value}`}
                  onClick={() => {
                    const patch: Partial<SocialConfig> = { kind: opt.value };
                    // Only refresh the label when the user is rotating between
                    // presets. Keep custom labels intact when they switch *to*
                    // custom from a preset.
                    if (opt.value !== "custom") {
                      patch.label = defaultSocialLabel(opt.value as SocialKind, locale);
                    } else if (!social.label.trim()) {
                      patch.label = t("label.custom");
                    }
                    updateSocial(idx, patch);
                  }}
                  style={{
                    padding: "5px 0",
                    background: active ? UI_COLORS.panelSurface : "transparent",
                    border: "none",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 500,
                    color: active ? UI_COLORS.text : UI_COLORS.textMuted,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    letterSpacing: "0.04em",
                    transition: "all 0.15s",
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Row 3: label */}
          <input
            data-testid={`${testIdPrefix}-${idx}-label`}
            value={social.label}
            onChange={(e) => updateSocial(idx, { label: e.target.value })}
            placeholder={t("label.socialLabel")}
            style={{
              background: UI_COLORS.inputInset,
              border: `1px solid ${UI_COLORS.controlBorder}`,
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 13,
              color: UI_COLORS.text,
              outline: "none",
              fontFamily: "inherit",
              width: "100%",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = UI_COLORS.focus)}
            onBlur={(e) => (e.target.style.borderColor = UI_COLORS.controlBorder)}
          />

          {/* Row 4: value (URL / handle / id) */}
          <input
            data-testid={`${testIdPrefix}-${idx}-value`}
            value={social.value}
            onChange={(e) => updateSocial(idx, { value: e.target.value })}
            placeholder={t("label.socialValue")}
            style={{
              background: UI_COLORS.inputInset,
              border: `1px solid ${UI_COLORS.controlBorder}`,
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 12,
              color: UI_COLORS.text,
              outline: "none",
              fontFamily: "monospace",
              width: "100%",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = UI_COLORS.focus)}
            onBlur={(e) => (e.target.style.borderColor = UI_COLORS.controlBorder)}
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
                style={{ flex: 1, fontSize: 11, color: UI_COLORS.focus }}
                title="Drives chip text/border/fill colors"
              >
                {t("label.customColor")}
              </span>
              <input
                data-testid={`${testIdPrefix}-${idx}-color`}
                type="color"
                value={social.customColor || UI_COLORS.focus}
                onChange={(e) =>
                  updateSocial(idx, { customColor: e.target.value })
                }
                style={{
                  width: 28,
                  height: 24,
                  border: `1px solid ${UI_COLORS.controlBorder}`,
                  borderRadius: 4,
                  padding: 1,
                  background: "transparent",
                  cursor: "pointer",
                }}
              />
              <span style={{ fontSize: 11, color: UI_COLORS.focus, fontFamily: "monospace" }}>
                {social.customColor || "—"}
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

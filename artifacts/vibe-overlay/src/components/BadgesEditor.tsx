import type { OverlayState } from "../types";
import {
  BADGE_PRESETS,
  type BadgeConfig,
  type BadgeKind,
} from "../lib/badges";
import { useLocale } from "../hooks/useLocale";

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
    onChange({ ...state, cover: { ...state.cover, badges } });
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
              background: "#0F1122",
              border: "1px solid #1F2235",
              borderRadius: 8,
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
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
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
                  <span style={{ fontSize: 10, color: "#6B7CA8" }}>?</span>
                )}
              </div>
              <span
                style={{
                  flex: 1,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#C7D2FE",
                  letterSpacing: "0.04em",
                }}
              >
                {`${t("label.badge")} ${idx + 1}`}
              </span>
              <button
                data-testid={`${testIdPrefix}-${idx}-visible`}
                onClick={() => updateBadge(idx, { visible: !badge.visible })}
                style={{
                  width: 38,
                  height: 20,
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  background: badge.visible ? "#8DA8FF" : "#1F2235",
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
                    background: "#F4F7FF",
                    position: "absolute",
                    top: 3,
                    left: badge.visible ? 21 : 3,
                    transition: "left 0.2s",
                  }}
                />
              </button>
            </div>

            {/* Row 2: kind picker */}
            <div
              style={{
                display: "flex",
                gap: 4,
                background: "#080A14",
                padding: 3,
                borderRadius: 6,
                border: "1px solid #1F2235",
              }}
            >
              {KIND_OPTIONS.map((opt) => {
                const active = badge.kind === opt.value;
                return (
                  <button
                    key={opt.value}
                    data-testid={`${testIdPrefix}-${idx}-kind-${opt.value}`}
                    onClick={() => {
                      const patch: Partial<BadgeConfig> = { kind: opt.value };
                      if (opt.value !== "custom") {
                        patch.label = BADGE_PRESETS[opt.value].label;
                      }
                      updateBadge(idx, patch);
                    }}
                    style={{
                      flex: 1,
                      padding: "4px 0",
                      background: active ? "#1F2235" : "transparent",
                      border: "none",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 500,
                      color: active ? "#F4F7FF" : "#6B7CA8",
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

            {/* Row 3: label input */}
            <input
              data-testid={`${testIdPrefix}-${idx}-label`}
              value={badge.label}
              onChange={(e) => updateBadge(idx, { label: e.target.value })}
              placeholder={t("label.displayLabel")}
              style={{
                background: "#080A14",
                border: "1px solid #2a3060",
                borderRadius: 6,
                padding: "6px 10px",
                fontSize: 13,
                color: "#F4F7FF",
                outline: "none",
                fontFamily: "inherit",
                width: "100%",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#8DA8FF")}
              onBlur={(e) => (e.target.style.borderColor = "#2a3060")}
            />

            {/* Row 4: custom icon URL (only when kind === custom) */}
            {badge.kind === "custom" && (
              <input
                data-testid={`${testIdPrefix}-${idx}-icon-url`}
                value={badge.customIconUrl}
                onChange={(e) =>
                  updateBadge(idx, { customIconUrl: e.target.value })
                }
                placeholder={t("label.iconUrl")}
                style={{
                  background: "#080A14",
                  border: "1px solid #2a3060",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 12,
                  color: "#F4F7FF",
                  outline: "none",
                  fontFamily: "monospace",
                  width: "100%",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#8DA8FF")}
                onBlur={(e) => (e.target.style.borderColor = "#2a3060")}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

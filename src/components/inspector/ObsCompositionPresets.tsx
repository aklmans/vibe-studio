import { useEffect, useState, type CSSProperties } from "react";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import type { CompositionState } from "../../lib/obs-composition";
import {
  addPreset,
  loadPresets,
  MAX_PRESETS,
  removePreset,
  savePresets,
  type CompositionPreset,
} from "../../lib/obs-composition-presets";
import { WorkbenchButton } from "../shared/Field";

const mono = "var(--app-font-mono)";

type Translate = ReturnType<typeof useLocale>["t"];

function sourceLabel(value: string, t: Translate): string {
  switch (value) {
    case "display-1":
      return t("composition.source.screen1");
    case "display-2":
      return t("composition.source.screen2");
    case "app":
      return t("composition.source.app");
    case "camera":
      return t("composition.source.camera");
    case "avatar":
      return t("composition.source.avatar");
    case "off":
      return t("composition.source.off");
    default:
      return value;
  }
}

/** A human, localized label for a saved composition, e.g. "Screen 1 · Camera". */
function describe(state: CompositionState, t: Translate): string {
  return `${sourceLabel(state.main, t)} · ${sourceLabel(state.camera, t)}`;
}

/**
 * Saved composition presets — studio-local (localStorage). Apply recalls a
 * whole {main, camera} in one click; Save stashes the current composition under
 * an auto-generated label. Purely a convenience layer over the same apply path.
 */
export default function ObsCompositionPresets({
  current,
  onApply,
}: {
  current: CompositionState;
  onApply: (state: CompositionState) => void;
}) {
  const { t } = useLocale();
  const [presets, setPresets] = useState<CompositionPreset[]>([]);

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  const persist = (next: CompositionPreset[]) => {
    setPresets(next);
    savePresets(next);
  };

  const saveCurrent = () => {
    if (presets.length >= MAX_PRESETS) return;
    persist(addPreset(presets, crypto.randomUUID(), describe(current, t), current));
  };

  return (
    <div
      data-testid="composition-presets"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingTop: 12,
        borderTop: `1px solid ${UI_COLORS.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span
          style={{
            fontFamily: mono,
            fontSize: 10,
            fontWeight: 600,
            color: UI_COLORS.textMuted,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {t("composition.presets")}
        </span>
        <WorkbenchButton
          data-testid="composition-save-preset"
          onClick={saveCurrent}
          disabled={presets.length >= MAX_PRESETS}
          style={{ height: 22, padding: "0 8px", flexShrink: 0 }}
        >
          {t("composition.savePreset")}
        </WorkbenchButton>
      </div>

      {presets.length === 0 ? (
        <span style={{ fontFamily: mono, fontSize: 11, color: UI_COLORS.textSubtle }}>
          {t("composition.noPresets")}
        </span>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {presets.map((preset) => (
            <span key={preset.id} data-testid="composition-preset" style={chipStyle}>
              <button
                type="button"
                data-testid={`composition-preset-apply-${preset.id}`}
                onClick={() => onApply(preset.state)}
                title={describe(preset.state, t)}
                style={applyStyle}
              >
                {preset.name}
              </button>
              <button
                type="button"
                aria-label={t("composition.deletePreset")}
                title={t("composition.deletePreset")}
                data-testid={`composition-preset-delete-${preset.id}`}
                onClick={() => persist(removePreset(presets, preset.id))}
                style={deleteStyle}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

const chipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: `1px solid ${UI_COLORS.controlBorder}`,
  borderRadius: 0,
  overflow: "hidden",
  maxWidth: "100%",
};

const applyStyle: CSSProperties = {
  appearance: "none",
  border: "none",
  background: "transparent",
  // Boxed action — speaks accent, per the button language.
  color: UI_COLORS.accentText,
  cursor: "pointer",
  fontFamily: mono,
  fontSize: 11,
  padding: "3px 8px",
  maxWidth: 150,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const deleteStyle: CSSProperties = {
  appearance: "none",
  border: "none",
  borderLeft: `1px solid ${UI_COLORS.controlBorder}`,
  background: "transparent",
  color: UI_COLORS.textMuted,
  cursor: "pointer",
  fontSize: 13,
  lineHeight: 1,
  padding: "3px 7px",
  flexShrink: 0,
};

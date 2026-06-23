import type { OverlayState } from "../types";
import { UI_COLORS } from "../lib/design-tokens";
import { patchSection } from "../lib/state";
import {
  getBottomBarKindOptions,
  defaultSlotForKind,
  type BottomBarKind,
  type BottomBarSlot,
} from "../lib/bottomBar";
import { useLocale } from "../hooks/useLocale";

interface BottomBarSegmentEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  index: number;
}

/**
 * Single-segment editor: kind picker first, then kind-specific fields.
 * Wired up so changing kind resets the slot to the default for that kind.
 */
export default function BottomBarSegmentEditor({
  state,
  onChange,
  index,
}: BottomBarSegmentEditorProps) {
  const { locale, t } = useLocale();
  const slot = state.bottomBar.segments[index];
  if (!slot) return null;

  const writeSlot = (next: BottomBarSlot) => {
    const segments = state.bottomBar.segments.map((s, i) =>
      i === index ? next : s,
    );
    onChange(patchSection(state, "bottomBar", { segments }));
  };

  const setKind = (kind: BottomBarKind) => {
    if (kind === slot.kind) return;
    writeSlot(defaultSlotForKind(kind, locale));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Kind picker */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 4,
          background: UI_COLORS.controlSurface,
          padding: 3,
          borderRadius: 6,
          border: `1px solid ${UI_COLORS.panelSurface}`,
        }}
      >
        {getBottomBarKindOptions(locale).map((opt) => {
          const active = slot.kind === opt.value;
          return (
            <button
              key={opt.value}
              data-testid={`bottom-seg${index + 1}-kind-${opt.value}`}
              onClick={() => setKind(opt.value)}
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

      {/* Kind-specific fields */}
      {slot.kind === "live" && (
        <div
          style={{
            fontSize: 11,
            color: UI_COLORS.textMuted,
            lineHeight: 1.5,
            padding: "6px 10px",
            background: UI_COLORS.controlSurface,
            border: `1px solid ${UI_COLORS.panelSurface}`,
            borderRadius: 6,
          }}
        >
          {t("segmentEditor.liveDesc")}
        </div>
      )}

      {slot.kind === "progress" && (
        <div
          style={{
            display: "flex",
            gap: 4,
            background: UI_COLORS.controlSurface,
            padding: 3,
            borderRadius: 6,
            border: `1px solid ${UI_COLORS.panelSurface}`,
          }}
        >
          {state.sidebar.sections.map((section, sIdx) => {
            const active = slot.sectionIndex === sIdx;
            return (
              <button
                key={sIdx}
                data-testid={`bottom-seg${index + 1}-progress-${sIdx}`}
                onClick={() => writeSlot({ ...slot, sectionIndex: sIdx })}
                style={{
                  flex: 1,
                  padding: "5px 0",
                  background: active ? UI_COLORS.panelSurface : "transparent",
                  border: "none",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 500,
                  color: active ? UI_COLORS.text : UI_COLORS.textMuted,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: "0.04em",
                  transition: "all 0.15s",
                }}
              >
                {section.title || `${t("label.section")} ${sIdx + 1}`}
              </button>
            );
          })}
        </div>
      )}

      {slot.kind === "stack" && (
        <div
          style={{
            fontSize: 11,
            color: UI_COLORS.textMuted,
            lineHeight: 1.5,
            padding: "6px 10px",
            background: UI_COLORS.controlSurface,
            border: `1px solid ${UI_COLORS.panelSurface}`,
            borderRadius: 6,
          }}
        >
          {t("segmentEditor.stackDesc")}
        </div>
      )}

      {slot.kind === "topic" && (
        <div
          style={{
            fontSize: 11,
            color: UI_COLORS.textMuted,
            lineHeight: 1.5,
            padding: "6px 10px",
            background: UI_COLORS.controlSurface,
            border: `1px solid ${UI_COLORS.panelSurface}`,
            borderRadius: 6,
          }}
        >
          {t("segmentEditor.mirrorDesc")}
        </div>
      )}

      {slot.kind === "text" && (
        <>
          <PlainInput
            label={t("segmentEditor.title")}
            value={slot.title}
            onChange={(v) => writeSlot({ ...slot, title: v })}
            testId={`bottom-seg${index + 1}-title`}
          />
          <PlainInput
            label={t("segmentEditor.text")}
            value={slot.text}
            onChange={(v) => writeSlot({ ...slot, text: v })}
            testId={`bottom-seg${index + 1}-text`}
          />
        </>
      )}
    </div>
  );
}

interface PlainInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  testId?: string;
}

function PlainInput({ label, value, onChange, testId }: PlainInputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: UI_COLORS.textSoft,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      <input
        data-testid={testId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: UI_COLORS.controlSurface,
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
        onFocus={(e) => (e.target.style.borderColor = UI_COLORS.accent)}
        onBlur={(e) => (e.target.style.borderColor = UI_COLORS.controlBorder)}
      />
    </div>
  );
}

import type { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import {
  getBottomBarKindOptions,
  defaultSlotForKind,
  type BottomBarKind,
  type BottomBarSlot,
} from "../lib/bottomBar";
import { useLocale } from "../hooks/useLocale";
import {
  TextInput,
  WorkbenchLabel,
  WorkbenchSegmented,
  workbenchNoteStyle,
} from "./shared/Field";

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
      <WorkbenchSegmented
        active={slot.kind}
        onSelect={(value) => setKind(value as BottomBarKind)}
        options={getBottomBarKindOptions(locale).map((opt) => ({
          value: opt.value,
          label: opt.label,
          testId: `bottom-seg${index + 1}-kind-${opt.value}`,
        }))}
      />

      {/* Kind-specific fields */}
      {slot.kind === "live" && (
        <div style={workbenchNoteStyle}>
          {t("segmentEditor.liveDesc")}
        </div>
      )}

      {slot.kind === "progress" && (
        <WorkbenchSegmented
          active={String(slot.sectionIndex)}
          onSelect={(value) => writeSlot({ ...slot, sectionIndex: Number(value) })}
          options={state.sidebar.sections.map((section, sIdx) => ({
            value: String(sIdx),
            label: section.title || `${t("label.section")} ${sIdx + 1}`,
            testId: `bottom-seg${index + 1}-progress-${sIdx}`,
          }))}
        />
      )}

      {slot.kind === "stack" && (
        <div style={workbenchNoteStyle}>
          {t("segmentEditor.stackDesc")}
        </div>
      )}

      {slot.kind === "topic" && (
        <div style={workbenchNoteStyle}>
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
      <WorkbenchLabel>{label}</WorkbenchLabel>
      <TextInput
        testId={testId}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

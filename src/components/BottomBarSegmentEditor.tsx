import type { OverlayState } from "../types";
import {
  activeBarSegments,
  getBottomBarKindOptions,
  defaultSlotForKind,
  withActiveBarSegments,
  type BottomBarKind,
  type BottomBarSlot,
} from "../lib/bottomBar";
import { useLocale } from "../hooks/useLocale";
import {
  TextInput,
  WorkbenchLabel,
} from "./shared/Field";
import { LineSegmented, RuleNote } from "./inspector/EditorRow";
import SectionChips from "./inspector/SectionChips";
import { activeAgenda } from "../lib/agenda";

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
  // Edits the ACTIVE layout's bar profile — each layout owns its own bar.
  const segments = activeBarSegments(state);
  const slot = segments[index];
  if (!slot) return null;

  const writeSlot = (next: BottomBarSlot) => {
    onChange(
      withActiveBarSegments(
        state,
        segments.map((s, i) => (i === index ? next : s)),
      ),
    );
  };

  const setKind = (kind: BottomBarKind) => {
    if (kind === slot.kind) return;
    writeSlot(defaultSlotForKind(kind, locale));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Kind picker */}
      <LineSegmented
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
        <RuleNote>
          {t("segmentEditor.liveDesc")}
        </RuleNote>
      )}

      {slot.kind === "progress" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <SectionChips
            sections={activeAgenda(state).sections}
            active={slot.sectionIndex}
            onSelect={(sIdx) => writeSlot({ ...slot, sectionIndex: sIdx })}
            testIdPrefix={`bottom-seg${index + 1}-progress`}
          />
          <RuleNote>
            {String(slot.sectionIndex + 1).padStart(2, "0")} ·{" "}
            {activeAgenda(state).sections[slot.sectionIndex]?.title || "—"}
          </RuleNote>
        </div>
      )}

      {slot.kind === "stack" && (
        <RuleNote>
          {t("mapping.bottomStack")}
        </RuleNote>
      )}

      {slot.kind === "topic" && (
        <RuleNote>
          {t("mapping.bottomTopic")}
        </RuleNote>
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

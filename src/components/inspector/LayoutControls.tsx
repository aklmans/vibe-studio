import type { OverlayState } from "../../types";
import { LAYOUT_IDS, type LayoutId } from "../../lib/overlay-layout";
import type { TranslationKey } from "../../lib/i18n";
import { useLocale } from "../../hooks/useLocale";
import { LineSegmented } from "./EditorRow";

const LAYOUT_LABEL: Record<LayoutId, TranslationKey> = {
  workbench: "layout.workbench",
  "lecture-left": "layout.lectureLeft",
  "lecture-right": "layout.lectureRight",
  mobile: "layout.mobile",
};

/**
 * Picks the scene layout: which regions and panels exist, and where. The
 * composition controls below then fill each region with a source.
 *
 * Studio-level presentation — it drives OBS and is never part of the v1 config,
 * so the AI agent cannot set it.
 */
export default function LayoutControls({
  state,
  onChange,
}: {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}) {
  const { t } = useLocale();
  return (
    <LineSegmented
      testId="layout-picker"
      active={state.layout}
      onSelect={(value) => {
        // Each layout reads its OWN bar profile, so switching layouts never
        // rewrites anyone's segments — just which set is active.
        onChange({ ...state, layout: value as LayoutId });
      }}
      options={LAYOUT_IDS.map((id) => ({
        value: id,
        label: t(LAYOUT_LABEL[id]),
        testId: `layout-${id}`,
      }))}
    />
  );
}

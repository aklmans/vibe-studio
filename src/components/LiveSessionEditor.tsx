import type { OverlayState } from "../types";
import { formatStartLabel } from "../lib/bottomBar";
import { UI_COLORS } from "../lib/design-tokens";
import { patchSection } from "../lib/state";
import { useLocale } from "../hooks/useLocale";
import { TextInput, WorkbenchButton } from "./shared/Field";

interface LiveSessionEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

/**
 * Convert an ISO datetime string to the YYYY-MM-DDTHH:mm format that
 * <input type="datetime-local"> expects, using the user's local timezone.
 */
function isoToLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Editor for state.liveSession.startedAt. Stores values as ISO strings so
 * stateStorage round-trips them; surfaces a datetime-local input plus a
 * "Start Now" shortcut and a Clear button.
 */
export default function LiveSessionEditor({
  state,
  onChange,
}: LiveSessionEditorProps) {
  const { t } = useLocale();
  const { startedAt } = state.liveSession;
  const ready = Boolean(startedAt) && !Number.isNaN(new Date(startedAt).getTime());

  const writeStart = (value: string) => {
    onChange(patchSection(state, "liveSession", { startedAt: value }));
  };

  const handleLocalChange = (v: string) => {
    if (!v) {
      writeStart("");
      return;
    }
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) {
      writeStart(d.toISOString());
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <TextInput
        testId="live-started-at"
        type="datetime-local"
        value={isoToLocalInput(startedAt)}
        onChange={handleLocalChange}
        style={{ colorScheme: state.theme }}
      />

      <div style={{ display: "flex", gap: 6 }}>
        <WorkbenchButton
          testId="live-start-now"
          onClick={() => writeStart(new Date().toISOString())}
          accentColor={UI_COLORS.sectionAccent}
          tone="accent"
          style={{ flex: 1, padding: "0 10px" }}
        >
          {t("btn.startNow")}
        </WorkbenchButton>
        {ready && (
          <WorkbenchButton
            testId="live-clear"
            onClick={() => writeStart("")}
            tone="danger"
            style={{ padding: "0 10px" }}
          >
            {t("btn.clear")}
          </WorkbenchButton>
        )}
      </div>

      <div style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.5 }}>
        {ready
          ? `${t("live.started")} · ${formatStartLabel(startedAt)}`
          : t("live.notSet")}
      </div>
    </div>
  );
}

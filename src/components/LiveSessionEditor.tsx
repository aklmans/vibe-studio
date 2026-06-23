import type { OverlayState } from "../types";
import { formatStartLabel } from "../lib/bottomBar";
import { UI_BORDERS, UI_COLORS, cssAlpha } from "../lib/design-tokens";
import { patchSection } from "../lib/state";
import { useLocale } from "../hooks/useLocale";

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

  const handleLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
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
      <input
        data-testid="live-started-at"
        type="datetime-local"
        value={isoToLocalInput(startedAt)}
        onChange={handleLocalChange}
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
          colorScheme: state.theme,
        }}
        onFocus={(e) => (e.target.style.borderColor = UI_COLORS.accent)}
        onBlur={(e) => (e.target.style.borderColor = UI_COLORS.controlBorder)}
      />

      <div style={{ display: "flex", gap: 6 }}>
        <button
          data-testid="live-start-now"
          onClick={() => writeStart(new Date().toISOString())}
          style={{
            flex: 1,
            padding: "7px 10px",
            background: cssAlpha(UI_COLORS.sectionAccent, 10),
            border: `1px solid ${cssAlpha(UI_COLORS.sectionAccent, 28)}`,
            borderRadius: 7,
            color: UI_COLORS.sectionAccent,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "center",
            letterSpacing: "0.04em",
          }}
        >
          {t("btn.startNow")}
        </button>
        {ready && (
          <button
            data-testid="live-clear"
            onClick={() => writeStart("")}
            style={{
              padding: "7px 10px",
              background: cssAlpha(UI_COLORS.danger, 8),
              border: UI_BORDERS.danger,
              borderRadius: 7,
              color: UI_COLORS.danger,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
{t("btn.clear")}
          </button>
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

import type { OverlayState } from "../types";
import { formatStartLabel } from "../lib/bottomBar";
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
    onChange({ ...state, liveSession: { ...state.liveSession, startedAt: value } });
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
          background: "#0F1122",
          border: "1px solid #2a3060",
          borderRadius: 6,
          padding: "6px 10px",
          fontSize: 13,
          color: "#F4F7FF",
          outline: "none",
          fontFamily: "inherit",
          width: "100%",
          boxSizing: "border-box",
          colorScheme: "dark",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#8DA8FF")}
        onBlur={(e) => (e.target.style.borderColor = "#2a3060")}
      />

      <div style={{ display: "flex", gap: 6 }}>
        <button
          data-testid="live-start-now"
          onClick={() => writeStart(new Date().toISOString())}
          style={{
            flex: 1,
            padding: "7px 10px",
            background: "#7DD3FC18",
            border: "1px solid #7DD3FC40",
            borderRadius: 7,
            color: "#7DD3FC",
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
              background: "#FF6FAE12",
              border: "1px solid #FF6FAE30",
              borderRadius: 7,
              color: "#FF6FAE",
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

      <div style={{ fontSize: 11, color: "#6B7CA8", lineHeight: 1.5 }}>
        {ready
          ? `${t("live.started")} · ${formatStartLabel(startedAt)}`
          : t("live.notSet")}
      </div>
    </div>
  );
}

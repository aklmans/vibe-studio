import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import { patchSection } from "../../lib/state";
import { SECOND_SCREEN_SOURCE } from "../../lib/live-prepare";
import {
  canSwap,
  CAPTURE_SOURCE_NAME,
  DEFAULT_COMPOSITION,
  normalizeComposition,
  swapRegions,
  type CameraSource,
  type CompositionState,
  type MainSource,
} from "../../lib/obs-composition";
import {
  applyObsComposition,
  fetchObsCompositionStatus,
} from "../../lib/obs-composition-client";
import { getLayout } from "../../lib/overlay-layout";
import { WorkbenchButton } from "../shared/Field";
import ObsCompositionPresets from "./ObsCompositionPresets";

const mono = "var(--app-font-mono)";
const CAMERA_SLOT_SOURCE = CAPTURE_SOURCE_NAME.camera;

type ConnectionState = "checking" | "connected" | "disconnected";

interface ObsCompositionControlsProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

/**
 * Per-region composition controls — local/private Studio only (the parent hides
 * this in demo, and the route 404s on the public showcase). Each region (main
 * 16:9 frame, camera cutout) picks a source; a display can't sit in both. The
 * overlay content keeps flowing through live-state; this panel only routes the
 * OBS captures underneath, over obs-websocket.
 */
export default function ObsCompositionControls({
  state,
  onChange,
}: ObsCompositionControlsProps) {
  const { t } = useLocale();
  const [composition, setComposition] = useState<CompositionState>(DEFAULT_COMPOSITION);
  const [connection, setConnection] = useState<ConnectionState>("checking");
  const [reason, setReason] = useState<string | null>(null);
  const [missingSources, setMissingSources] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layoutId = state.layout;
  // A layout without a camera region (mobile) never talks to OBS from here: the
  // vertical video comes from the phone app. The component stays mounted so the
  // layout history still tracks — switching workbench → mobile → lecture must
  // re-park the sources on arrival exactly like workbench → lecture does.
  const obsCapable = Boolean(getLayout(layoutId).regions.camera);
  // Only the latest probe may write state: rapid layout switches (or Retry) can
  // resolve out of order, and an apply supersedes any in-flight probe.
  const probeSeq = useRef(0);
  const refreshStatus = useCallback(() => {
    const seq = ++probeSeq.current;
    setConnection("checking");
    void fetchObsCompositionStatus(layoutId).then((status) => {
      if (seq !== probeSeq.current) return;
      setConnection(status.connected ? "connected" : "disconnected");
      setReason(status.reason ?? null);
      setMissingSources(status.missingSources ?? []);
      if (status.current) setComposition(status.current);
    });
  }, [layoutId]);

  // The notice's auto-dismiss must survive layout changes; unmount-only cleanup.
  useEffect(() => {
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, []);

  const showNotice = (kind: "ok" | "error", text: string) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ kind, text });
    noticeTimer.current = setTimeout(() => {
      setNotice(null);
      noticeTimer.current = null;
    }, 3000);
  };

  const apply = useCallback(
    (next: CompositionState) => {
      if (applying) return;
      probeSeq.current++;
      const previous = composition;
      setComposition(next);
      setApplying(true);
      // The camera slot renders inside the overlay's camera panel: "off" wants
      // the focus card (cameraVisible=false), any content wants the panel on.
      const cameraVisible = next.camera !== "off";
      if (state.mainScreen.cameraVisible !== cameraVisible) {
        onChange(patchSection(state, "mainScreen", { cameraVisible }));
      }
      void applyObsComposition(next, layoutId)
        .then((result) => {
          if (result.ok) {
            if (result.missingSources) setMissingSources(result.missingSources);
            showNotice("ok", t("composition.applied"));
            return;
          }
          setComposition(previous);
          if (result.missingRequired?.length) {
            showNotice("error", `${t("composition.missingSource")}${result.missingRequired.join(", ")}`);
          } else if (result.connected === false) {
            setConnection("disconnected");
            setReason(result.reason ?? null);
            showNotice("error", t("composition.applyFailed"));
          } else {
            showNotice(
              "error",
              result.error ? `${t("composition.applyFailed")} · ${result.error}` : t("composition.applyFailed"),
            );
          }
        })
        .finally(() => setApplying(false));
    },
    [applying, composition, onChange, state, t],
  );

  // Mount: probe OBS to reflect reality. Layout change: the sources are still
  // parked on the OLD layout's rects, so probing against the new rects would
  // misinfer the regions and silently overwrite the user's composition —
  // instead, re-APPLY the current composition so the captures move to the new
  // slots (the layout "drives the OBS slots", as the picker hint promises).
  // When OBS isn't connected (or an apply is mid-flight) fall back to a probe.
  const prevLayoutRef = useRef<typeof layoutId | null>(null);
  useEffect(() => {
    const prev = prevLayoutRef.current;
    if (prev === layoutId) return; // refired for other dep changes — not a layout change
    prevLayoutRef.current = layoutId;
    if (!obsCapable) return; // inert layout: no probe, no apply — just record it
    if (prev !== null && connection === "connected" && !applying) {
      apply(composition);
    } else {
      refreshStatus();
    }
  }, [layoutId, obsCapable, connection, applying, composition, apply, refreshStatus]);

  const selectMain = (main: MainSource) =>
    apply(normalizeComposition({ ...composition, main }, "main"));
  const selectCamera = (camera: CameraSource) =>
    apply(normalizeComposition({ ...composition, camera }, "camera"));

  const sourceMissing = useCallback(
    (source: string) => missingSources.includes(source),
    [missingSources],
  );

  const mainOptions = useMemo(
    (): RegionOption<MainSource>[] => [
      { value: "display-1", label: t("composition.source.screen1"), disabled: sourceMissing(CAPTURE_SOURCE_NAME["display-1"]) },
      { value: "display-2", label: t("composition.source.screen2"), disabled: sourceMissing(CAPTURE_SOURCE_NAME["display-2"]) },
      { value: "app", label: t("composition.source.app"), disabled: sourceMissing(CAPTURE_SOURCE_NAME.app) },
    ],
    [sourceMissing, t],
  );

  const cameraOptions = useMemo(
    (): RegionOption<CameraSource>[] => [
      {
        value: "display-1",
        label: t("composition.source.screen1"),
        disabled: sourceMissing(CAPTURE_SOURCE_NAME["display-1"]) || composition.main === "display-1",
      },
      {
        value: "display-2",
        label: t("composition.source.screen2"),
        disabled: sourceMissing(CAPTURE_SOURCE_NAME["display-2"]) || composition.main === "display-2",
      },
      { value: "camera", label: t("composition.source.camera"), disabled: sourceMissing(CAMERA_SLOT_SOURCE) },
      { value: "avatar", label: t("composition.source.avatar"), disabled: false },
      { value: "off", label: t("composition.source.off"), disabled: false },
    ],
    [composition.main, sourceMissing, t],
  );

  if (!obsCapable) {
    return (
      <p
        data-testid="obs-composition-inert"
        style={{
          margin: 0,
          fontFamily: mono,
          fontSize: 11,
          lineHeight: 1.6,
          color: UI_COLORS.textMuted,
        }}
      >
        {t("composition.notForLayout")}
      </p>
    );
  }

  const layoutCanvas = getLayout(layoutId).canvas;
  const portrait = layoutCanvas.height > layoutCanvas.width;

  const controlsActive = connection === "connected";
  const statusText =
    connection === "checking"
      ? t("composition.status.checking")
      : connection === "connected"
        ? applying
          ? t("composition.applying")
          : t("composition.status.connected")
        : reason === "config"
          ? t("composition.status.config")
          : reason === "unreachable"
            ? t("composition.status.unreachable")
            : t("composition.status.error");

  return (
    <div data-testid="obs-composition" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        data-testid="obs-composition-status"
        style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 22 }}
      >
        <span
          aria-hidden
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            flexShrink: 0,
            background: connection === "connected" ? UI_COLORS.success : UI_COLORS.textSubtle,
          }}
        />
        <span
          style={{
            fontFamily: mono,
            fontSize: 11,
            lineHeight: 1.4,
            color: connection === "connected" ? UI_COLORS.textSoft : UI_COLORS.textMuted,
            minWidth: 0,
          }}
        >
          {statusText}
        </span>
        {connection === "disconnected" && (
          <WorkbenchButton
            data-testid="obs-composition-retry"
            onClick={refreshStatus}
            style={{ height: 22, padding: "0 8px", marginLeft: "auto", flexShrink: 0 }}
          >
            {t("composition.retry")}
          </WorkbenchButton>
        )}
      </div>

      {portrait && (
        <p
          data-testid="obs-composition-portrait-hint"
          style={{
            margin: 0,
            fontFamily: mono,
            fontSize: 10,
            lineHeight: 1.5,
            color: UI_COLORS.textMuted,
          }}
        >
          {t("composition.portraitCanvasHint")}
        </p>
      )}

      <div
        aria-disabled={!controlsActive}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          ...(controlsActive ? {} : { opacity: 0.45, pointerEvents: "none" }),
        }}
      >
        <RegionSelect
          label={t("composition.mainLabel")}
          testId="composition-main"
          options={mainOptions}
          value={composition.main}
          onSelect={selectMain}
          columns={3}
        />
        <RegionSelect
          label={t("composition.cameraLabel")}
          testId="composition-camera"
          options={cameraOptions}
          value={composition.camera}
          onSelect={selectCamera}
          columns={3}
        />

        <WorkbenchButton
          data-testid="composition-swap"
          onClick={() => apply(swapRegions(composition))}
          disabled={!canSwap(composition)}
          style={{ height: 30, justifyContent: "center" }}
        >
          ⇄ {t("composition.swap")}
        </WorkbenchButton>
      </div>

      {controlsActive && missingSources.includes(SECOND_SCREEN_SOURCE) && (
        <p
          data-testid="obs-composition-second-screen-hint"
          style={{ margin: 0, fontSize: 11, lineHeight: 1.55, color: UI_COLORS.textMuted }}
        >
          {t("composition.secondScreenHint")}
        </p>
      )}

      {notice && (
        <span
          data-testid="obs-composition-notice"
          style={{
            fontFamily: mono,
            fontSize: 11,
            lineHeight: 1.4,
            color: notice.kind === "ok" ? UI_COLORS.accentText : UI_COLORS.danger,
          }}
        >
          {notice.text}
        </span>
      )}

      {controlsActive && (
        <ObsCompositionPresets current={composition} onApply={apply} />
      )}
    </div>
  );
}

interface RegionOption<T extends string> {
  value: T;
  label: string;
  disabled: boolean;
}

/** A labeled grid of option buttons: active = accent underline, disabled dimmed. */
function RegionSelect<T extends string>({
  label,
  testId,
  options,
  value,
  onSelect,
  columns,
}: {
  label: string;
  testId: string;
  options: RegionOption<T>[];
  value: T;
  onSelect: (value: T) => void;
  columns: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
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
        {label}
      </span>
      <div
        data-testid={testId}
        style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, gap: 4 }}
      >
        {options.map((option) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              data-testid={`${testId}-${option.value}`}
              data-selected={active || undefined}
              disabled={option.disabled}
              onClick={() => onSelect(option.value)}
              style={optionStyle(active, option.disabled)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function optionStyle(active: boolean, disabled: boolean): CSSProperties {
  return {
    appearance: "none",
    minHeight: 28,
    padding: "0 6px",
    borderRadius: 4,
    border: `1px solid ${active ? UI_COLORS.accent : UI_COLORS.controlBorder}`,
    background: active ? UI_COLORS.hoverSurface : "transparent",
    color: disabled ? UI_COLORS.textSubtle : active ? UI_COLORS.text : UI_COLORS.textSoft,
    fontFamily: mono,
    fontSize: 11,
    fontWeight: active ? 600 : 500,
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.4 : 1,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    transition: "color 120ms ease, border-color 120ms ease",
  };
}

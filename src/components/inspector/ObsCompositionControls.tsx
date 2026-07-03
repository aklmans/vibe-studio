import { useCallback, useEffect, useRef, useState } from "react";
import type { OverlayState } from "../../types";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import { patchSection } from "../../lib/state";
import { SECOND_SCREEN_SOURCE } from "../../lib/live-prepare";
import {
  canSwapLayout,
  DEFAULT_COMPOSITION,
  type CameraSlotChoice,
  type CompositionLayout,
  type CompositionState,
} from "../../lib/obs-composition";
import {
  applyObsComposition,
  fetchObsCompositionStatus,
} from "../../lib/obs-composition-client";
import { WorkbenchButton, WorkbenchLabel } from "../shared/Field";
import { LineSegmented } from "./EditorRow";

const mono = "var(--app-font-mono)";

interface ObsCompositionControlsProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

type ConnectionState = "checking" | "connected" | "disconnected";

/**
 * Camera-slot composition controls — local/private Studio only (the parent
 * hides this in demo mode, and the route 404s on the public showcase).
 *
 * Selecting a slot content or layout sends the FULL desired state to
 * /api/obs/composition, which drives the operator's local OBS over
 * obs-websocket: webcam / second screen in the camera cutout, avatar theme via
 * the frame browser sources, and a main⇄slot swap. Optimistic UI, reverted
 * when OBS refuses. The overlay content itself keeps flowing through
 * live-state; this panel only manages the captures underneath.
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

  const refreshStatus = useCallback(() => {
    setConnection("checking");
    void fetchObsCompositionStatus().then((status) => {
      setConnection(status.connected ? "connected" : "disconnected");
      setReason(status.reason ?? null);
      setMissingSources(status.missingSources ?? []);
      if (status.current) setComposition(status.current);
    });
  }, []);

  useEffect(() => {
    refreshStatus();
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [refreshStatus]);

  const showNotice = (kind: "ok" | "error", text: string) => {
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setNotice({ kind, text });
    noticeTimer.current = setTimeout(() => {
      setNotice(null);
      noticeTimer.current = null;
    }, 3000);
  };

  const apply = (next: CompositionState) => {
    if (applying) return;
    const previous = composition;
    setComposition(next);
    setApplying(true);
    // The slot content renders inside the overlay's camera panel — turn the
    // panel on so the selection is actually visible in the broadcast frame.
    if (!state.mainScreen.cameraVisible) {
      onChange(patchSection(state, "mainScreen", { cameraVisible: true }));
    }
    void applyObsComposition(next)
      .then((result) => {
        if (result.ok) {
          if (result.missingSources) setMissingSources(result.missingSources);
          showNotice("ok", t("composition.applied"));
          return;
        }
        setComposition(previous);
        if (result.missingRequired?.length) {
          showNotice(
            "error",
            `${t("composition.missingSource")}${result.missingRequired.join(", ")}`,
          );
        } else if (result.connected === false) {
          setConnection("disconnected");
          setReason(result.reason ?? null);
          showNotice("error", t("composition.applyFailed"));
        } else {
          showNotice(
            "error",
            result.error
              ? `${t("composition.applyFailed")} · ${result.error}`
              : t("composition.applyFailed"),
          );
        }
      })
      .finally(() => setApplying(false));
  };

  const selectChoice = (choice: CameraSlotChoice) =>
    apply({
      cameraSlot: choice,
      layout: canSwapLayout(choice) ? composition.layout : "standard",
    });

  const selectLayout = (layout: CompositionLayout) =>
    apply({ ...composition, layout });

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

  const controlsActive = connection === "connected";

  return (
    <div
      data-testid="obs-composition"
      style={{ display: "flex", flexDirection: "column", gap: 12 }}
    >
      {/* Status line — mono metadata with a semantic dot, no pill chrome. */}
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
            background:
              connection === "connected" ? UI_COLORS.success : UI_COLORS.textSubtle,
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

      <div
        style={
          controlsActive
            ? { display: "flex", flexDirection: "column", gap: 12 }
            : {
                display: "flex",
                flexDirection: "column",
                gap: 12,
                opacity: 0.45,
                pointerEvents: "none",
              }
        }
        aria-disabled={!controlsActive}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <WorkbenchLabel>{t("composition.slotLabel")}</WorkbenchLabel>
          <LineSegmented
            testId="composition-slot"
            active={composition.cameraSlot}
            onSelect={(value) => selectChoice(value as CameraSlotChoice)}
            options={[
              { value: "camera", label: t("composition.choice.camera"), testId: "composition-slot-camera" },
              { value: "second-screen", label: t("composition.choice.secondScreen"), testId: "composition-slot-second-screen" },
              { value: "avatar", label: t("composition.choice.avatar"), testId: "composition-slot-avatar" },
            ]}
          />
        </div>

        {canSwapLayout(composition.cameraSlot) && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <WorkbenchLabel>{t("composition.layoutLabel")}</WorkbenchLabel>
            <LineSegmented
              testId="composition-layout"
              active={composition.layout}
              onSelect={(value) => selectLayout(value as CompositionLayout)}
              options={[
                { value: "standard", label: t("composition.layout.standard"), testId: "composition-layout-standard" },
                { value: "swapped", label: t("composition.layout.swapped"), testId: "composition-layout-swapped" },
              ]}
            />
          </div>
        )}
      </div>

      {controlsActive && missingSources.includes(SECOND_SCREEN_SOURCE) && (
        <p
          data-testid="obs-composition-second-screen-hint"
          style={{
            margin: 0,
            fontSize: 11,
            lineHeight: 1.55,
            color: UI_COLORS.textMuted,
          }}
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
    </div>
  );
}

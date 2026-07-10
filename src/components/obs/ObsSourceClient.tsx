"use client";

import { useEffect, useState } from "react";
import { DEFAULT_STATE_BY_LOCALE } from "../../types";
import OverlayCanvas from "../OverlayCanvas";
import SidebarPanel from "../SidebarPanel";
import BottomBarPanel from "../BottomBarPanel";
import { LocaleProvider } from "../../hooks/useLocale";
import {
  normalizeLiveStatePayload,
  type LiveStateSnapshot,
} from "../../lib/live-state";
import type { ObsCameraMode } from "../../lib/obs-camera";
import { OBS_SOURCES, type ObsSource } from "../../lib/obs-sources";
import { getLayout } from "../../lib/overlay-layout";

function parseLiveSnapshot(
  payload: string,
  fallback: LiveStateSnapshot,
): LiveStateSnapshot {
  try {
    return normalizeLiveStatePayload(JSON.parse(payload), fallback);
  } catch {
    return fallback;
  }
}

function renderSource(
  source: ObsSource,
  snapshot: LiveStateSnapshot,
  cameraMode: ObsCameraMode,
) {
  switch (source) {
    case "overlay":
      return <OverlayCanvas state={snapshot.state} cameraMode={cameraMode} />;
    case "sidebar":
      return <SidebarPanel state={snapshot.state} />;
    case "bottom-bar":
      return <BottomBarPanel state={snapshot.state} />;
  }
}

export default function ObsSourceClient({
  source,
  cameraMode = "avatar",
}: {
  source: ObsSource;
  cameraMode?: ObsCameraMode;
}) {
  const [snapshot, setSnapshot] = useState<LiveStateSnapshot>(() =>
    normalizeLiveStatePayload({
      locale: "zh",
      state: DEFAULT_STATE_BY_LOCALE.zh,
    }),
  );
  // The full overlay is layout-sized (portrait on mobile) and follows the
  // pushed state; sidebar / bottom-bar stay fixed workbench-slice sizes.
  const dimensions =
    source === "overlay" ? getLayout(snapshot.state.layout).canvas : OBS_SOURCES[source];

  useEffect(() => {
    document.documentElement.dataset.obsSource = source;
    return () => {
      delete document.documentElement.dataset.obsSource;
    };
  }, [source]);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/live-state")
      .then((response) => response.text())
      .then((payload) => {
        if (!cancelled) {
          setSnapshot((current) => parseLiveSnapshot(payload, current));
        }
      })
      .catch(() => {
        // Keep rendering the current snapshot if the initial request fails.
      });

    const events = new EventSource("/api/live-state/stream");
    events.onmessage = (event) => {
      setSnapshot((current) => parseLiveSnapshot(event.data, current));
    };

    return () => {
      cancelled = true;
      events.close();
    };
  }, []);

  return (
    <LocaleProvider initialLocale={snapshot.locale} persist={false}>
      <div
        data-testid={`obs-source-${source}`}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          background: "transparent",
          overflow: "hidden",
        }}
      >
        {renderSource(source, snapshot, cameraMode)}
      </div>
    </LocaleProvider>
  );
}

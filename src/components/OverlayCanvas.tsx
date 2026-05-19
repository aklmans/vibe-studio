import { forwardRef, useId } from "react";
import { OverlayState } from "../types";
import { avatarPlaceholder } from "../lib/avatar";
import { UI_COLORS } from "../lib/design-tokens";
import { useLocale } from "../hooks/useLocale";
import SidebarSections from "./SidebarSections";
import SocialList from "./SocialList";
import BottomBarSegments from "./BottomBarSegments";
import { getObsCameraFrameColors, type ObsCameraMode } from "../lib/obs-camera";

interface OverlayCanvasProps {
  state: OverlayState;
  onChange?: (state: OverlayState) => void;
  sidebarRef?: React.RefObject<HTMLDivElement | null>;
  bottomBarRef?: React.RefObject<HTMLDivElement | null>;
  cameraMode?: ObsCameraMode;
}

const AVATAR_PLACEHOLDER = avatarPlaceholder("rgba(255,255,255,0.9)", "VC", 68);
const OBS_CAMERA_SLOT = {
  left: 1498,
  top: 786,
  width: 400,
  height: 272,
} as const;
const CAMERA_PANEL_SLOT = {
  left: 1496,
  top: 756,
  width: 400,
  height: 300,
} as const;
const OVERLAY_EDGE = 24;
const MAIN_SCREEN_SLOT = {
  left: OVERLAY_EDGE,
  top: OVERLAY_EDGE,
  width: 1448,
  height: Math.round(1448 / (3760 / 2078)),
} as const;
const BOTTOM_BAR_SLOT = {
  left: OVERLAY_EDGE,
  top: MAIN_SCREEN_SLOT.top + MAIN_SCREEN_SLOT.height + OVERLAY_EDGE,
  width: MAIN_SCREEN_SLOT.width,
  height: 1080 - (MAIN_SCREEN_SLOT.top + MAIN_SCREEN_SLOT.height + OVERLAY_EDGE) - OVERLAY_EDGE,
} as const;

function pickIncompleteBullet(
  bullets: string[],
  doneRow: boolean[] | undefined,
  startIndex = 0,
): { text: string; index: number } | null {
  for (let i = Math.max(0, startIndex); i < bullets.length; i++) {
    if (!doneRow?.[i] && bullets[i]?.trim()) {
      return { text: bullets[i], index: i };
    }
  }
  return null;
}

function getCurrentFocus(state: OverlayState): {
  title: string;
  sectionTitle: string;
  current: string;
  next: string;
} {
  const { sidebar, cover } = state;
  const activeIndex = Math.min(
    Math.max(0, sidebar.activeSection),
    Math.max(0, sidebar.sections.length - 1),
  );
  const activeSection = sidebar.sections[activeIndex] ?? sidebar.sections[0];
  const activeDone = sidebar.sectionsDone[activeIndex];
  const current =
    activeSection
      ? pickIncompleteBullet(activeSection.bullets, activeDone) ??
        (activeSection.bullets[0]
          ? { text: activeSection.bullets[0], index: 0 }
          : null)
      : null;

  let next =
    activeSection && current
      ? pickIncompleteBullet(activeSection.bullets, activeDone, current.index + 1)
      : null;

  if (!next) {
    for (let i = activeIndex + 1; i < sidebar.sections.length; i++) {
      next = pickIncompleteBullet(
        sidebar.sections[i].bullets,
        sidebar.sectionsDone[i],
      );
      if (next) break;
    }
  }

  return {
    title: cover.todayTopic.trim() || cover.title,
    sectionTitle: activeSection?.title || cover.todayLabel || "Focus",
    current: current?.text || cover.title,
    next: next?.text || cover.hookText || cover.title,
  };
}

function cameraSlotCutoutPath(): string {
  const right = OBS_CAMERA_SLOT.left + OBS_CAMERA_SLOT.width;
  const bottom = OBS_CAMERA_SLOT.top + OBS_CAMERA_SLOT.height;
  return `M0 0H1920V1080H0Z M${OBS_CAMERA_SLOT.left} ${OBS_CAMERA_SLOT.top}H${right}V${bottom}H${OBS_CAMERA_SLOT.left}Z`;
}

const OverlayCanvas = forwardRef<HTMLDivElement, OverlayCanvasProps>(
  ({ state, onChange, sidebarRef, bottomBarRef, cameraMode = "avatar" }, ref) => {
    const dotPatternId = useId().replaceAll(":", "");
    const { t } = useLocale();
    const { sidebar, bottomBar, mainScreen, cover, colors } = state;
    const {
      bgDark,
      bgPanel,
      borderColor,
      textColor,
      mutedText,
      cyanAccent,
      pinkAccent,
      warmAccent,
    } = colors;

    const avatarSrc = cover.avatarUrl || AVATAR_PLACEHOLDER;
    const hasVisibleSocial = cover.socials.some(
      (s) => s.visible && s.value.trim().length > 0,
    );
    const hasSocial = sidebar.socialVisible && hasVisibleSocial;
    const showCameraAvatar = cameraMode === "avatar";
    const cameraFrameColors = getObsCameraFrameColors(cameraMode);
    const hasTransparentCameraSlot = cameraMode === "empty" && mainScreen.cameraVisible;
    const cutoutPath = cameraSlotCutoutPath();
    const currentFocus = getCurrentFocus(state);

    return (
      <div
        ref={ref}
        data-testid="overlay-canvas"
        style={{
          width: 1920,
          height: 1080,
          position: "relative",
          background: hasTransparentCameraSlot ? "transparent" : `${bgDark}`,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {hasTransparentCameraSlot && (
          <svg
            aria-hidden="true"
            width="1920"
            height="1080"
            viewBox="0 0 1920 1080"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
            }}
          >
            <defs>
              <pattern id={dotPatternId} width="32" height="32" patternUnits="userSpaceOnUse">
                <circle cx="0" cy="0" r="1" fill={`${borderColor}18`} />
              </pattern>
            </defs>
            <path d={cutoutPath} fill={bgDark} fillRule="evenodd" />
            <path d={cutoutPath} fill={`url(#${dotPatternId})`} fillRule="evenodd" />
          </svg>
        )}

        {!hasTransparentCameraSlot && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(circle, ${borderColor}18 1px, transparent 1px)`,
              backgroundSize: "32px 32px",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Subtle top gradient */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 120% 60% at 50% 0%, ${bgPanel}80 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />

        {/* Main Screen Placeholder */}
        {mainScreen.visible && (
          <div
            style={{
              position: "absolute",
              left: MAIN_SCREEN_SLOT.left,
              top: MAIN_SCREEN_SLOT.top,
              width: MAIN_SCREEN_SLOT.width,
              height: MAIN_SCREEN_SLOT.height,
              background: UI_COLORS.appBackground,
              border: `2px solid ${borderColor}50`,
              borderRadius: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Main screen capture titlebar intentionally hidden.
                The captured app already has its own chrome, so the preview area
                gets the full frame height here. */}

            {/* Main content area — large idle watermark */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  fontSize: 120,
                  fontWeight: 700,
                  color: mutedText,
                  opacity: 0.05,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  userSelect: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {t("canvas.idleBrand")}
              </div>
            </div>
          </div>
        )}

        {/* Camera Frame — macOS style, bottom-right column (below sidebar) */}
        {mainScreen.cameraVisible && (
          <div
            style={{
              position: "absolute",
              left: CAMERA_PANEL_SLOT.left,
              top: CAMERA_PANEL_SLOT.top,
              width: CAMERA_PANEL_SLOT.width,
              height: CAMERA_PANEL_SLOT.height,
              background: cameraFrameColors.shellBackground,
              border: `2px solid ${borderColor}55`,
              borderRadius: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${bgPanel}`,
            }}
          >
            {/* Camera titlebar */}
            <div
              style={{
                height: 28,
                background: `${bgPanel}EE`,
                borderBottom: `1px solid ${borderColor}25`,
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: UI_COLORS.macRed, opacity: 0.7 }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: UI_COLORS.macYellow, opacity: 0.7 }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: UI_COLORS.macGreen, opacity: 0.7 }} />
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 10,
                  color: `${mutedText}50`,
                  letterSpacing: "0.06em",
                }}
              >
                {t("canvas.camera")}
              </div>
            </div>

            {/* Camera content — avatar placeholder or transparent OBS video slot */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: cameraFrameColors.stageBackground,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {showCameraAvatar && (
                <>
                  <img
                    src={avatarSrc}
                    alt={t("canvas.camera")}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  {/* Subtle vignette */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "radial-gradient(ellipse 90% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.4) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                  {/* Live indicator */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      background: "rgba(0,0,0,0.55)",
                      borderRadius: 4,
                      padding: "2px 7px",
                    }}
                  >
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: UI_COLORS.macRed,
                        boxShadow: `0 0 4px ${UI_COLORS.macRed}`,
                      }}
                    />
                    <span style={{ fontSize: 9, color: UI_COLORS.white, fontWeight: 600, letterSpacing: "0.08em" }}>{t("canvas.liveBadge")}</span>
                  </div>
                </>
              )}
              {!showCameraAvatar && (
                <div
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                  }}
                />
              )}
            </div>
          </div>
        )}

        {!mainScreen.cameraVisible && (
          <div
            data-testid="overlay-current-focus"
            style={{
              position: "absolute",
              left: CAMERA_PANEL_SLOT.left,
              top: CAMERA_PANEL_SLOT.top,
              width: CAMERA_PANEL_SLOT.width,
              height: CAMERA_PANEL_SLOT.height,
              background: `${bgPanel}F0`,
              border: `2px solid ${borderColor}45`,
              borderRadius: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${bgPanel}`,
            }}
          >
            <div
              style={{
                height: 3,
                background: `linear-gradient(90deg, ${cyanAccent}80 0%, ${borderColor}60 50%, ${warmAccent}55 100%)`,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                padding: "24px 26px",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: cyanAccent,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 12,
                    borderRadius: 2,
                    background: cyanAccent,
                    boxShadow: `0 0 8px ${cyanAccent}80`,
                    flexShrink: 0,
                  }}
                />
                {t("canvas.currentFocus")}
              </div>

              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: textColor,
                  lineHeight: 1.22,
                  letterSpacing: "0.01em",
                  marginBottom: 18,
                }}
              >
                {currentFocus.title}
              </div>

              <div
                style={{
                  borderTop: `1px solid ${borderColor}24`,
                  paddingTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  minHeight: 0,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.11em",
                      textTransform: "uppercase",
                      color: pinkAccent,
                      marginBottom: 6,
                    }}
                  >
                    {currentFocus.sectionTitle}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      color: textColor,
                      lineHeight: 1.35,
                    }}
                  >
                    {currentFocus.current}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.11em",
                      textTransform: "uppercase",
                      color: warmAccent,
                      marginBottom: 6,
                    }}
                  >
                    {t("canvas.currentFocusNext")}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: `${textColor}CC`,
                      lineHeight: 1.4,
                    }}
                  >
                    {currentFocus.next}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Sidebar */}
        {sidebar.visible && (
          <div
            ref={sidebarRef}
            data-testid="overlay-sidebar"
            style={{
              position: "absolute",
              left: 1496,
              top: 24,
              width: 400,
              height: 708,
              background: `${bgPanel}F0`,
              border: `2px solid ${borderColor}45`,
              borderRadius: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Sidebar header accent */}
            <div
              style={{
                height: 3,
                background: `linear-gradient(90deg, ${cyanAccent}80 0%, ${borderColor}60 50%, ${pinkAccent}40 100%)`,
                flexShrink: 0,
              }}
            />

            {/* Sections — flex so they fill available space above social footer */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <SidebarSections state={state} />
            </div>

            {/* Social footer */}
            {hasSocial && (
              <div
                style={{
                  borderTop: `1px solid ${borderColor}25`,
                  padding: "14px 24px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  flexShrink: 0,
                  background: `${bgDark}60`,
                }}
              >
                {/* Social section title — same style as section headings */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: pinkAccent,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <div style={{ width: 3, height: 10, borderRadius: 2, background: pinkAccent, flexShrink: 0 }} />
                  {t("canvas.followMe")}
                </div>
                <SocialList state={state} size="small" editable={!!onChange} onChange={onChange} />
              </div>
            )}
          </div>
        )}

        {/* Bottom Status Bar */}
        {bottomBar.visible && (
          <div
            ref={bottomBarRef}
            data-testid="overlay-bottom-bar"
            style={{
              position: "absolute",
              left: BOTTOM_BAR_SLOT.left,
              top: BOTTOM_BAR_SLOT.top,
              width: BOTTOM_BAR_SLOT.width,
              height: BOTTOM_BAR_SLOT.height,
              background: `${bgPanel}F0`,
              border: `2px solid ${borderColor}45`,
              borderRadius: 0,
              display: "flex",
              overflow: "hidden",
            }}
          >
            <BottomBarSegments state={state} size="small" />
          </div>
        )}

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, transparent 0%, ${cyanAccent}30 30%, ${borderColor}50 50%, ${pinkAccent}20 80%, transparent 100%)`,
          }}
        />
      </div>
    );
  }
);

OverlayCanvas.displayName = "OverlayCanvas";
export default OverlayCanvas;

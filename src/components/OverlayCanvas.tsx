import { forwardRef, useId } from "react";
import { OverlayState } from "../types";
import { avatarPlaceholder } from "../lib/avatar";
import { fontFamilies, clampLines } from "../lib/typography";
import { useLocale } from "../hooks/useLocale";
import SidebarSections from "./SidebarSections";
import SocialList from "./SocialList";
import BottomBarSegments from "./BottomBarSegments";
import { getObsCameraFrameColors, type ObsCameraMode } from "../lib/obs-camera";
import { getLayout, type OverlayLayout, type Rect } from "../lib/overlay-layout";
import OverlayHeader from "./OverlayHeader";
import PresenterIntro from "./PresenterIntro";
import { editorialPalette } from "./lib/editorial-palette";

interface OverlayCanvasProps {
  state: OverlayState;
  onChange?: (state: OverlayState) => void;
  sidebarRef?: React.RefObject<HTMLDivElement | null>;
  bottomBarRef?: React.RefObject<HTMLDivElement | null>;
  cameraMode?: ObsCameraMode;
  /** Override the layout; by default it follows `state.layout`. */
  layout?: OverlayLayout;
}

const AVATAR_PLACEHOLDER = avatarPlaceholder("rgba(255,255,255,0.9)", "VC", 68);

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

function slotCutoutPath(slot: Rect): string {
  const right = slot.left + slot.width;
  const bottom = slot.top + slot.height;
  return `M${slot.left} ${slot.top}H${right}V${bottom}H${slot.left}Z`;
}

function overlayBackdropPath(
  layout: OverlayLayout,
  {
    mainScreenVisible,
    transparentCameraSlot,
  }: {
    mainScreenVisible: boolean;
    transparentCameraSlot: boolean;
  },
): string {
  const { width, height } = layout.canvas;
  const cutouts = [
    mainScreenVisible ? slotCutoutPath(layout.regions.main) : null,
    transparentCameraSlot && layout.regions.camera
      ? slotCutoutPath(layout.regions.camera)
      : null,
  ].filter(Boolean);

  return `M0 0H${width}V${height}H0Z${cutouts.length > 0 ? ` ${cutouts.join(" ")}` : ""}`;
}

const OverlayCanvas = forwardRef<HTMLDivElement, OverlayCanvasProps>(
  (
    {
      state,
      onChange,
      sidebarRef,
      bottomBarRef,
      cameraMode = "avatar",
      layout: layoutProp,
    },
    ref,
  ) => {
    const dotPatternId = useId().replaceAll(":", "");
    const { t } = useLocale();
    const { sidebar, bottomBar, mainScreen, cover, colors } = state;
    // The OBS browser source renders this same component from pushed state, so
    // following state.layout is what carries the layout through to OBS.
    const layout = layoutProp ?? getLayout(state.layout);
    // A layout may omit a panel entirely; absent rect = the layout has no such panel.
    const mainRect = layout.regions.main;
    const cameraPanelRect = layout.panels.cameraPanel;
    const sidebarRect = layout.panels.sidebar;
    const bottomBarRect = layout.panels.bottomBar;
    const headerRect = layout.panels.header;
    const introRect = layout.panels.intro;
    const {
      bgDark,
      bgPanel,
      textColor,
      mutedText,
      subtleText,
    } = colors;
    const E = editorialPalette(colors);

    const avatarSrc = cover.avatarUrl || AVATAR_PLACEHOLDER;
    const hasVisibleSocial = cover.socials.some(
      (s) => s.visible && s.value.trim().length > 0,
    );
    const hasSocial = sidebar.socialVisible && hasVisibleSocial;
    const showCameraAvatar = cameraMode === "avatar";
    const cameraFrameColors = getObsCameraFrameColors(cameraMode);
    const hasTransparentCameraSlot = cameraMode === "empty" && mainScreen.cameraVisible;
    const backdropPath = overlayBackdropPath(layout, {
      mainScreenVisible: mainScreen.visible,
      transparentCameraSlot: hasTransparentCameraSlot,
    });
    const currentFocus = getCurrentFocus(state);

    return (
      <div
        ref={ref}
        data-testid="overlay-canvas"
        style={{
          width: layout.canvas.width,
          height: layout.canvas.height,
          position: "relative",
          background: "transparent",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <svg
          aria-hidden="true"
          data-testid="overlay-backdrop"
          width={layout.canvas.width}
          height={layout.canvas.height}
          viewBox={`0 0 ${layout.canvas.width} ${layout.canvas.height}`}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
        >
          <defs>
            <pattern id={dotPatternId} width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="0" cy="0" r="1" fill={E.lineSoft} />
            </pattern>
          </defs>
          <path d={backdropPath} fill={bgDark} fillRule="evenodd" />
          <path d={backdropPath} fill={`url(#${dotPatternId})`} fillRule="evenodd" />
        </svg>

        {/* Lecture header band — brand logo + the recurring programme name. */}
        {headerRect && <OverlayHeader state={state} rect={headerRect} />}

        {/* Lecture presenter card — this stream's title + who is speaking. */}
        {introRect && <PresenterIntro state={state} rect={introRect} />}

        {/* Main screen OBS frame: only the UI frame is rendered here.
            The actual display/window capture should sit underneath this source in OBS. */}
        {mainScreen.visible && (
          <div
            data-testid="overlay-main-screen-frame"
            style={{
              position: "absolute",
              left: mainRect.left,
              top: mainRect.top,
              width: mainRect.width,
              height: mainRect.height,
              background: "transparent",
              border: `2px solid ${E.lineStrong}`,
              borderRadius: 0,
              boxShadow: `inset 0 0 0 1px ${E.lineSoft}`,
              overflow: "hidden",
              pointerEvents: "none",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 72,
                height: 3,
                background: E.activeRule,
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          </div>
        )}

        {/* Camera Frame — macOS style, bottom-right column (below sidebar) */}
        {mainScreen.cameraVisible && cameraPanelRect && (
          <div
            style={{
              position: "absolute",
              left: cameraPanelRect.left,
              top: cameraPanelRect.top,
              width: cameraPanelRect.width,
              height: cameraPanelRect.height,
              background: cameraFrameColors.shellBackground,
              border: `2px solid ${E.lineStrong}`,
              borderRadius: 0,
              boxShadow: `inset 0 0 0 1px ${E.lineSoft}, 0 10px 26px rgba(0,0,0,0.38)`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Camera titlebar */}
            <div
              style={{
                height: 28,
                background: `${bgPanel}EE`,
                borderBottom: `1px solid ${E.lineSoft}`,
                display: "flex",
                alignItems: "center",
                padding: "0 10px",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FF5F57", opacity: 0.55 }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#FEBC2E", opacity: 0.55 }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28C840", opacity: 0.55 }} />
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontFamily: fontFamilies.mono,
                  fontSize: 9,
                  color: subtleText,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
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
                      background: "rgba(0,0,0,0.52)",
                      border: `1px solid ${E.line}`,
                      borderRadius: 4,
                      padding: "2px 7px",
                    }}
                  >
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#E62117",
                      }}
                    />
                    <span style={{ fontFamily: fontFamilies.mono, fontSize: 9, color: "#fff", fontWeight: 600, letterSpacing: "0.12em" }}>{t("canvas.liveBadge")}</span>
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

        {!mainScreen.cameraVisible && cameraPanelRect && (
          <div
            data-testid="overlay-current-focus"
            style={{
              position: "absolute",
              left: cameraPanelRect.left,
              top: cameraPanelRect.top,
              width: cameraPanelRect.width,
              height: cameraPanelRect.height,
              background: `${bgPanel}F0`,
              border: `1px solid ${E.lineStrong}`,
              borderRadius: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: `0 10px 26px rgba(0,0,0,0.34)`,
            }}
          >
            <div
              style={{
                height: 3,
                width: 72,
                background: E.activeRule,
                flexShrink: 0,
              }}
            />
            <div
              style={{
                padding: "24px 26px 22px",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                flex: 1,
              }}
            >
              <div
                style={{
                  fontFamily: fontFamilies.mono,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: subtleText,
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 2,
                    height: 14,
                    background: E.activeRule,
                    flexShrink: 0,
                  }}
                />
                {t("canvas.currentFocus")}
              </div>

              <div
                style={{
                  ...clampLines(2),
                  fontFamily: fontFamilies.serif,
                  fontSize: 27,
                  fontWeight: 650,
                  color: textColor,
                  lineHeight: 1.2,
                  marginBottom: 16,
                }}
              >
                {currentFocus.title}
              </div>

              <div
                style={{
                  borderTop: `1px solid ${E.line}`,
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
                      ...clampLines(1),
                      fontFamily: fontFamilies.mono,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: E.activeRule,
                      marginBottom: 7,
                    }}
                  >
                    {currentFocus.sectionTitle}
                  </div>
                  <div
                    style={{
                      ...clampLines(3),
                      fontSize: 20,
                      fontWeight: 700,
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
                      fontFamily: fontFamilies.mono,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: subtleText,
                      marginBottom: 7,
                    }}
                  >
                    {t("canvas.currentFocusNext")}
                  </div>
                  <div
                    style={{
                      ...clampLines(2),
                      fontSize: 14,
                      fontWeight: 500,
                      color: mutedText,
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
        {sidebar.visible && sidebarRect && (
          <div
            ref={sidebarRef}
            data-testid="overlay-sidebar"
            style={{
              position: "absolute",
              left: sidebarRect.left,
              top: sidebarRect.top,
              width: sidebarRect.width,
              height: sidebarRect.height,
              background: `${bgPanel}F0`,
              border: `2px solid ${E.lineStrong}`,
              borderRadius: 0,
              boxShadow: `inset 0 0 0 1px ${E.lineSoft}`,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Sidebar header accent — single quiet mark */}
            <div
              style={{
                height: 3,
                width: 72,
                background: E.activeRule,
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
                data-testid="overlay-social-info"
                style={{
                  borderTop: `2px solid ${E.lineStrong}`,
                  boxShadow: `inset 0 1px 0 ${E.lineSoft}`,
                  padding: "14px 24px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  flexShrink: 0,
                  background: `${bgDark}78`,
                }}
              >
                {/* Social section title — quiet mono label */}
                <div
                  style={{
                    fontFamily: fontFamilies.mono,
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: mutedText,
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    marginBottom: 2,
                  }}
                >
                  <div style={{ width: 2, height: 12, background: E.activeRule, flexShrink: 0 }} />
                  {t("canvas.followMe")}
                </div>
                <SocialList state={state} size="small" editable={!!onChange} onChange={onChange} />
              </div>
            )}
          </div>
        )}

        {/* Bottom Status Bar */}
        {bottomBar.visible && bottomBarRect && (
          <div
            ref={bottomBarRef}
            data-testid="overlay-bottom-bar"
            style={{
              position: "absolute",
              left: bottomBarRect.left,
              top: bottomBarRect.top,
              width: bottomBarRect.width,
              height: bottomBarRect.height,
              background: `${bgPanel}F0`,
              border: `1px solid ${E.line}`,
              borderTop: `2px solid ${E.lineStrong}`,
              borderRadius: 0,
              display: "flex",
              overflow: "hidden",
            }}
          >
            <BottomBarSegments state={state} size="small" />
          </div>
        )}
      </div>
    );
  }
);

OverlayCanvas.displayName = "OverlayCanvas";
export default OverlayCanvas;

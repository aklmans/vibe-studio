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
              left: 24,
              top: 24,
              width: 1448,
              height: 846,
              background: UI_COLORS.appBackground,
              border: `2px solid ${borderColor}50`,
              borderRadius: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* macOS-style titlebar */}
            <div
              style={{
                height: 36,
                background: `${bgPanel}CC`,
                borderBottom: `1px solid ${borderColor}30`,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: UI_COLORS.macRed, opacity: 0.7 }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: UI_COLORS.macYellow, opacity: 0.7 }} />
                <div style={{ width: 11, height: 11, borderRadius: "50%", background: UI_COLORS.macGreen, opacity: 0.7 }} />
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 12,
                  color: `${mutedText}60`,
                  letterSpacing: "0.02em",
                }}
              >
                {t("canvas.screenCapture")}
              </div>
              {/* LIVE pill — always visible while overlay is on air */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  background: UI_COLORS.live,
                  borderRadius: 999,
                  padding: "0 10px",
                  height: 20,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.95)",
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: UI_COLORS.white,
                    letterSpacing: "0.12em",
                  }}
                >
                  {t("canvas.liveBadge")}
                </span>
              </div>
            </div>

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
              left: 1496,
              top: 756,
              width: 400,
              height: 300,
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
              left: 24,
              top: 894,
              width: 1448,
              height: 162,
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

import { forwardRef } from "react";
import { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import { fontFamilies, wrapProse, wrapAnywhere } from "../lib/typography";
import { COVER_CANVAS_DIMENSIONS } from "../lib/canvas-dimensions";
import { editorialPalette } from "./lib/editorial-palette";
import { avatarPlaceholder } from "../lib/avatar";
import EditableText from "./edit/EditableText";
import BadgeToolbar from "./shared/BadgeToolbar";

// The default cover is a theme-aware typographic surface driven by
// editorialPalette(state.colors): warm paper + near-black ink in Light, warm
// black + warm light ink in Dark — the same editorial system as Poster /
// Wallpaper. The legacy Bilibili photo template still ships at
// /public/cover-bg.png and could return later as an opt-in background preset,
// but it is no longer the default export surface.

const AVATAR_PLACEHOLDER = avatarPlaceholder("rgba(245,245,242,0.5)", "VC", 56);

interface CoverCanvasProps {
  state: OverlayState;
  /** When true (preview mode), text fields can be double-clicked to edit. */
  editable?: boolean;
  onChange?: (next: OverlayState) => void;
}

const CoverCanvas = forwardRef<HTMLDivElement, CoverCanvasProps>(
  ({ state, editable = false, onChange }, ref) => {
    const { cover } = state;
    const E = editorialPalette(state.colors);
    const readonly = !editable || !onChange;
    const avatarSrc = cover.avatarUrl || AVATAR_PLACEHOLDER;

    const writeCover = (patch: Partial<OverlayState["cover"]>) => {
      if (!onChange) return;
      onChange(patchSection(state, "cover", patch));
    };

    const writeBadgeLabel = (originalIdx: number, label: string) => {
      if (!onChange) return;
      const badges = state.cover.badges.map((b, i) =>
        i === originalIdx ? { ...b, label } : b,
      );
      onChange(patchSection(state, "cover", { badges }));
    };

    return (
      <div
        ref={ref}
        data-testid="cover-canvas"
        style={{
          width: COVER_CANVAS_DIMENSIONS.width,
          height: COVER_CANVAS_DIMENSIONS.height,
          position: "relative",
          background: E.bg1,
          fontFamily: fontFamilies.sans,
          overflow: "hidden",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 112px",
          boxSizing: "border-box",
        }}
      >
        {cover.avatarVisible && (
          <div
            data-testid="cover-avatar-lockup"
            aria-hidden="true"
            style={{
              position: "absolute",
              left: -140,
              bottom: -200,
              width: 1560,
              height: 880,
              overflow: "visible",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <img
              data-testid="cover-avatar-image"
              src={avatarSrc}
              alt=""
              style={{
                display: "block",
                width: "auto",
                height: "100%",
                maxWidth: "none",
                objectFit: "contain",
                objectPosition: "left bottom",
              }}
            />
          </div>
        )}

        <div
          data-testid="cover-identity-lockup"
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            justifyContent: cover.avatarVisible ? "flex-end" : "center",
            width: "100%",
            maxWidth: cover.avatarVisible ? 1056 : 1000,
          }}
        >
          {/* Editorial title stack — eyebrow → serif title → rule → subtitle. */}
          <div
            data-testid="cover-title-stage"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              maxWidth: cover.avatarVisible ? 560 : 1000,
              minWidth: 0,
            }}
          >
            {cover.todayLabel && (
              <EditableText
                readonly={readonly}
                value={cover.todayLabel}
                onCommit={(v) => writeCover({ todayLabel: v })}
                as="div"
                ariaLabel="Cover eyebrow"
                style={{
                  fontFamily: fontFamilies.mono,
                  fontSize: 15,
                  fontWeight: 500,
                  color: E.accent,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  marginBottom: 20,
                }}
              />
            )}
            <EditableText
              readonly={readonly}
              value={cover.title}
              onCommit={(v) => writeCover({ title: v })}
              as="h1"
              ariaLabel="Cover title"
              style={{
                fontFamily: fontFamilies.serif,
                fontSize: 74,
                fontWeight: 600,
                color: E.text,
                letterSpacing: "-0.01em",
                lineHeight: 1.04,
                margin: 0,
                maxWidth: cover.avatarVisible ? 560 : 1000,
                whiteSpace: "normal",
                ...wrapProse,
              }}
            />
            <div
              style={{
                width: 72,
                height: 2,
                background: E.accent,
                marginTop: 28,
              }}
            />
            <EditableText
              readonly={readonly}
              value={cover.todayTopic}
              onCommit={(v) => writeCover({ todayTopic: v })}
              as="div"
              ariaLabel="Cover subtitle"
              style={{
                ...wrapProse,
                marginTop: 26,
                maxWidth: cover.avatarVisible ? 540 : 820,
                fontFamily: fontFamilies.serif,
                fontSize: 30,
                fontWeight: 500,
                color: E.muted,
                lineHeight: 1.32,
                letterSpacing: 0,
              }}
            />
            {cover.hookVisible && cover.hookText && (
              <EditableText
                readonly={readonly}
                value={cover.hookText}
                onCommit={(v) => writeCover({ hookText: v })}
                as="div"
                ariaLabel="Hook text"
                style={{
                  ...wrapAnywhere,
                  marginTop: 16,
                  fontFamily: fontFamilies.mono,
                  fontSize: 15,
                  fontWeight: 500,
                  color: E.subtle,
                  lineHeight: 1.4,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              />
            )}
            <BadgeToolbar
              badges={cover.badges}
              readonly={readonly}
              onBadgeLabelChange={writeBadgeLabel}
              labelColor={E.muted}
              background="transparent"
              border={`1px solid ${E.line}`}
              borderRadius={3}
              paddingY={8}
              paddingX={14}
              outerGap={14}
              itemGap={9}
              iconSize={22}
              iconOpacity={0.9}
              labelFontSize={16}
              separatorFontSize={13}
              separatorColor={E.subtle}
              style={{ marginTop: 34 }}
            />
          </div>
        </div>
      </div>
    );
  },
);

CoverCanvas.displayName = "CoverCanvas";
export default CoverCanvas;

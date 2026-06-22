import { forwardRef } from "react";
import { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import { fontFamilies, wrapAnywhere, wrapProse } from "../lib/typography";
import { COVER_CANVAS_DIMENSIONS } from "../lib/canvas-dimensions";
import { editorialPalette } from "./lib/editorial-palette";
import EditableText from "./edit/EditableText";
import BadgeToolbar from "./shared/BadgeToolbar";

// The cover sits on a fixed dark portrait photo, so its display text stays warm
// light in both themes for legibility; the accent marks track the active theme.
const COVER_INK = "#f7f3ec";
const COVER_INK_SOFT = "#e7dccd";

interface CoverCanvasProps {
  state: OverlayState;
  /** When true (preview mode), text fields can be double-clicked to edit. */
  editable?: boolean;
  onChange?: (next: OverlayState) => void;
}

const COVER_BACKGROUND_URL = "/cover-bg.png";

const CoverCanvas = forwardRef<HTMLDivElement, CoverCanvasProps>(
  ({ state, editable = false, onChange }, ref) => {
    const { cover } = state;
    const E = editorialPalette(state.colors);
    const readonly = !editable || !onChange;

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
          backgroundColor: "#15120e",
          fontFamily: fontFamilies.sans,
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {/* Bilibili cover template background: character on left, title-safe area on right. */}
        <div
          data-testid="cover-background"
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url('${COVER_BACKGROUND_URL}')`,
            backgroundPosition: "center",
            backgroundSize: "cover",
            pointerEvents: "none",
          }}
        />

        {/* Title legibility pass over the right-side safe area. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(16,13,10,0) 0%, rgba(16,13,10,0.04) 42%, rgba(16,13,10,0.22) 70%, rgba(16,13,10,0.36) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Right-side Bilibili title safe area. */}
        <div
          data-testid="cover-title-stage"
          style={{
            position: "absolute",
            top: 178,
            left: 460,
            width: 650,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
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
                fontSize: 16,
                fontWeight: 500,
                color: state.colors.warmAccent,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: 16,
                textAlign: "center",
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
              fontSize: 58,
              fontWeight: 600,
              color: COVER_INK,
              letterSpacing: "-0.01em",
              lineHeight: 1.06,
              margin: 0,
              maxWidth: 650,
              textAlign: "center",
              whiteSpace: "normal",
              ...wrapProse,
            }}
          />

          <div
            style={{
              width: 64,
              height: 2,
              background: E.accent,
              borderRadius: 1,
              marginTop: 22,
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
              marginTop: 20,
              maxWidth: 610,
              fontSize: 27,
              fontWeight: 500,
              color: COVER_INK_SOFT,
              lineHeight: 1.25,
              letterSpacing: 0,
              textAlign: "center",
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
                marginTop: 14,
                fontSize: 18,
                fontWeight: 500,
                color: "rgba(245, 238, 228, 0.72)",
                lineHeight: 1.3,
                letterSpacing: "0.02em",
                textAlign: "center",
              }}
            />
          )}

          <BadgeToolbar
            badges={cover.badges}
            readonly={readonly}
            onBadgeLabelChange={writeBadgeLabel}
            labelColor="#ece3d6"
            background="rgba(20, 16, 12, 0.58)"
            border="1px solid rgba(245, 238, 228, 0.16)"
            borderRadius={10}
            paddingY={9}
            paddingX={14}
            outerGap={13}
            itemGap={8}
            iconSize={23}
            iconOpacity={0.98}
            labelFontSize={16}
            separatorFontSize={13}
            separatorColor="rgba(245, 238, 228, 0.3)"
            style={{ marginTop: 26 }}
          />
        </div>
      </div>
    );
  },
);

CoverCanvas.displayName = "CoverCanvas";
export default CoverCanvas;

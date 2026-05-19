import { forwardRef } from "react";
import { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import { fontFamilies } from "../lib/typography";
import { COVER_CANVAS_DIMENSIONS } from "../lib/canvas-dimensions";
import EditableText from "./edit/EditableText";
import BadgeToolbar from "./shared/BadgeToolbar";

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
          backgroundColor: "#020817",
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
              "linear-gradient(90deg, rgba(2,8,23,0) 0%, rgba(2,8,23,0.02) 44%, rgba(2,8,23,0.16) 70%, rgba(2,8,23,0.28) 100%)",
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
          <EditableText
            readonly={readonly}
            value={cover.title}
            onCommit={(v) => writeCover({ title: v })}
            as="h1"
            ariaLabel="Cover title"
            style={{
              fontFamily: fontFamilies.sans,
              fontSize: 60,
              fontWeight: 900,
              color: "#F9FCFF",
              letterSpacing: 0,
              lineHeight: 1.02,
              margin: 0,
              maxWidth: 650,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          />

          <EditableText
            readonly={readonly}
            value={cover.todayTopic}
            onCommit={(v) => writeCover({ todayTopic: v })}
            as="div"
            ariaLabel="Cover subtitle"
            style={{
              marginTop: 17,
              maxWidth: 610,
              fontSize: 29,
              fontWeight: 800,
              color: "#B8F1FF",
              lineHeight: 1.22,
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
                marginTop: 15,
                fontSize: 19,
                fontWeight: 700,
                color: "rgba(244, 248, 255, 0.78)",
                lineHeight: 1.25,
                letterSpacing: "0.04em",
                textAlign: "center",
              }}
            />
          )}

          <BadgeToolbar
            badges={cover.badges}
            readonly={readonly}
            onBadgeLabelChange={writeBadgeLabel}
            labelColor="#E8F3FF"
            background="rgba(3, 13, 36, 0.70)"
            border="1px solid rgba(111, 201, 255, 0.24)"
            borderRadius={12}
            paddingY={9}
            paddingX={13}
            outerGap={13}
            itemGap={7}
            iconSize={23}
            iconOpacity={0.98}
            labelFontSize={16}
            separatorFontSize={13}
            separatorColor="rgba(184, 241, 255, 0.36)"
            style={{
              marginTop: 27,
              boxShadow: "0 0 30px rgba(0, 132, 255, 0.18)",
            }}
          />
        </div>
      </div>
    );
  },
);

CoverCanvas.displayName = "CoverCanvas";
export default CoverCanvas;

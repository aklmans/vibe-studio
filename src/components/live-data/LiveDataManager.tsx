import type { CSSProperties } from "react";
import type { OverlayState } from "../../types";
import { UI_BORDERS, UI_COLORS } from "../../lib/design-tokens";
import { patchSection } from "../../lib/state";
import { useLocale } from "../../hooks/useLocale";
import SidebarSectionEditor from "../SidebarSectionEditor";
import LiveSessionEditor from "../LiveSessionEditor";
import StackEditor from "../StackEditor";
import BottomBarSegmentEditor from "../BottomBarSegmentEditor";

interface LiveDataManagerProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

const SECTION_ACCENTS = [UI_COLORS.cyan, UI_COLORS.danger, UI_COLORS.warm] as const;

const panelStyle: CSSProperties = {
  minWidth: 0,
  background: UI_COLORS.appSurface,
  border: `1px solid ${UI_COLORS.panelSurface}`,
  borderRadius: 8,
  overflow: "hidden",
};

const panelBodyStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 18,
  padding: 16,
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: UI_COLORS.textSoft,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
};

export default function LiveDataManager({
  state,
  onChange,
}: LiveDataManagerProps) {
  const { t } = useLocale();

  return (
    <div
      data-testid="live-data-manager"
      style={{
        flex: 1,
        minHeight: 0,
        width: "100%",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(440px, 1fr))",
          gap: 16,
          alignItems: "start",
          width: "100%",
          maxWidth: 1320,
          margin: "0 auto",
          paddingBottom: 20,
        }}
      >
        <section data-testid="live-data-sections" style={panelStyle}>
          <PanelHeader
            title={t("group.sections")}
            hint={t("group.sections.hint")}
            accentColor={UI_COLORS.cyan}
          />
          <div style={panelBodyStyle}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={labelStyle}>{t("label.activeSection")}</span>
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  background: UI_COLORS.controlSurface,
                  padding: 3,
                  borderRadius: 8,
                  border: `1px solid ${UI_COLORS.panelSurface}`,
                }}
              >
                {state.sidebar.sections.map((section, idx) => (
                  <button
                    key={idx}
                    data-testid={`live-data-active-section-${idx}`}
                    onClick={() =>
                      onChange(patchSection(state, "sidebar", { activeSection: idx }))
                    }
                    style={{
                      flex: 1,
                      minWidth: 0,
                      padding: "6px 10px",
                      background:
                        state.sidebar.activeSection === idx
                          ? UI_COLORS.panelSurface
                          : "transparent",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      color:
                        state.sidebar.activeSection === idx
                          ? UI_COLORS.text
                          : UI_COLORS.textMuted,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      letterSpacing: "0.02em",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {section.title || `${t("label.section")} ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>

            {state.sidebar.sections.map((_, idx) => (
              <EditorBlock
                key={idx}
                label={`${t("label.section")} ${idx + 1}`}
                accentColor={SECTION_ACCENTS[idx]}
              >
                <SidebarSectionEditor
                  state={state}
                  onChange={onChange}
                  index={idx}
                  accentColor={SECTION_ACCENTS[idx]}
                />
              </EditorBlock>
            ))}
          </div>
        </section>

        <section data-testid="live-data-live-bar" style={panelStyle}>
          <PanelHeader
            title={t("group.liveBar")}
            hint={t("group.liveBar.hint")}
            accentColor={UI_COLORS.warm}
          />
          <div style={panelBodyStyle}>
            <EditorBlock label={t("label.liveSession")} accentColor={UI_COLORS.cyan}>
              <LiveSessionEditor state={state} onChange={onChange} />
            </EditorBlock>

            <EditorBlock label={t("label.stack")} accentColor={UI_COLORS.purple}>
              <StackEditor state={state} onChange={onChange} />
            </EditorBlock>

            {[0, 1, 2].map((idx) => (
              <EditorBlock
                key={idx}
                label={`${t("label.segment")} ${idx + 1}`}
                accentColor={SECTION_ACCENTS[idx]}
              >
                <BottomBarSegmentEditor
                  state={state}
                  onChange={onChange}
                  index={idx}
                />
              </EditorBlock>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PanelHeader({
  title,
  hint,
  accentColor,
}: {
  title: string;
  hint: string;
  accentColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 16px",
        borderBottom: `1px solid ${UI_COLORS.panelSurface}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: UI_COLORS.text,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          <span
            aria-hidden
            style={{
              width: 3,
              height: 14,
              borderRadius: 2,
              background: accentColor,
              boxShadow: `0 0 14px ${accentColor}66`,
            }}
          />
          {title}
        </div>
        <div style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>
          {hint}
        </div>
      </div>
    </div>
  );
}

function EditorBlock({
  label,
  accentColor,
  children,
}: {
  label: string;
  accentColor: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        paddingTop: 14,
        borderTop: UI_BORDERS.panel,
      }}
    >
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: accentColor,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

import type { OverlayState } from "../../../types";
import { UI_COLORS } from "../../../lib/design-tokens";
import { patchSection } from "../../../lib/state";
import InspectorGroup from "../InspectorGroup";
import { SectionInput, ToggleButton } from "../../shared/Field";
import SidebarSectionEditor from "../../SidebarSectionEditor";
import LiveSessionEditor from "../../LiveSessionEditor";
import StackEditor from "../../StackEditor";
import BottomBarSegmentEditor from "../../BottomBarSegmentEditor";
import { useLocale } from "../../../hooks/useLocale";

interface OverlayInspectorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

const SECTION_ACCENTS = [
  UI_COLORS.sectionAccent,
  UI_COLORS.danger,
  UI_COLORS.sectionAccentWarm,
] as const;

export default function OverlayInspector({
  state,
  onChange,
}: OverlayInspectorProps) {
  const { t } = useLocale();
  return (
    <>
      <InspectorGroup
        title={t("group.visibility")}
        hint={t("group.visibility.hint")}
        testId="group-overlay-visibility"
      >
        <ToggleButton
          label={t("toggle.mainScreen")}
          checked={state.mainScreen.visible}
          onChange={(v) =>
            onChange(patchSection(state, "mainScreen", { visible: v }))
          }
          testId="toggle-main-screen"
        />
        <ToggleButton
          label={t("toggle.cameraFrame")}
          checked={state.mainScreen.cameraVisible}
          onChange={(v) =>
            onChange(patchSection(state, "mainScreen", { cameraVisible: v }))
          }
          testId="toggle-camera"
        />
        <ToggleButton
          label={t("toggle.rightSidebar")}
          checked={state.sidebar.visible}
          onChange={(v) =>
            onChange(patchSection(state, "sidebar", { visible: v }))
          }
          testId="toggle-sidebar"
        />
        <ToggleButton
          label={t("toggle.sidebarSocial")}
          checked={state.sidebar.socialVisible}
          onChange={(v) =>
            onChange(patchSection(state, "sidebar", { socialVisible: v }))
          }
          testId="toggle-sidebar-social"
        />
        <ToggleButton
          label={t("toggle.bottomBar")}
          checked={state.bottomBar.visible}
          onChange={(v) =>
            onChange(patchSection(state, "bottomBar", { visible: v }))
          }
          testId="toggle-bottom-bar"
        />
      </InspectorGroup>

      <InspectorGroup
        title={t("group.sections")}
        hint={t("group.sections.hint")}
        testId="group-overlay-sections"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: UI_COLORS.textSoft,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {t("label.activeSection")}
          </span>
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
            {state.sidebar.sections.map((s, idx) => (
              <button
                key={idx}
                data-testid={`active-section-${idx}`}
                onClick={() =>
                  onChange(patchSection(state, "sidebar", { activeSection: idx }))
                }
                style={{
                  flex: 1,
                  padding: "5px 0",
                  background:
                    state.sidebar.activeSection === idx
                      ? UI_COLORS.panelSurface
                      : "transparent",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 500,
                  color: UI_COLORS.text,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  letterSpacing: "0.04em",
                  transition: "all 0.15s",
                }}
              >
                {s.title || `${t("label.section")} ${idx + 1}`}
              </button>
            ))}
          </div>
        </div>

        {state.sidebar.sections.map((_, idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: SECTION_ACCENTS[idx],
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              {`${t("label.section")} ${idx + 1}`}
            </span>
            <SidebarSectionEditor
              state={state}
              onChange={onChange}
              index={idx}
              accentColor={SECTION_ACCENTS[idx]}
            />
          </div>
        ))}
      </InspectorGroup>

      <InspectorGroup
        title={t("group.liveBar")}
        hint={t("group.liveBar.hint")}
        testId="group-overlay-live-bar"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: UI_COLORS.textSoft,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            {t("label.liveSession")}
          </span>
          <LiveSessionEditor state={state} onChange={onChange} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: UI_COLORS.textSoft,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
{t("label.stack")}
          </span>
          <StackEditor state={state} onChange={onChange} />
        </div>

        {[0, 1, 2].map((idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: UI_COLORS.textSoft,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {`${t("label.segment")} ${idx + 1}`}
            </span>
            <BottomBarSegmentEditor
              state={state}
              onChange={onChange}
              index={idx}
            />
          </div>
        ))}
      </InspectorGroup>
    </>
  );
}

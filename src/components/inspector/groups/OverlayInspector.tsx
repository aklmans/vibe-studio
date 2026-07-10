import type { OverlayState } from "../../../types";
import { UI_COLORS } from "../../../lib/design-tokens";
import { patchSection } from "../../../lib/state";
import InspectorGroup from "../InspectorGroup";
import {
  ToggleButton,
  WorkbenchLabel,
} from "../../shared/Field";
import { LineSegmented } from "../EditorRow";
import SidebarSectionEditor from "../../SidebarSectionEditor";
import LiveSessionEditor from "../../LiveSessionEditor";
import StackEditor from "../../StackEditor";
import BottomBarSegmentEditor from "../../BottomBarSegmentEditor";
import ObsCompositionControls from "../ObsCompositionControls";
import LayoutControls from "../LayoutControls";
import { getLayout } from "../../../lib/overlay-layout";
import { useLocale } from "../../../hooks/useLocale";

interface OverlayInspectorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  /** Public demo: no OBS control surface (the demo never touches anyone's OBS). */
  demoMode?: boolean;
}

export default function OverlayInspector({
  state,
  onChange,
  demoMode = false,
}: OverlayInspectorProps) {
  const { t } = useLocale();
  const lastSectionIndex = Math.max(state.sidebar.sections.length - 1, 0);
  const activeSectionIndex = Math.min(
    Math.max(state.sidebar.activeSection, 0),
    lastSectionIndex,
  );
  const activeSection = state.sidebar.sections[activeSectionIndex];
  // Only offer toggles for surfaces the active layout actually has.
  const panels = getLayout(state.layout).panels;

  return (
    <>
      <InspectorGroup
        title={t("group.layout")}
        hint={t("group.layout.hint")}
        testId="group-overlay-layout"
      >
        <LayoutControls state={state} onChange={onChange} />
      </InspectorGroup>

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
        {panels.cameraPanel && (
          <ToggleButton
            label={t("toggle.cameraFrame")}
            checked={state.mainScreen.cameraVisible}
            onChange={(v) =>
              onChange(patchSection(state, "mainScreen", { cameraVisible: v }))
            }
            testId="toggle-camera"
          />
        )}
        {panels.sidebar && (
          <ToggleButton
            label={t("toggle.rightSidebar")}
            checked={state.sidebar.visible}
            onChange={(v) =>
              onChange(patchSection(state, "sidebar", { visible: v }))
            }
            testId="toggle-sidebar"
          />
        )}
        {panels.sidebar && (
          <ToggleButton
            label={t("toggle.sidebarSocial")}
            checked={state.sidebar.socialVisible}
            onChange={(v) =>
              onChange(patchSection(state, "sidebar", { socialVisible: v }))
            }
            testId="toggle-sidebar-social"
          />
        )}
        {panels.bottomBar && (
          <ToggleButton
            label={t("toggle.bottomBar")}
            checked={state.bottomBar.visible}
            onChange={(v) =>
              onChange(patchSection(state, "bottomBar", { visible: v }))
            }
            testId="toggle-bottom-bar"
          />
        )}
      </InspectorGroup>

      {!demoMode && (
        <InspectorGroup
          title={t("group.composition")}
          hint={t("group.composition.hint")}
          testId="group-overlay-composition"
        >
          <ObsCompositionControls state={state} onChange={onChange} />
        </InspectorGroup>
      )}

      <InspectorGroup
        title={t("group.sections")}
        hint={t("group.sections.hint")}
        testId="group-overlay-sections"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <WorkbenchLabel>{t("label.activeSection")}</WorkbenchLabel>
          <LineSegmented
            active={String(activeSectionIndex)}
            onSelect={(value) =>
              onChange(
                patchSection(state, "sidebar", { activeSection: Number(value) }),
              )
            }
            options={state.sidebar.sections.map((s, idx) => ({
              value: String(idx),
              label: s.title || `${t("label.section")} ${idx + 1}`,
              testId: `active-section-${idx}`,
            }))}
          />
        </div>

        {activeSection ? (
          <div
            data-testid={`overlay-section-panel-${activeSectionIndex}`}
            style={{ display: "flex", flexDirection: "column", gap: 8 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 2,
              }}
            >
              <div
                style={{
                  width: 2,
                  height: 11,
                  background: UI_COLORS.accent,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--app-font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  color: UI_COLORS.text,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                {`${t("label.section")} ${activeSectionIndex + 1}`}
              </span>
            </div>
            <SidebarSectionEditor
              state={state}
              onChange={onChange}
              index={activeSectionIndex}
              accentColor={UI_COLORS.accent}
            />
          </div>
        ) : null}
      </InspectorGroup>

      <InspectorGroup
        title={t("group.liveSession")}
        hint={t("group.liveSession.hint")}
        testId="group-overlay-live-session"
      >
        <LiveSessionEditor state={state} onChange={onChange} />
      </InspectorGroup>

      <InspectorGroup
        title={t("group.stack")}
        hint={t("group.stack.hint")}
        testId="group-overlay-stack"
        defaultOpen={false}
      >
        <StackEditor state={state} onChange={onChange} />
      </InspectorGroup>

      <InspectorGroup
        title={t("group.bottomBarSegments")}
        hint={t("group.bottomBarSegments.hint")}
        testId="group-overlay-bottom-bar"
        defaultOpen={false}
      >
        {[0, 1, 2].map((idx) => (
          <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <WorkbenchLabel>{`${t("label.segment")} ${idx + 1}`}</WorkbenchLabel>
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

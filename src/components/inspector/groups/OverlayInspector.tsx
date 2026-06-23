import type { OverlayState } from "../../../types";
import { UI_COLORS } from "../../../lib/design-tokens";
import { patchSection } from "../../../lib/state";
import InspectorGroup from "../InspectorGroup";
import {
  ToggleButton,
  WorkbenchLabel,
  WorkbenchSegmented,
} from "../../shared/Field";
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
          <WorkbenchLabel>{t("label.activeSection")}</WorkbenchLabel>
          <WorkbenchSegmented
            active={String(state.sidebar.activeSection)}
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
          <WorkbenchLabel>{t("label.liveSession")}</WorkbenchLabel>
          <LiveSessionEditor state={state} onChange={onChange} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <WorkbenchLabel>{t("label.stack")}</WorkbenchLabel>
          <StackEditor state={state} onChange={onChange} />
        </div>

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

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
import { useLocale } from "../../../hooks/useLocale";

interface OverlayInspectorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

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
          <LineSegmented
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

        {state.sidebar.sections.map((_, idx) => {
          // One primary accent across all sections; only the active section is
          // marked — no per-section rainbow.
          const isActive = idx === state.sidebar.activeSection;
          return (
            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: idx === 0 ? 2 : 6,
                }}
              >
                <div
                  style={{
                    width: 2,
                    height: 11,
                    background: isActive ? UI_COLORS.accent : UI_COLORS.rule,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--app-font-mono)",
                    fontSize: 10,
                    fontWeight: 600,
                    color: isActive ? UI_COLORS.text : UI_COLORS.textMuted,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                  }}
                >
                  {`${t("label.section")} ${idx + 1}`}
                </span>
              </div>
              <SidebarSectionEditor
                state={state}
                onChange={onChange}
                index={idx}
                accentColor={UI_COLORS.accent}
              />
            </div>
          );
        })}
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

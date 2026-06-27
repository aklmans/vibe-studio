import { useEffect, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import type { OverlayState } from "../../types";
import type { Locale, TranslationKey } from "../../lib/i18n";
import { UI_COLORS, cssAlpha } from "../../lib/design-tokens";
import { patchSection } from "../../lib/state";
import { useLocale } from "../../hooks/useLocale";
import SidebarSectionEditor from "../SidebarSectionEditor";
import LiveSessionEditor from "../LiveSessionEditor";
import StackEditor from "../StackEditor";
import BottomBarSegmentEditor from "../BottomBarSegmentEditor";
import BadgesEditor from "../BadgesEditor";
import SocialsEditor from "../SocialsEditor";
import CoverVisualEditor from "../inspector/CoverVisualEditor";
import AvatarUploader from "../shared/AvatarUploader";
import { TextInput, WorkbenchButton } from "../shared/Field";
import { LineSegmented, RuleNote } from "../inspector/EditorRow";
import StudioAppearanceControls, { SettingsSelector } from "./StudioAppearanceControls";
import AIProviderSettings from "./AIProviderSettings";
import SourceOfTruthBar, { type SessionPersistence } from "./SourceOfTruthBar";
import { IDLE_OBS_SYNC, type ObsSyncState } from "./obs-sync";

interface ManualSettingsProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  onReset: () => void;
  /** Open the JSON drawer — an advanced power-tool, not a per-field requirement. */
  onOpenJson: (key?: string) => void;
  /** A one-shot deep-link request to reveal a settings group (e.g. appearance). */
  focus?: { group?: string } | null;
  /** Source-of-truth + lifecycle, surfaced in the Data & Sync group. */
  dateKey: string;
  persistence: SessionPersistence;
  obsSync?: ObsSyncState;
  onReload: () => void;
  onStartSession: () => void;
  onEndSession: () => void;
}

interface TabDef {
  id: string;
  titleKey: TranslationKey;
  hintKey: TranslationKey;
  render: () => ReactNode;
}

const SETTINGS_CONTENT_MAX_WIDTH = 920;

/**
 * Settings — a stable, low-noise settings surface in the spirit of Seeker: a
 * scannable left menu + calm "title · description · control" rows. Groups are
 * Session / Content / Broadcast Display / Studio Appearance / AI Provider /
 * Data & Sync. The v1 portable-core fields are edited directly; JSON is an
 * advanced power-tool reached from the dialog header or Data & Sync, not a
 * per-field obligation. All panels stay mounted (visibility toggled) so the IA
 * is statically inspectable and the JSON drift stays synced.
 */
export default function ManualSettings({
  state,
  onChange,
  onReset,
  onOpenJson,
  focus,
  dateKey,
  persistence,
  obsSync = IDLE_OBS_SYNC,
  onReload,
  onStartSession,
  onEndSession,
}: ManualSettingsProps) {
  const { t, locale, setLocale } = useLocale();
  const [activeTab, setActiveTab] = useState("session");

  // Honor a deep-link request (e.g. the gear / ⌘, jump to Studio Appearance).
  useEffect(() => {
    if (focus?.group) setActiveTab(focus.group);
  }, [focus]);

  const activeSectionIndex = Math.min(
    Math.max(state.sidebar.activeSection, 0),
    Math.max(state.sidebar.sections.length - 1, 0),
  );
  const activeSection = state.sidebar.sections[activeSectionIndex];
  const writeCover = (patch: Partial<OverlayState["cover"]>) =>
    onChange(patchSection(state, "cover", patch));

  const tabs: TabDef[] = [
    {
      id: "session",
      titleKey: "settingsGroup.session",
      hintKey: "settingsGroup.sessionHint",
      render: () => (
        <>
          <SettingRow title={t("settingsRow.languageTitle")} description={t("settingsRow.languageDesc")}>
            <SettingsSelector
              options={[
                { value: "zh", label: "中文", testId: "manual-locale-zh" },
                { value: "en", label: "English", testId: "manual-locale-en" },
              ]}
              active={locale}
              onSelect={(loc) => setLocale(loc as Locale)}
            />
          </SettingRow>
          <SettingRow title={t("label.title")} description={t("settingsRow.titleDesc")}>
            <TextInput testId="field-title" value={state.cover.title} onChange={(v) => writeCover({ title: v })} placeholder={t("label.title")} />
          </SettingRow>
          <SettingRow title={t("label.subtitle")} description={t("settingsRow.subtitleDesc")}>
            <TextInput testId="field-subtitle" value={state.cover.todayTopic} onChange={(v) => writeCover({ todayTopic: v })} placeholder={t("label.topic")} />
          </SettingRow>
          <SettingRow title={t("settingsRow.authorTitle")} description={t("settingsRow.authorDesc")}>
            <TextInput testId="field-author" value={state.cover.hookText} onChange={(v) => writeCover({ hookText: v })} placeholder={t("settingsRow.authorPlaceholder")} />
          </SettingRow>
        </>
      ),
    },
    {
      id: "content",
      titleKey: "settingsGroup.content",
      hintKey: "settingsGroup.contentHint",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <AssetRow label={t("settingsRow.profileTitle")} description={t("settingsRow.profileDesc")}>
            <AvatarUploader
              url={state.cover.avatarUrl}
              visible={state.cover.avatarVisible}
              onUrlChange={(v) => writeCover({ avatarUrl: v })}
              onVisibleChange={(v) => writeCover({ avatarVisible: v })}
              showToggle
              clearValue="/avatar.png"
              testIdPrefix="field-profile-avatar"
            />
          </AssetRow>
          <AssetRow label={t("cover.visual.label")} description={t("settingsRow.coverDesc")}>
            <CoverVisualEditor state={state} onChange={onChange} />
          </AssetRow>
          <AssetRow label={t("label.section") + "s"} description={t("settingsRow.sectionsDesc")}>
            <div data-testid="live-data-sections" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <LineSegmented
                testId="live-data-section-tabs"
                active={String(activeSectionIndex)}
                onSelect={(value) => onChange(patchSection(state, "sidebar", { activeSection: Number(value) }))}
                options={state.sidebar.sections.map((section, idx) => ({
                  value: String(idx),
                  label: section.title || `${t("label.section")} ${idx + 1}`,
                  meta: `${(state.sidebar.sectionsDone?.[idx] ?? []).filter(Boolean).length}/${section.bullets.length}`,
                  testId: `live-data-section-tab-${idx}`,
                }))}
              />
              {activeSection && (
                <div data-testid={`live-data-section-panel-${activeSectionIndex}`}>
                  <SidebarSectionEditor state={state} onChange={onChange} index={activeSectionIndex} accentColor={UI_COLORS.accent} />
                </div>
              )}
            </div>
          </AssetRow>
          <AssetRow label={t("group.stack")} description={t("group.stack.hint")}>
            <div data-testid="live-data-stack">
              <StackEditor state={state} onChange={onChange} />
            </div>
          </AssetRow>
          <AssetRow label={`${t("label.badge")}s`} description={t("settingsRow.badgesDesc")}>
            <BadgesEditor state={state} onChange={onChange} testIdPrefix="field-badge" />
          </AssetRow>
          <AssetRow label={`${t("label.social")}s`} description={t("settingsRow.socialsDesc")}>
            <SocialsEditor state={state} onChange={onChange} testIdPrefix="field-social" />
          </AssetRow>
        </div>
      ),
    },
    {
      id: "display",
      titleKey: "settingsGroup.display",
      hintKey: "settingsGroup.displayHint",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div data-testid="live-data-bottom-bar" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={fieldLabel}>{t("group.bottomBarSegments")}</span>
            {[0, 1, 2].map((idx) => (
              <SettingRow key={idx} title={`${t("label.segment")} ${idx + 1}`} description="">
                <BottomBarSegmentEditor state={state} onChange={onChange} index={idx} />
              </SettingRow>
            ))}
          </div>
          <SettingRow title={t("group.liveSession")} description={t("settingsRow.onAirDesc")}>
            <div data-testid="live-data-live-session">
              <LiveSessionEditor state={state} onChange={onChange} />
            </div>
          </SettingRow>
          <RuleNote>{t("settingsRow.displayNote")}</RuleNote>
        </div>
      ),
    },
    {
      id: "appearance",
      titleKey: "settingsGroup.appearance",
      hintKey: "settingsGroup.appearanceHint",
      render: () => (
        <StudioAppearanceControls state={state} onChange={onChange} onReset={onReset} testIdPrefix="studio-" />
      ),
    },
    {
      id: "provider",
      titleKey: "settingsGroup.provider",
      hintKey: "settingsGroup.providerHint",
      render: () => <AIProviderSettings />,
    },
    {
      id: "data",
      titleKey: "settingsGroup.data",
      hintKey: "settingsGroup.dataHint",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <SourceOfTruthBar
            dateKey={dateKey}
            persistence={persistence}
            obsSync={obsSync}
            onReload={onReload}
            onStartSession={onStartSession}
            onEndSession={onEndSession}
            onOpenJson={() => onOpenJson()}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "0 2px" }}>
            <RuleNote>{t("settingsRow.persistenceNote")}</RuleNote>
            <RuleNote>{t("settingsRow.advancedNote")}</RuleNote>
            <RuleNote>{t("settingsRow.fileStrategyNote")}</RuleNote>
            <WorkbenchButton data-testid="open-json-advanced" onClick={() => onOpenJson()} style={{ alignSelf: "flex-start", height: 32, padding: "0 12px" }}>
              {t("drawer.openJson")}
            </WorkbenchButton>
          </div>
        </div>
      ),
    },
  ];

  const focusTab = (id: string) => {
    window.requestAnimationFrame(() => {
      document.getElementById(`settings-tab-${id}`)?.focus();
    });
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % tabs.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + tabs.length) % tabs.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = tabs.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    const nextId = tabs[nextIndex].id;
    setActiveTab(nextId);
    focusTab(nextId);
  };

  return (
    <div data-testid="manual-settings" style={{ display: "flex", flexDirection: "row", minHeight: 0, flex: 1, width: "100%" }}>
      {/* Left menu — a stable, scannable vertical nav, only in Settings mode. */}
      <nav
        data-testid="settings-tab-bar"
        role="tablist"
        aria-orientation="vertical"
        aria-label={t("manualSettings.menuLabel")}
        style={{
          width: 188,
          minWidth: 188,
          flexShrink: 0,
          borderRight: `1px solid ${UI_COLORS.border}`,
          padding: "16px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
      >
        {tabs.map((tab, index) => {
          const active = tab.id === activeTab;
          return (
            <button
              id={`settings-tab-${tab.id}`}
              key={tab.id}
              data-testid={`settings-tab-${tab.id}`}
              role="tab"
              aria-selected={active}
              aria-controls={`settings-panel-${tab.id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              style={{
                appearance: "none",
                textAlign: "left",
                width: "100%",
                background: active ? cssAlpha(UI_COLORS.accent, 8) : "transparent",
                border: "none",
                borderLeft: `2px solid ${active ? UI_COLORS.accent : "transparent"}`,
                borderRadius: 0,
                padding: "8px 12px",
                cursor: "pointer",
                fontFamily: "var(--app-font-mono)",
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.02em",
                color: active ? UI_COLORS.text : UI_COLORS.textMuted,
                transition: "color 0.12s, background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = UI_COLORS.text; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = UI_COLORS.textMuted; }}
            >
              {t(tab.titleKey)}
            </button>
          );
        })}
      </nav>

      {/* Content — the active panel; all panels stay mounted (visibility toggled). */}
      <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "22px 28px 40px" }}>
        <div style={{ maxWidth: SETTINGS_CONTENT_MAX_WIDTH }}>
          {tabs.map((tab) => (
            <section
              id={`settings-panel-${tab.id}`}
              key={tab.id}
              data-testid={`settings-panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`settings-tab-${tab.id}`}
              tabIndex={0}
              hidden={tab.id !== activeTab}
              style={{ display: tab.id === activeTab ? "block" : "none" }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                <h2 style={{ margin: 0, fontFamily: "var(--app-font-serif)", fontSize: 23, fontWeight: 500, color: UI_COLORS.text }}>
                  {t(tab.titleKey)}
                </h2>
                <div style={{ fontSize: 12, color: UI_COLORS.textMuted, lineHeight: 1.5, maxWidth: 560 }}>{t(tab.hintKey)}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>{tab.render()}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

const fieldLabel: CSSProperties = {
  fontFamily: "var(--app-font-mono)",
  fontSize: 10,
  fontWeight: 600,
  color: UI_COLORS.textMuted,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

/** A settings row: title + description on the left, control stacked below. */
function SettingRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 16, marginTop: 16, borderTop: `1px solid ${UI_COLORS.border}` }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: UI_COLORS.textSoft }}>{title}</span>
        {description && <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>{description}</span>}
      </div>
      {children}
    </div>
  );
}

/** A labelled content / brand-asset sub-section (mono label, no JSON link). */
function AssetRow({ label, description, children }: { label: string; description: string; children: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={fieldLabel}>{label}</span>
        {description && <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>{description}</span>}
      </div>
      {children}
    </div>
  );
}

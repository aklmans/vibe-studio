import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
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
import type { SessionPersistence } from "./SourceOfTruthBar";

interface ManualSettingsProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  persistence: SessionPersistence;
  onReset: () => void;
  /** Open the JSON drawer (optionally jumping to a module key). */
  onOpenJson: (key?: string) => void;
  /** Fallback: open the full studio settings drawer. */
  onOpenStudioDrawer: () => void;
}

interface TabDef {
  id: string;
  titleKey: TranslationKey;
  hintKey: TranslationKey;
  render: () => ReactNode;
}

const SETTINGS_CONTENT_MAX_WIDTH = 920;

/**
 * Manual Settings — a flat tabbed panel (one concern per tab), in the spirit of
 * a desktop Settings window: a tab bar across the top, calm labeled rows below.
 * The v1 portable-core fields are edited directly; each keeps an "Edit in JSON"
 * jump to the same value (the drift-safe drawer is the JSON power-tool). All
 * panels stay mounted (visibility toggled) so the IA is statically inspectable
 * and the JSON drift stays synced.
 */
export default function ManualSettings({
  state,
  onChange,
  persistence,
  onReset,
  onOpenJson,
  onOpenStudioDrawer,
}: ManualSettingsProps) {
  const { t, locale, setLocale } = useLocale();
  const [activeTab, setActiveTab] = useState("session");

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
          <FieldRow title={t("label.title")} description={t("settingsRow.titleDesc")} jsonKey="title" onOpenJson={onOpenJson}>
            <TextInput testId="field-title" value={state.cover.title} onChange={(v) => writeCover({ title: v })} placeholder={t("label.title")} />
          </FieldRow>
          <FieldRow title={t("label.subtitle")} description={t("settingsRow.subtitleDesc")} jsonKey="subtitle" onOpenJson={onOpenJson}>
            <TextInput testId="field-subtitle" value={state.cover.todayTopic} onChange={(v) => writeCover({ todayTopic: v })} placeholder={t("label.topic")} />
          </FieldRow>
          <FieldRow title={t("settingsRow.authorTitle")} description={t("settingsRow.authorDesc")} jsonKey="author" onOpenJson={onOpenJson}>
            <TextInput testId="field-author" value={state.cover.hookText} onChange={(v) => writeCover({ hookText: v })} placeholder={t("settingsRow.authorPlaceholder")} />
          </FieldRow>
          <SettingRow title={t("group.liveSession")} description={t("settingsRow.onAirDesc")}>
            <div data-testid="live-data-live-session">
              <LiveSessionEditor state={state} onChange={onChange} />
            </div>
          </SettingRow>
        </>
      ),
    },
    {
      id: "cover",
      titleKey: "settingsGroup.cover",
      hintKey: "settingsGroup.coverHint",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <AssetSubSection label={t("settingsRow.profileTitle")} description={t("settingsRow.profileDesc")} jsonKey="profile" onOpenJson={onOpenJson}>
            <AvatarUploader
              url={state.cover.avatarUrl}
              visible={state.cover.avatarVisible}
              onUrlChange={(v) => writeCover({ avatarUrl: v })}
              onVisibleChange={(v) => writeCover({ avatarVisible: v })}
              showToggle
              clearValue="/avatar.png"
              testIdPrefix="field-profile-avatar"
            />
          </AssetSubSection>
          <AssetSubSection label={t("cover.visual.label")} description={t("settingsRow.coverDesc")} jsonKey="cover" onOpenJson={onOpenJson}>
            <CoverVisualEditor state={state} onChange={onChange} />
          </AssetSubSection>
        </div>
      ),
    },
    {
      id: "branding",
      titleKey: "settingsGroup.branding",
      hintKey: "settingsGroup.brandingHint",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <AssetSubSection label={`${t("label.badge")}s`} description={t("settingsRow.badgesDesc")} jsonKey="badges" onOpenJson={onOpenJson}>
            <BadgesEditor state={state} onChange={onChange} testIdPrefix="field-badge" />
          </AssetSubSection>
          <AssetSubSection label={t("group.stack")} description={t("group.stack.hint")} jsonKey="stack" onOpenJson={onOpenJson}>
            <div data-testid="live-data-stack">
              <StackEditor state={state} onChange={onChange} />
            </div>
          </AssetSubSection>
          <AssetSubSection label={`${t("label.social")}s`} description={t("settingsRow.socialsDesc")} jsonKey="socials" onOpenJson={onOpenJson}>
            <SocialsEditor state={state} onChange={onChange} testIdPrefix="field-social" />
          </AssetSubSection>
        </div>
      ),
    },
    {
      id: "display",
      titleKey: "settingsGroup.display",
      hintKey: "settingsGroup.displayHint",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div data-testid="live-data-sections" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={fieldLabel}>{t("label.activeSection")}</span>
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
            </div>
            {activeSection && (
              <div data-testid={`live-data-section-panel-${activeSectionIndex}`}>
                <SidebarSectionEditor state={state} onChange={onChange} index={activeSectionIndex} accentColor={UI_COLORS.accent} />
              </div>
            )}
          </div>
          <div data-testid="live-data-bottom-bar" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <span style={fieldLabel}>{t("group.bottomBarSegments")}</span>
            {[0, 1, 2].map((idx) => (
              <SettingRow key={idx} title={`${t("label.segment")} ${idx + 1}`} description="">
                <BottomBarSegmentEditor state={state} onChange={onChange} index={idx} />
              </SettingRow>
            ))}
            <RuleNote>{t("settingsRow.displayNote")}</RuleNote>
          </div>
        </div>
      ),
    },
    {
      id: "appearance",
      titleKey: "settingsGroup.appearance",
      hintKey: "settingsGroup.appearanceHint",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <StudioAppearanceControls state={state} onChange={onChange} onReset={onReset} testIdPrefix="studio-" />
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              paddingTop: 14,
              borderTop: `1px solid ${UI_COLORS.border}`,
            }}
          >
            <WorkbenchButton data-testid="open-studio-drawer" onClick={onOpenStudioDrawer} style={{ height: 30, padding: "0 12px", flexShrink: 0 }}>
              {t("settingsRow.openStudioDrawer")}
            </WorkbenchButton>
            <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>{t("settingsRow.studioDrawerNote")}</span>
          </div>
        </div>
      ),
    },
    {
      id: "data",
      titleKey: "settingsGroup.data",
      hintKey: "settingsGroup.dataHint",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <SummaryRow label={t("sourceBar.db")} value={persistence.databaseConfigured ? t("sourceBar.dbReady") : t("sourceBar.dbLocal")} />
            <SummaryRow label={t("sourceBar.authority")} value={t("sourceBar.localDraft")} />
            <SummaryRow label={t("sourceBar.obs")} value={t("sourceBar.obsState")} />
          </div>
          <RuleNote>{t("settingsRow.persistenceNote")}</RuleNote>
          <RuleNote>{t("settingsRow.advancedNote")}</RuleNote>
          <RuleNote>{t("settingsRow.fileStrategyNote")}</RuleNote>
          <WorkbenchButton data-testid="open-json-advanced" onClick={() => onOpenJson()} style={{ alignSelf: "flex-start", height: 32, padding: "0 12px" }}>
            {t("drawer.openJson")}
          </WorkbenchButton>
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
      {/* Left menu — a stable, scannable vertical nav (secondary to the mode). */}
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

/**
 * An editable v1-core field row: title + description + an "Edit in JSON" jump on
 * the right, control stacked below. Directly edits OverlayState — the JSON link
 * is a shortcut to the same value, not a second write path.
 */
function FieldRow({
  title,
  description,
  jsonKey,
  onOpenJson,
  children,
}: {
  title: string;
  description: string;
  jsonKey: string;
  onOpenJson: (key?: string) => void;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 16, marginTop: 16, borderTop: `1px solid ${UI_COLORS.border}` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: UI_COLORS.textSoft }}>{title}</span>
          {description && <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>{description}</span>}
        </div>
        <EditInJson jsonKey={jsonKey} onOpenJson={onOpenJson} />
      </div>
      {children}
    </div>
  );
}

/** A labelled brand-asset sub-section. */
function AssetSubSection({
  label,
  description,
  jsonKey,
  onOpenJson,
  children,
}: {
  label: string;
  description: string;
  jsonKey: string;
  onOpenJson: (key?: string) => void;
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={fieldLabel}>{label}</span>
          {description && <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>{description}</span>}
        </div>
        <EditInJson jsonKey={jsonKey} onOpenJson={onOpenJson} />
      </div>
      {children}
    </div>
  );
}

function EditInJson({ jsonKey, onOpenJson }: { jsonKey: string; onOpenJson: (key?: string) => void }) {
  const { t } = useLocale();
  return (
    <button
      data-testid={`settings-openjson-${jsonKey}`}
      onClick={() => onOpenJson(jsonKey)}
      style={{
        appearance: "none",
        border: "none",
        background: "transparent",
        color: cssAlpha(UI_COLORS.accentText, 100),
        cursor: "pointer",
        fontFamily: "var(--app-font-mono)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        flexShrink: 0,
        padding: 0,
      }}
    >
      {t("manualSettings.openJsonAt")}
    </button>
  );
}

/** A read-only summary row (persistence status). */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 12, paddingTop: 12, borderTop: `1px solid ${UI_COLORS.border}` }}>
      <span style={{ ...fieldLabel, width: 96, flexShrink: 0 }}>{label}</span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: "var(--app-font-mono)",
          fontSize: 12,
          color: UI_COLORS.text,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}

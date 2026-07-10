import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import type { OverlayState } from "../../types";
import type { Locale, TranslationKey } from "../../lib/i18n";
import { UI_COLORS, cssAlpha } from "../../lib/design-tokens";
import { patchSection } from "../../lib/state";
import { useLocale } from "../../hooks/useLocale";
import SectionsManager from "../SectionsManager";
import LiveSessionEditor from "../LiveSessionEditor";
import StackEditor from "../StackEditor";
import BottomBarSegmentEditor from "../BottomBarSegmentEditor";
import BadgesEditor from "../BadgesEditor";
import SocialsEditor from "../SocialsEditor";
import CoverVisualEditor from "../inspector/CoverVisualEditor";
import AvatarUploader from "../shared/AvatarUploader";
import { TextInput, WorkbenchButton, workbenchInputStyle } from "../shared/Field";
import { LineSegmented, RuleNote } from "../inspector/EditorRow";
import StudioAppearanceControls, { SettingsSelector } from "./StudioAppearanceControls";
import AIProviderSettings from "./AIProviderSettings";
import ObsCompositionControls from "../inspector/ObsCompositionControls";
import LayoutControls from "../inspector/LayoutControls";
import AgendaDrivePanel from "../inspector/AgendaDrivePanel";
import { activeBarProfile, activeBarSegments } from "../../lib/bottomBar";
import type { BarProfileId } from "../../lib/overlay-layout";

/** Which bar you're editing follows the active scene layout. */
const BAR_PROFILE_LABEL: Record<BarProfileId, TranslationKey> = {
  workbench: "barProfile.workbench",
  lecture: "barProfile.lecture",
  mobile: "barProfile.mobile",
};
import SourceOfTruthBar, { type SessionPersistence } from "./SourceOfTruthBar";
import { IDLE_OBS_SYNC, type ObsSyncState } from "./obs-sync";
import {
  profileFromState,
  type StudioProfile,
} from "../../lib/studio-profile";

interface SettingsViewProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  onReset: () => void;
  /** Public demo: hide local-only OBS composition control in the Broadcast group. */
  demoMode?: boolean;
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
  studioProfile?: StudioProfile | null;
  onSaveStudioProfile?: (profile: StudioProfile) => void;
  onClearStudioProfile?: () => void;
}

interface TabDef {
  id: string;
  titleKey: TranslationKey;
  hintKey: TranslationKey;
  render: () => ReactNode;
}

/**
 * A field-level search index — a settings *fields* search, not a JSON full-text
 * search. Each entry points at a group + an anchored row id so a hit can switch
 * groups and scroll to (or near) the row. `terms` carry en + zh keywords for a
 * simple lowercase-contains match.
 */
interface FieldEntry {
  id: string;
  group: string;
  labelKey: TranslationKey;
  /** A short one-line description for the search hit (omitted for self-evident fields). */
  descKey?: TranslationKey;
  terms: string[];
}

// Search index over the 5 boundary-aligned groups. Session carries the whole
// v1 portable core; Broadcast the runtime on-screen controls; Data the
// lifecycle + JSON. Each entry anchors at settings-row-{id} for scroll-to.
const FIELD_INDEX: FieldEntry[] = [
  { id: "language", group: "session", labelKey: "settingsRow.languageTitle", descKey: "settingsRow.languageDesc", terms: ["language", "语言", "locale", "中英"] },
  { id: "title", group: "session", labelKey: "label.title", descKey: "settingsRow.titleDesc", terms: ["title", "标题", "headline"] },
  { id: "subtitle", group: "session", labelKey: "label.subtitle", descKey: "settingsRow.subtitleDesc", terms: ["subtitle", "topic", "副标题", "话题"] },
  { id: "author", group: "session", labelKey: "settingsRow.authorTitle", descKey: "settingsRow.authorDesc", terms: ["author", "host", "byline", "作者", "主播", "署名"] },
  { id: "profile", group: "session", labelKey: "settingsRow.profileTitle", descKey: "settingsRow.profileDesc", terms: ["profile", "avatar", "头像"] },
  { id: "brand", group: "session", labelKey: "settingsRow.brandTitle", descKey: "settingsRow.brandDesc", terms: ["brand", "logo", "series", "presenter", "品牌", "讲堂", "系列", "头衔", "单位"] },
  { id: "studioProfile", group: "session", labelKey: "settingsGroup.profile", descKey: "settingsGroup.profileHint", terms: ["studio profile", "profile defaults", "save default", "默认身份", "存为默认"] },
  { id: "cover", group: "session", labelKey: "cover.visual.label", descKey: "settingsRow.coverDesc", terms: ["cover", "visual", "封面"] },
  { id: "sections", group: "session", labelKey: "settingsField.sections", descKey: "settingsRow.sectionsDesc", terms: ["sections", "章节", "run of show", "流程"] },
  { id: "stack", group: "session", labelKey: "group.stack", descKey: "group.stack.hint", terms: ["stack", "技术栈", "tools"] },
  { id: "badges", group: "session", labelKey: "label.badge", descKey: "settingsRow.badgesDesc", terms: ["badges", "badge", "徽标"] },
  { id: "socials", group: "session", labelKey: "label.social", descKey: "settingsRow.socialsDesc", terms: ["socials", "social", "社交"] },
  { id: "layout", group: "broadcast", labelKey: "group.layout", descKey: "group.layout.hint", terms: ["layout", "scene", "lecture", "workbench", "布局", "场景", "讲座", "工作台"] },
  { id: "agendaDrive", group: "broadcast", labelKey: "group.agendaDrive", descKey: "group.agendaDrive.hint", terms: ["agenda", "议程", "推进", "计时", "章节", "下一节", "关注", "follow", "timer"] },
  { id: "composition", group: "broadcast", labelKey: "group.composition", descKey: "group.composition.hint", terms: ["obs", "composition", "camera", "screen", "合成", "摄像头", "第二屏", "swap"] },
  { id: "bottomBar", group: "broadcast", labelKey: "group.bottomBarSegments", terms: ["bottom bar", "底栏", "status bar"] },
  { id: "theme", group: "appearance", labelKey: "settings.theme", descKey: "settings.themeHint", terms: ["theme", "主题", "light", "dark"] },
  { id: "colors", group: "appearance", labelKey: "settingsField.colors", terms: ["colors", "color", "颜色", "palette"] },
  { id: "reset", group: "appearance", labelKey: "reset.button", terms: ["reset", "重置", "defaults"] },
  { id: "provider", group: "provider", labelKey: "settingsGroup.provider", descKey: "settingsGroup.providerHint", terms: ["provider", "ai provider", "deepseek", "openai"] },
  { id: "baseUrl", group: "provider", labelKey: "aiProvider.baseUrl", terms: ["base url", "base_url", "baseurl", "endpoint"] },
  { id: "model", group: "provider", labelKey: "aiProvider.model", terms: ["model", "模型"] },
  { id: "userAgent", group: "provider", labelKey: "aiProvider.userAgent", terms: ["user-agent", "useragent", "user agent"] },
  { id: "apiKey", group: "provider", labelKey: "aiProvider.apiKey", terms: ["api key", "apikey", "key", "密钥"] },
  { id: "test", group: "provider", labelKey: "aiProvider.test", terms: ["test connection", "测试", "connection"] },
  { id: "liveTimer", group: "data", labelKey: "group.liveSession", descKey: "settingsRow.onAirDesc", terms: ["live timer", "timer", "计时", "on-air", "on air", "start", "end", "开播"] },
  { id: "status", group: "data", labelKey: "settingsGroup.data", terms: ["local draft", "db", "database", "obs", "数据库", "sync"] },
  { id: "json", group: "data", labelKey: "drawer.openJson", terms: ["json", "import", "export", "导入", "导出"] },
  { id: "file", group: "data", labelKey: "settingsField.file", terms: ["file", "binding", "config file", "文件"] },
];

const SETTINGS_CONTENT_MAX_WIDTH = 920;

/**
 * Settings — a stable, low-noise settings surface in the spirit of Seeker: a
 * scannable left menu + calm "title · description · control" rows, plus a
 * field-level search to jump straight to a setting. Groups are Session /
 * Content / Broadcast Display / Studio Appearance / AI Provider / Data & Sync.
 * The v1 portable-core fields are edited directly; JSON is an advanced
 * power-tool reached from the dialog header or Data & Sync, not a per-field
 * obligation. All panels stay mounted (visibility toggled) so the IA is
 * statically inspectable and the JSON drift stays synced.
 */
export default function SettingsView({
  state,
  onChange,
  onReset,
  demoMode = false,
  onOpenJson,
  focus,
  dateKey,
  persistence,
  obsSync = IDLE_OBS_SYNC,
  onReload,
  onStartSession,
  onEndSession,
  studioProfile = null,
  onSaveStudioProfile = () => {},
  onClearStudioProfile = () => {},
}: SettingsViewProps) {
  const { t, locale, setLocale } = useLocale();
  const [activeTab, setActiveTab] = useState("session");
  const [search, setSearch] = useState("");
  const [searchActive, setSearchActive] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Honor a deep-link request (e.g. the gear / ⌘, jump to Studio Appearance).
  useEffect(() => {
    if (focus?.group) setActiveTab(focus.group);
  }, [focus]);

  const activeSectionIndex = Math.min(
    Math.max(state.sidebar.activeSection, 0),
    Math.max(state.sidebar.sections.length - 1, 0),
  );
  const writeCover = (patch: Partial<OverlayState["cover"]>) =>
    onChange(patchSection(state, "cover", patch));

  // Field search — a settings-fields search, honest about its scope. A hit
  // switches groups and scrolls to the anchored row (or the group panel).
  const query = search.trim().toLowerCase();
  const hits = query
    ? FIELD_INDEX.filter(
        (f) => f.terms.some((term) => term.includes(query)) || t(f.labelKey).toLowerCase().includes(query),
      )
    : [];
  const searchOpen = query !== "" && hits.length > 0;
  const searchIndex = Math.min(searchActive, Math.max(hits.length - 1, 0));

  const goToField = (entry: FieldEntry) => {
    setSearch("");
    setActiveTab(entry.group);
    window.requestAnimationFrame(() => {
      const target =
        document.getElementById(`settings-row-${entry.id}`) ??
        document.getElementById(`settings-panel-${entry.group}`);
      if (!target) return;
      const previousTabIndex = target.getAttribute("tabindex");
      const previousTransition = target.style.transition;
      const previousOutline = target.style.outline;
      const previousOutlineOffset = target.style.outlineOffset;
      const previousBorderRadius = target.style.borderRadius;
      target.scrollIntoView({ block: "center", behavior: "smooth" });
      if (previousTabIndex === null) target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
      // A brief highlight ring so the user sees where the jump landed (the
      // target group is already highlighted via the active tab).
      target.style.transition = "outline-color 0.2s";
      target.style.outline = `2px solid ${UI_COLORS.accent}`;
      target.style.outlineOffset = "3px";
      target.style.borderRadius = "4px";
      window.setTimeout(() => {
        if (previousTabIndex === null) target.removeAttribute("tabindex");
        else target.setAttribute("tabindex", previousTabIndex);
        target.style.transition = previousTransition;
        target.style.outline = previousOutline;
        target.style.outlineOffset = previousOutlineOffset;
        target.style.borderRadius = previousBorderRadius;
      }, 1100);
    });
  };

  // Search keyboard: ↑/↓ highlight, Enter jumps, Esc clears. A document capture
  // listener (registered before the dialog's) lets Esc clear the search without
  // closing the dialog; it only acts while the search input is focused. Live
  // state is read via a ref so the mount-only listener never goes stale.
  const searchRef = useRef({ query, open: searchOpen, hits, index: searchIndex, go: goToField });
  searchRef.current = { query, open: searchOpen, hits, index: searchIndex, go: goToField };
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const st = searchRef.current;
      if (!st.query || document.activeElement !== searchInputRef.current) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setSearch("");
        return;
      }
      if (!st.open || st.hits.length === 0) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setSearchActive((i) => (i + 1) % st.hits.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setSearchActive((i) => (i - 1 + st.hits.length) % st.hits.length);
      } else if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        st.go(st.hits[Math.min(st.index, st.hits.length - 1)]);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, []);

  // Scannable summaries for the big editors (presentational only).
  const sections = state.sidebar.sections;
  const curDone = (state.sidebar.sectionsDone?.[activeSectionIndex] ?? []).filter(Boolean).length;
  const curTotal = sections[activeSectionIndex]?.bullets.length ?? 0;
  const sectionsSummary = `${sections.length} ${t("settingsSummary.sectionsUnit")} · ${t("settingsSummary.current")} ${activeSectionIndex + 1} · ${curDone}/${curTotal} ${t("settingsSummary.done")}`;
  const stackSummary = `${state.stack.items.length} ${t("settingsSummary.items")}`;
  const badgesSummary = `${state.cover.badges.length} · ${state.cover.badges.filter((b) => b.visible).length} ${t("settingsSummary.visible")}`;
  const socialsSummary = `${state.cover.socials.length} · ${state.cover.socials.filter((s) => s.visible).length} ${t("settingsSummary.visible")}`;
  const barSegments = activeBarSegments(state);
  const bottomBarSummary = `${barSegments.length} ${t("settingsSummary.segments")} · ${barSegments.map((s) => s.kind).join(" / ")}`;

  const tabs: TabDef[] = [
    {
      // Session — the whole v1 portable core in one place, mirroring the JSON,
      // with a save/load "studio default" action instead of a duplicate group.
      id: "session",
      titleKey: "settingsGroup.session",
      hintKey: "settingsGroup.sessionHint",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <SettingRow rowId="language" title={t("settingsRow.languageTitle")} description={t("settingsRow.languageDesc")}>
            <SettingsSelector
              options={[
                { value: "zh", label: "中文", testId: "manual-locale-zh" },
                { value: "en", label: "English", testId: "manual-locale-en" },
              ]}
              active={locale}
              onSelect={(loc) => setLocale(loc as Locale)}
            />
          </SettingRow>
          <SettingRow rowId="title" title={t("label.title")} description={t("settingsRow.titleDesc")}>
            <TextInput testId="field-title" value={state.cover.title} onChange={(v) => writeCover({ title: v })} placeholder={t("label.title")} />
          </SettingRow>
          <SettingRow rowId="subtitle" title={t("label.subtitle")} description={t("settingsRow.subtitleDesc")}>
            <TextInput testId="field-subtitle" value={state.cover.todayTopic} onChange={(v) => writeCover({ todayTopic: v })} placeholder={t("label.topic")} />
          </SettingRow>
          <SettingRow rowId="author" title={t("settingsRow.authorTitle")} description={t("settingsRow.authorDesc")}>
            <TextInput testId="field-author" value={state.cover.hookText} onChange={(v) => writeCover({ hookText: v })} placeholder={t("settingsRow.authorPlaceholder")} />
          </SettingRow>
          <AssetRow rowId="profile" label={t("settingsRow.profileTitle")} description={t("settingsRow.profileDesc")}>
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
          {/* Lecture brand — rendered by the lecture layouts' header + presenter
              card. Brand layer like the avatar above: the save button below
              snapshots it, and the AI agent never edits it. */}
          <AssetRow rowId="brand" label={t("settingsRow.brandTitle")} description={t("settingsRow.brandDesc")}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={summaryStyle}>{t("brand.logoLabel")}</span>
                <AvatarUploader
                  url={state.brand.logoUrl}
                  onUrlChange={(v) => onChange(patchSection(state, "brand", { logoUrl: v }))}
                  showToggle={false}
                  previewShape="square"
                  testIdPrefix="field-brand-logo"
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={summaryStyle}>{t("brand.seriesLabel")}</span>
                <TextInput
                  testId="field-brand-series"
                  value={state.brand.seriesName}
                  onChange={(v) => onChange(patchSection(state, "brand", { seriesName: v }))}
                  placeholder={t("brand.seriesPlaceholder")}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <span style={summaryStyle}>{t("brand.presenterLinesLabel")}</span>
                <textarea
                  data-testid="field-brand-presenter-lines"
                  value={state.brand.presenterLines.join("\n")}
                  onChange={(e) =>
                    onChange(
                      patchSection(state, "brand", { presenterLines: e.target.value.split("\n") }),
                    )
                  }
                  placeholder={t("brand.presenterLinesPlaceholder")}
                  rows={3}
                  spellCheck={false}
                  style={{ ...workbenchInputStyle, height: "auto", padding: "8px 10px", resize: "vertical", lineHeight: 1.5 }}
                />
              </div>
            </div>
          </AssetRow>
          {/* Studio default — snapshot the identity above for reuse across streams. */}
          <div
            id="settings-row-studioProfile"
            style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingTop: 4 }}
          >
            <span style={{ ...summaryStyle, marginRight: "auto", marginTop: 0 }}>
              {studioProfile ? t("studioProfile.saved") : t("studioProfile.demo")}
            </span>
            <WorkbenchButton
              testId="studio-profile-save"
              tone="accent"
              onClick={() => onSaveStudioProfile(profileFromState(state))}
              style={{ height: 30, padding: "0 12px" }}
            >
              {t("studioProfile.save")}
            </WorkbenchButton>
            <WorkbenchButton
              testId="studio-profile-clear"
              tone="danger"
              onClick={onClearStudioProfile}
              style={{ height: 30, padding: "0 12px" }}
            >
              {t("studioProfile.clear")}
            </WorkbenchButton>
          </div>
          <AssetRow rowId="cover" label={t("cover.visual.label")} description={t("settingsRow.coverDesc")}>
            <CoverVisualEditor state={state} onChange={onChange} />
          </AssetRow>
          <AssetRow rowId="sections" label={`${t("label.section")}s`} description={t("settingsRow.sectionsDesc")} summary={sectionsSummary}>
            <div data-testid="live-data-sections">
              <SectionsManager state={state} onChange={onChange} testIdPrefix="live-data-sections" />
            </div>
          </AssetRow>
          <AssetRow rowId="stack" label={t("group.stack")} description={t("group.stack.hint")} summary={stackSummary}>
            <div data-testid="live-data-stack">
              <StackEditor state={state} onChange={onChange} />
            </div>
          </AssetRow>
          <AssetRow rowId="badges" label={`${t("label.badge")}s`} description={t("settingsRow.badgesDesc")} summary={badgesSummary}>
            <BadgesEditor state={state} onChange={onChange} testIdPrefix="field-badge" />
          </AssetRow>
          <AssetRow rowId="socials" label={`${t("label.social")}s`} description={t("settingsRow.socialsDesc")} summary={socialsSummary}>
            <SocialsEditor state={state} onChange={onChange} testIdPrefix="field-social" />
          </AssetRow>
        </div>
      ),
    },
    {
      // Broadcast — runtime on-screen controls (not in the config file). OBS
      // composition is local-only, so the demo hides it (its route 404s anyway).
      id: "broadcast",
      titleKey: "settingsGroup.broadcast",
      hintKey: "settingsGroup.broadcastHint",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Layout first: it decides which regions exist, then composition fills them. */}
          <AssetRow rowId="layout" label={t("group.layout")} description={t("group.layout.hint")}>
            <LayoutControls state={state} onChange={onChange} />
          </AssetRow>
          <AssetRow rowId="agendaDrive" label={t("group.agendaDrive")} description={t("group.agendaDrive.hint")}>
            <AgendaDrivePanel state={state} onChange={onChange} />
          </AssetRow>
          {!demoMode && (
            <AssetRow rowId="composition" label={t("group.composition")} description={t("group.composition.hint")}>
              <ObsCompositionControls state={state} onChange={onChange} />
            </AssetRow>
          )}
          <div id="settings-row-bottomBar" data-testid="live-data-bottom-bar" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={fieldLabel}>
                {t("group.bottomBarSegments")} · {t(BAR_PROFILE_LABEL[activeBarProfile(state)])}
              </span>
              <span data-testid="settings-summary-bottomBar" style={summaryStyle}>{bottomBarSummary}</span>
            </div>
            {activeBarSegments(state).map((_, idx) => (
              <SettingRow key={idx} title={`${t("label.segment")} ${idx + 1}`} description="">
                <BottomBarSegmentEditor state={state} onChange={onChange} index={idx} />
              </SettingRow>
            ))}
          </div>
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
      // Data & Sync — session lifecycle (start/end + on-air timer, unified here),
      // persistence + OBS-sync status, and the JSON power tool.
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
          <SettingRow rowId="liveTimer" title={t("group.liveSession")} description={t("settingsRow.onAirDesc")}>
            <div data-testid="live-data-live-session">
              <LiveSessionEditor state={state} onChange={onChange} />
            </div>
          </SettingRow>
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
    <div data-testid="settings-view" style={{ display: "flex", flexDirection: "row", minHeight: 0, flex: 1, width: "100%" }}>
      {/* Left rail — a field search + a stable, scannable vertical nav. */}
      <div
        style={{
          width: 200,
          minWidth: 200,
          flexShrink: 0,
          borderRight: `1px solid ${UI_COLORS.border}`,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
          <input
            ref={searchInputRef}
            data-testid="settings-search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearchActive(0); }}
            placeholder={t("settingsView.searchPlaceholder")}
            aria-label={t("settingsView.searchPlaceholder")}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={searchOpen}
            aria-controls="settings-search-results"
            aria-activedescendant={searchOpen ? `settings-search-opt-${searchIndex}` : undefined}
            spellCheck={false}
            style={{
              width: "100%",
              boxSizing: "border-box",
              height: 30,
              border: `1px solid ${UI_COLORS.controlBorder}`,
              borderRadius: 6,
              background: UI_COLORS.inputInset,
              color: UI_COLORS.text,
              fontFamily: "var(--app-font-mono)",
              fontSize: 12,
              padding: "0 10px",
              outline: "none",
            }}
          />
          <div style={{ fontSize: 9, color: UI_COLORS.textSubtle, marginTop: 5, lineHeight: 1.4, letterSpacing: "0.02em" }}>
            {t("settingsView.searchHint")}
          </div>
        </div>

        {query ? (
          <div
            id="settings-search-results"
            data-testid="settings-search-results"
            role="listbox"
            aria-label={t("settingsView.searchPlaceholder")}
            style={{ flex: 1, overflowY: "auto", padding: "2px 8px 12px" }}
          >
            {hits.length === 0 ? (
              <div data-testid="settings-search-empty" style={{ fontSize: 11, color: UI_COLORS.textMuted, padding: "8px 6px" }}>
                {t("settingsView.searchNoResults")}
              </div>
            ) : (
              hits.map((f, i) => {
                const active = i === searchIndex;
                return (
                  <button
                    key={f.id}
                    id={`settings-search-opt-${i}`}
                    data-testid={`settings-search-hit-${f.id}`}
                    role="option"
                    aria-selected={active}
                    onClick={() => goToField(f)}
                    onMouseEnter={() => setSearchActive(i)}
                    style={{
                      appearance: "none",
                      textAlign: "left",
                      width: "100%",
                      border: "none",
                      borderLeft: `2px solid ${active ? UI_COLORS.accent : "transparent"}`,
                      background: active ? cssAlpha(UI_COLORS.accent, 10) : "transparent",
                      cursor: "pointer",
                      borderRadius: 0,
                      padding: "6px 8px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      transition: "background 0.1s, border-color 0.1s",
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: UI_COLORS.textSoft }}>{highlightMatch(t(f.labelKey), query)}</span>
                    {f.descKey && <span style={{ fontSize: 10, color: UI_COLORS.textMuted, lineHeight: 1.35 }}>{highlightMatch(t(f.descKey), query)}</span>}
                    <span style={{ ...fieldLabel, fontSize: 9 }}>{t(`settingsGroup.${f.group}` as TranslationKey)}</span>
                  </button>
                );
              })
            )}
          </div>
        ) : (
          <nav
            data-testid="settings-tab-bar"
            role="tablist"
            aria-orientation="vertical"
            aria-label={t("settingsView.menuLabel")}
            style={{ flex: 1, padding: "4px 12px 16px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}
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
                    color: active ? UI_COLORS.accentText : UI_COLORS.textMuted,
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
        )}
      </div>

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

const summaryStyle: CSSProperties = {
  fontFamily: "var(--app-font-mono)",
  fontSize: 10,
  color: UI_COLORS.textSubtle,
  letterSpacing: "0.02em",
  marginTop: 2,
};

/** Wrap the matched query substring of a label in a highlight mark. */
function highlightMatch(text: string, query: string): ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: cssAlpha(UI_COLORS.accent, 24), color: "inherit", borderRadius: 2, padding: "0 1px" }}>
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

/** A settings row: title + description on the left, control stacked below. */
function SettingRow({ rowId, title, description, children }: { rowId?: string; title: string; description: string; children: ReactNode }) {
  return (
    <div id={rowId ? `settings-row-${rowId}` : undefined} style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 16, marginTop: 16, borderTop: `1px solid ${UI_COLORS.border}` }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: UI_COLORS.textSoft }}>{title}</span>
        {description && <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>{description}</span>}
      </div>
      {children}
    </div>
  );
}

/** A labelled content / brand-asset sub-section (mono label + optional summary). */
function AssetRow({ rowId, label, description, summary, children }: { rowId?: string; label: string; description: string; summary?: string; children: ReactNode }) {
  return (
    <div id={rowId ? `settings-row-${rowId}` : undefined} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={fieldLabel}>{label}</span>
        {description && <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>{description}</span>}
        {summary && <span data-testid={rowId ? `settings-summary-${rowId}` : undefined} style={summaryStyle}>{summary}</span>}
      </div>
      {children}
    </div>
  );
}

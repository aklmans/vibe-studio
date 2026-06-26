import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
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

/** One searchable field within a category — the static field-level index. */
interface SettingField {
  label: string;
  keywords?: string;
}

interface CategoryDef {
  id: string;
  titleKey: TranslationKey;
  hintKey: TranslationKey;
  keywords: string;
  fields: SettingField[];
  render: () => ReactNode;
}

const SETTINGS_CONTENT_MAX_WIDTH = 920;

export default function ManualSettings({
  state,
  onChange,
  persistence,
  onReset,
  onOpenJson,
  onOpenStudioDrawer,
}: ManualSettingsProps) {
  const { t, locale, setLocale } = useLocale();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("general");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSectionIndex = Math.min(
    Math.max(state.sidebar.activeSection, 0),
    Math.max(state.sidebar.sections.length - 1, 0),
  );
  const activeSection = state.sidebar.sections[activeSectionIndex];

  const writeCover = (patch: Partial<OverlayState["cover"]>) =>
    onChange(patchSection(state, "cover", patch));

  const categories: CategoryDef[] = [
    {
      id: "general",
      titleKey: "settingsGroup.general",
      hintKey: "settingsGroup.generalHint",
      keywords: "general language locale app interface",
      fields: [{ label: t("settingsRow.languageTitle"), keywords: "language locale 中文 english" }],
      render: () => (
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
      ),
    },
    {
      id: "session",
      titleKey: "settingsGroup.session",
      hintKey: "settingsGroup.sessionHint",
      keywords: "session title subtitle topic author byline on-air start time",
      fields: [
        { label: t("label.title"), keywords: "title heading" },
        { label: t("label.subtitle"), keywords: "subtitle topic" },
        { label: t("settingsRow.authorTitle"), keywords: "author byline with hook" },
        { label: t("group.liveSession"), keywords: "on-air start time runtime" },
      ],
      render: () => (
        <>
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
      id: "sections",
      titleKey: "settingsGroup.content",
      hintKey: "configForm.sectionsNote",
      keywords: "content sections bullets tasks progress goal done",
      fields: [
        { label: t("label.activeSection"), keywords: "section active" },
        { label: t("label.section"), keywords: "section title bullets" },
      ],
      render: () => (
        <div data-testid="live-data-sections" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={fieldLabel}>{t("label.activeSection")}</span>
            <LineSegmented
              testId="live-data-section-tabs"
              active={String(activeSectionIndex)}
              onSelect={(value) =>
                onChange(patchSection(state, "sidebar", { activeSection: Number(value) }))
              }
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
              <SidebarSectionEditor
                state={state}
                onChange={onChange}
                index={activeSectionIndex}
                accentColor={UI_COLORS.accent}
              />
            </div>
          )}
        </div>
      ),
    },
    {
      id: "stack",
      titleKey: "settingsGroup.stack",
      hintKey: "group.stack.hint",
      keywords: "stack tools services tech",
      fields: [{ label: t("group.stack"), keywords: "stack tools tech" }],
      render: () => (
        <div data-testid="live-data-stack">
          <StackEditor state={state} onChange={onChange} />
        </div>
      ),
    },
    {
      id: "assets",
      titleKey: "settingsGroup.assets",
      hintKey: "settingsGroup.assetsHint",
      keywords: "assets profile avatar cover visual portrait scene badges socials links",
      fields: [
        { label: t("settingsRow.profileTitle"), keywords: "profile avatar headshot visible" },
        { label: t("cover.visual.label"), keywords: "cover visual portrait scene image" },
        { label: `${t("label.badge")}s`, keywords: "badges agent icons" },
        { label: `${t("label.social")}s`, keywords: "socials links handles" },
      ],
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
          <AssetSubSection label={`${t("label.badge")}s`} description={t("settingsRow.badgesDesc")} jsonKey="badges" onOpenJson={onOpenJson}>
            <BadgesEditor state={state} onChange={onChange} testIdPrefix="field-badge" />
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
      keywords: "broadcast display bottom bar segments sidebar surface",
      fields: [{ label: t("group.bottomBarSegments"), keywords: "bottom bar segments display runtime" }],
      render: () => (
        <div data-testid="live-data-bottom-bar" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[0, 1, 2].map((idx) => (
            <SettingRow key={idx} title={`${t("label.segment")} ${idx + 1}`} description="">
              <BottomBarSegmentEditor state={state} onChange={onChange} index={idx} />
            </SettingRow>
          ))}
          <RuleNote>{t("settingsRow.displayNote")}</RuleNote>
        </div>
      ),
    },
    {
      id: "appearance",
      titleKey: "settingsGroup.appearance",
      hintKey: "settingsGroup.appearanceHint",
      keywords: "studio appearance theme colors palette light dark reset",
      fields: [
        { label: t("settings.theme"), keywords: "theme light dark appearance" },
        { label: t("settings.colorsSurface"), keywords: "colors palette accent surface text" },
      ],
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <StudioAppearanceControls
            state={state}
            onChange={onChange}
            onReset={onReset}
            testIdPrefix="studio-"
          />
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
            <WorkbenchButton
              data-testid="open-studio-drawer"
              onClick={onOpenStudioDrawer}
              style={{ height: 30, padding: "0 12px", flexShrink: 0 }}
            >
              {t("settingsRow.openStudioDrawer")}
            </WorkbenchButton>
            <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>
              {t("settingsRow.studioDrawerNote")}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "persistence",
      titleKey: "settingsGroup.persistence",
      hintKey: "settingsGroup.persistenceHint",
      keywords: "persistence db database sync obs live-state draft history",
      fields: [
        { label: t("sourceBar.db"), keywords: "database postgres sync" },
        { label: t("sourceBar.obs"), keywords: "obs live-state runtime" },
      ],
      render: () => (
        <>
          <SummaryRow
            label={t("sourceBar.db")}
            value={persistence.databaseConfigured ? t("sourceBar.dbReady") : t("sourceBar.dbLocal")}
          />
          <SummaryRow label={t("sourceBar.authority")} value={t("sourceBar.localDraft")} />
          <SummaryRow label={t("sourceBar.obs")} value={t("sourceBar.obsState")} />
          <RuleNote>{t("settingsRow.persistenceNote")}</RuleNote>
        </>
      ),
    },
    {
      id: "advanced",
      titleKey: "settingsGroup.advanced",
      hintKey: "settingsGroup.advancedHint",
      keywords: "advanced json config file import export source handoff",
      fields: [{ label: t("config.title"), keywords: "json import export file handoff" }],
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <RuleNote>{t("settingsRow.advancedNote")}</RuleNote>
          <RuleNote>{t("settingsRow.fileStrategyNote")}</RuleNote>
          <WorkbenchButton
            data-testid="open-json-advanced"
            onClick={() => onOpenJson()}
            style={{ alignSelf: "flex-start", height: 32, padding: "0 12px" }}
          >
            {t("drawer.openJson")}
          </WorkbenchButton>
        </div>
      ),
    },
  ];

  const normalized = query.trim().toLowerCase();
  const titleMatches = (c: CategoryDef) =>
    `${t(c.titleKey)} ${c.keywords}`.toLowerCase().includes(normalized);
  const matchedFields = (c: CategoryDef): SettingField[] =>
    normalized
      ? c.fields.filter((f) =>
          `${f.label} ${f.keywords ?? ""}`.toLowerCase().includes(normalized),
        )
      : [];
  const categoryMatches = (c: CategoryDef) =>
    !normalized || titleMatches(c) || matchedFields(c).length > 0;
  const matched = categories.filter(categoryMatches);
  // Flat list of the fields that hit — so the user sees *which* fields matched.
  const fieldHits = normalized
    ? categories.flatMap((c) => matchedFields(c).map((f) => ({ field: f, catId: c.id })))
    : [];

  const jumpToCategory = (id: string) => {
    setActiveCat(id);
    document.getElementById(`config-settings-${id}`)?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  };

  // Lightweight scroll-spy: highlight the tree entry whose group is at the top
  // of the scroll viewport. No observers — just a rAF-throttled scroll read.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = container.getBoundingClientRect().top + 40;
      let current = matched[0]?.id ?? "general";
      for (const c of matched) {
        const el = document.getElementById(`config-settings-${c.id}`);
        if (el && el.getBoundingClientRect().top <= top) current = c.id;
      }
      setActiveCat(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    container.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalized, matched.length]);

  return (
    <div data-testid="manual-settings" style={{ display: "flex", minHeight: 0, flex: 1 }}>
      {/* Category tree */}
      <nav
        data-testid="settings-category-tree"
        style={{
          width: 196,
          minWidth: 196,
          flexShrink: 0,
          borderRight: `1px solid ${UI_COLORS.border}`,
          padding: "16px 0",
          overflowY: "auto",
        }}
      >
        <div style={{ ...fieldLabel, padding: "0 14px", marginBottom: 6 }}>
          {t("manualSettings.categories")}
        </div>
        {categories.map((c) => {
          const dim = Boolean(normalized) && !categoryMatches(c);
          const isActive = !normalized && activeCat === c.id;
          return (
            <button
              key={c.id}
              data-testid={`settings-cat-${c.id}`}
              data-active={isActive ? "true" : undefined}
              aria-current={isActive ? "true" : undefined}
              onClick={() => jumpToCategory(c.id)}
              style={{
                appearance: "none",
                textAlign: "left",
                width: "100%",
                background: isActive ? cssAlpha(UI_COLORS.accent, 8) : "transparent",
                border: "none",
                borderLeft: `2px solid ${isActive ? UI_COLORS.accent : "transparent"}`,
                padding: "6px 14px",
                cursor: "pointer",
                fontFamily: "var(--app-font-mono)",
                fontSize: 11,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: "0.03em",
                color: dim
                  ? UI_COLORS.textSubtle
                  : isActive
                    ? UI_COLORS.text
                    : UI_COLORS.textSoft,
                opacity: dim ? 0.55 : 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "color 0.12s, background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = UI_COLORS.text)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = dim
                  ? UI_COLORS.textSubtle
                  : isActive
                    ? UI_COLORS.text
                    : UI_COLORS.textSoft)
              }
            >
              {t(c.titleKey)}
            </button>
          );
        })}
      </nav>

      {/* Settings rows */}
      <div
        ref={scrollRef}
        style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "18px 28px 56px" }}
      >
        <div style={{ maxWidth: SETTINGS_CONTENT_MAX_WIDTH, display: "flex", flexDirection: "column", gap: 4 }}>
          <input
            data-testid="settings-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("manualSettings.searchPlaceholder")}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: UI_COLORS.inputInset,
              border: `1px solid ${UI_COLORS.controlBorder}`,
              borderRadius: 4,
              padding: "8px 12px",
              fontSize: 13,
              color: UI_COLORS.text,
              fontFamily: "inherit",
              outline: "none",
            }}
          />
          <div
            data-testid="settings-search-help"
            style={{ fontSize: 11, color: UI_COLORS.textSubtle, padding: "4px 2px 0" }}
          >
            {t("manualSettings.searchHelp")}
          </div>
          {normalized && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 2px 0" }}>
              <div
                data-testid="settings-search-count"
                style={{ fontSize: 11, color: UI_COLORS.textMuted }}
              >
                {`${fieldHits.length} ${t("manualSettings.fieldsLabel")} · ${matched.length} ${t("manualSettings.groupsLabel")}`}
              </div>
              {fieldHits.length > 0 && (
                <div data-testid="settings-matched-fields" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {fieldHits.slice(0, 8).map(({ field, catId }, i) => (
                    <button
                      key={`${field.label}-${i}`}
                      data-testid={`settings-matched-field-${i}`}
                      onClick={() => jumpToCategory(catId)}
                      style={{
                        appearance: "none",
                        border: `1px solid ${cssAlpha(UI_COLORS.accent, 32)}`,
                        borderRadius: 3,
                        background: cssAlpha(UI_COLORS.accent, 8),
                        color: UI_COLORS.textSoft,
                        cursor: "pointer",
                        fontFamily: "var(--app-font-mono)",
                        fontSize: 10,
                        letterSpacing: "0.02em",
                        padding: "2px 7px",
                      }}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {matched.map((c) => (
            <SettingsGroup key={c.id} id={c.id} title={t(c.titleKey)} hint={t(c.hintKey)}>
              {c.render()}
            </SettingsGroup>
          ))}
          {matched.length === 0 && (
            <div
              data-testid="settings-search-empty"
              style={{ fontSize: 12, color: UI_COLORS.textMuted, padding: "24px 2px" }}
            >
              {t("manualSettings.noMatches")}
            </div>
          )}
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

function SettingsGroup({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section
      id={`config-settings-${id}`}
      data-testid={`settings-group-${id}`}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        marginTop: 20,
        paddingTop: 20,
        borderTop: `1px solid ${UI_COLORS.rule}`,
        scrollMarginTop: 12,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span aria-hidden style={{ width: 3, height: 14, borderRadius: 2, background: UI_COLORS.accent }} />
          <span
            style={{
              fontFamily: "var(--app-font-mono)",
              fontSize: 11,
              fontWeight: 700,
              color: UI_COLORS.text,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {title}
          </span>
        </div>
        <div style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4, paddingLeft: 11 }}>
          {hint}
        </div>
      </div>
      {children}
    </section>
  );
}

/** A settings row: title + description on the left, control stacked below. */
function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingTop: 14,
        borderTop: `1px solid ${UI_COLORS.border}`,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: UI_COLORS.textSoft }}>{title}</span>
        {description && (
          <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>
            {description}
          </span>
        )}
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingTop: 14,
        borderTop: `1px solid ${UI_COLORS.border}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: UI_COLORS.textSoft }}>{title}</span>
          {description && (
            <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>
              {description}
            </span>
          )}
        </div>
        <EditInJson jsonKey={jsonKey} onOpenJson={onOpenJson} />
      </div>
      {children}
    </div>
  );
}

/** A labelled brand-asset sub-section inside the Assets group. */
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
          {description && (
            <span style={{ fontSize: 11, color: UI_COLORS.textMuted, lineHeight: 1.4 }}>
              {description}
            </span>
          )}
        </div>
        <EditInJson jsonKey={jsonKey} onOpenJson={onOpenJson} />
      </div>
      {children}
    </div>
  );
}

function EditInJson({
  jsonKey,
  onOpenJson,
}: {
  jsonKey: string;
  onOpenJson: (key?: string) => void;
}) {
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
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 12,
        paddingTop: 12,
        borderTop: `1px solid ${UI_COLORS.border}`,
      }}
    >
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

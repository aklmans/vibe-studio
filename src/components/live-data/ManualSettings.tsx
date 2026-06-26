import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { OverlayState } from "../../types";
import type { Locale, TranslationKey } from "../../lib/i18n";
import { UI_COLORS, cssAlpha } from "../../lib/design-tokens";
import { patchSection } from "../../lib/state";
import { useLocale } from "../../hooks/useLocale";
import SidebarSectionEditor from "../SidebarSectionEditor";
import LiveSessionEditor from "../LiveSessionEditor";
import StackEditor from "../StackEditor";
import BottomBarSegmentEditor from "../BottomBarSegmentEditor";
import { WorkbenchButton } from "../shared/Field";
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

interface CategoryDef {
  id: string;
  titleKey: TranslationKey;
  hintKey: TranslationKey;
  keywords: string;
  render: () => ReactNode;
}

const SETTINGS_CONTENT_MAX_WIDTH = 940;

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeSectionIndex = Math.min(
    Math.max(state.sidebar.activeSection, 0),
    Math.max(state.sidebar.sections.length - 1, 0),
  );
  const activeSection = state.sidebar.sections[activeSectionIndex];
  const visibleBadges = state.cover.badges.filter((b) => b.visible).length;
  const visibleSocials = state.cover.socials.filter((s) => s.visible).length;

  const categories: CategoryDef[] = [
    {
      id: "general",
      titleKey: "settingsGroup.general",
      hintKey: "settingsGroup.generalHint",
      keywords: "general language locale app",
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
      keywords: "session title subtitle topic author on-air start time",
      render: () => (
        <>
          <SummaryRow label={t("label.title")} value={state.cover.title || "—"} jsonKey="title" onOpenJson={onOpenJson} />
          <SummaryRow label={t("label.topic")} value={state.cover.todayTopic || "—"} jsonKey="subtitle" onOpenJson={onOpenJson} />
          <RuleNote>{t("settingsRow.sessionInspectorNote")}</RuleNote>
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
      titleKey: "group.sections",
      hintKey: "configForm.sectionsNote",
      keywords: "sections bullets tasks progress goal done",
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
      titleKey: "group.stack",
      hintKey: "group.stack.hint",
      keywords: "stack tools services",
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
      keywords: "socials badges profile avatar links cover",
      render: () => (
        <>
          <SummaryRow label={t("label.social")} value={String(visibleSocials)} jsonKey="socials" onOpenJson={onOpenJson} />
          <SummaryRow label={t("label.badge")} value={String(visibleBadges)} jsonKey="badges" onOpenJson={onOpenJson} />
          <SummaryRow label={t("cover.visual.label")} value={t(`cover.visual.${state.cover.visual}` as TranslationKey)} jsonKey="cover" onOpenJson={onOpenJson} />
          <RuleNote>{t("settingsRow.assetsInspectorNote")}</RuleNote>
        </>
      ),
    },
    {
      id: "display",
      titleKey: "settingsGroup.display",
      hintKey: "settingsGroup.displayHint",
      keywords: "broadcast display bottom bar segments sidebar surface",
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
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <StudioAppearanceControls
            state={state}
            onChange={onChange}
            onReset={onReset}
            testIdPrefix="studio-"
          />
          <WorkbenchButton
            data-testid="open-studio-drawer"
            onClick={onOpenStudioDrawer}
            style={{ alignSelf: "flex-start", height: 30, padding: "0 12px" }}
          >
            {t("settingsRow.openStudioDrawer")}
          </WorkbenchButton>
        </div>
      ),
    },
    {
      id: "persistence",
      titleKey: "settingsGroup.persistence",
      hintKey: "settingsGroup.persistenceHint",
      keywords: "persistence db database sync obs live-state draft history",
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
      keywords: "advanced json config file import export source",
      render: () => (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <RuleNote>{t("settingsRow.advancedNote")}</RuleNote>
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
  const matchesQuery = (c: CategoryDef) =>
    !normalized ||
    `${t(c.titleKey)} ${c.keywords}`.toLowerCase().includes(normalized);
  const matched = categories.filter(matchesQuery);

  const jumpToCategory = (id: string) => {
    document.getElementById(`config-settings-${id}`)?.scrollIntoView({
      block: "start",
      behavior: "smooth",
    });
  };

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
          const dim = Boolean(normalized) && !matchesQuery(c);
          return (
            <button
              key={c.id}
              data-testid={`settings-cat-${c.id}`}
              onClick={() => jumpToCategory(c.id)}
              style={{
                appearance: "none",
                textAlign: "left",
                width: "100%",
                background: "transparent",
                border: "none",
                padding: "6px 14px",
                cursor: "pointer",
                fontFamily: "var(--app-font-mono)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.03em",
                color: dim ? UI_COLORS.textSubtle : UI_COLORS.textSoft,
                opacity: dim ? 0.55 : 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "color 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = UI_COLORS.text)}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = dim ? UI_COLORS.textSubtle : UI_COLORS.textSoft)
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
        <div
          style={{
            width: "100%",
            maxWidth: SETTINGS_CONTENT_MAX_WIDTH,
            marginInline: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
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
          {normalized && (
            <div
              data-testid="settings-search-count"
              style={{ fontSize: 11, color: UI_COLORS.textMuted, padding: "4px 2px 0" }}
            >
              {`${matched.length} / ${categories.length} · ${t("manualSettings.matches")}`}
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

/** A read-only summary row with a value and an Open-JSON-at-key shortcut. */
function SummaryRow({
  label,
  value,
  jsonKey,
  onOpenJson,
}: {
  label: string;
  value: string;
  jsonKey?: string;
  onOpenJson?: (key?: string) => void;
}) {
  const { t } = useLocale();
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
      {jsonKey && onOpenJson && (
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
      )}
    </div>
  );
}

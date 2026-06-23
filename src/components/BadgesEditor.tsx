import { useMemo, useState } from "react";
import type { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import {
  BADGE_ICON_REGISTRY,
  searchBadgeIcons,
  type BadgeConfig,
  type BadgeIconKey,
  type BadgeIconMode,
} from "../lib/badges";
import {
  BADGE_PRESETS,
  addBadgePreset,
  moveVisibleBadge,
} from "../lib/badge-editor";
import { UI_COLORS } from "../lib/design-tokens";
import type { TranslationKey } from "../lib/i18n";
import { useLocale } from "../hooks/useLocale";
import { TextInput } from "./shared/Field";
import { EditorRow, FieldLine, LineSegmented } from "./inspector/EditorRow";
import { BadgeIcon } from "./shared/BadgeIcon";

interface BadgesEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  testIdPrefix?: string;
}

type VisibleBadge = {
  badge: BadgeConfig;
  originalIndex: number;
};

/**
 * Editor for the agent badges shown on Cover/Poster top toolbar. Badges now
 * behave like a compact added list: edit the active rows, remove what is not
 * needed, and search the registry once at the bottom to append more.
 */
export default function BadgesEditor({
  state,
  onChange,
  testIdPrefix = "badge",
}: BadgesEditorProps) {
  const { t } = useLocale();
  const [addQuery, setAddQuery] = useState("");

  const iconModeOptions: { value: BadgeIconMode; label: string }[] = [
    { value: "mono", label: t("badge.mode.mono") },
    { value: "brand", label: t("badge.mode.brand") },
  ];

  const visibleBadges = state.cover.badges.reduce<VisibleBadge[]>(
    (items, badge, originalIndex) => {
      if (badge.visible) items.push({ badge, originalIndex });
      return items;
    },
    [],
  );

  const usedIconKeys = useMemo(
    () =>
      new Set(
        state.cover.badges
          .filter((badge) => badge.visible)
          .map((badge) => badge.iconKey),
      ),
    [state.cover.badges],
  );

  const writeBadges = (badges: BadgeConfig[]) => {
    onChange(patchSection(state, "cover", { badges }));
  };

  const updateBadge = (idx: number, patch: Partial<BadgeConfig>) => {
    writeBadges(
      state.cover.badges.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    );
  };

  const removeBadge = (idx: number) => {
    writeBadges(state.cover.badges.filter((_, i) => i !== idx));
  };

  const moveBadge = (visibleIndex: number, direction: -1 | 1) => {
    writeBadges(moveVisibleBadge(state.cover.badges, visibleIndex, direction));
  };

  const addBadge = (iconKey: BadgeIconKey) => {
    if (usedIconKeys.has(iconKey)) return;
    writeBadges(addBadgePreset(state.cover.badges, [iconKey]));
    setAddQuery("");
  };

  const addPreset = (keys: readonly BadgeIconKey[]) => {
    writeBadges(addBadgePreset(state.cover.badges, keys));
    setAddQuery("");
  };

  const addOptions = useMemo(
    () =>
      searchBadgeIcons(addQuery)
        .filter((meta) => !usedIconKeys.has(meta.iconKey))
        .slice(0, 8),
    [addQuery, usedIconKeys],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {visibleBadges.map(({ badge, originalIndex }, visibleIndex) => {
        const label =
          badge.iconKey === "custom"
            ? badge.label || t("badge.custom")
            : BADGE_ICON_REGISTRY[badge.iconKey]?.label ?? badge.label;
        const categoryLabel =
          badge.iconKey === "custom"
            ? t("badge.category.custom")
            : t(
                `badge.category.${BADGE_ICON_REGISTRY[badge.iconKey].category}` as TranslationKey,
              );

        return (
          <EditorRow
            key={`${badge.iconKey}-${originalIndex}`}
            index={visibleIndex + 1}
            title={
              <>
                <BadgeIcon
                  iconKey={badge.iconKey}
                  mode="mono"
                  color={UI_COLORS.textSoft}
                  size={16}
                  label={label}
                />
                <span
                  style={{
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  }}
                >
                  {badge.label || label || `${t("label.badge")} ${visibleIndex + 1}`}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    fontFamily: "var(--app-font-mono)",
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: UI_COLORS.textSubtle,
                    textTransform: "uppercase",
                  }}
                >
                  {categoryLabel}
                </span>
              </>
            }
            action={
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexShrink: 0,
                }}
              >
                <BadgeToolButton
                  testId={`${testIdPrefix}-${visibleIndex}-move-up`}
                  label={t("btn.moveUp")}
                  glyph="↑"
                  disabled={visibleIndex === 0}
                  onClick={() => moveBadge(visibleIndex, -1)}
                />
                <BadgeToolButton
                  testId={`${testIdPrefix}-${visibleIndex}-move-down`}
                  label={t("btn.moveDown")}
                  glyph="↓"
                  disabled={visibleIndex === visibleBadges.length - 1}
                  onClick={() => moveBadge(visibleIndex, 1)}
                />
                <BadgeToolButton
                  testId={`${testIdPrefix}-${visibleIndex}-remove`}
                  label={t("btn.remove")}
                  glyph="×"
                  danger
                  onClick={() => removeBadge(originalIndex)}
                />
              </div>
            }
          >
            <LineSegmented
              active={badge.iconMode}
              onSelect={(value) =>
                updateBadge(originalIndex, { iconMode: value as BadgeIconMode })
              }
              options={iconModeOptions.map((opt) => ({
                value: opt.value,
                label: opt.label,
                testId: `${testIdPrefix}-${visibleIndex}-mode-${opt.value}`,
              }))}
            />

            <FieldLine label={t("label.displayLabel")}>
              <TextInput
                testId={`${testIdPrefix}-${visibleIndex}-label`}
                value={badge.label}
                onChange={(label) => updateBadge(originalIndex, { label })}
                placeholder={t("label.displayLabel")}
              />
            </FieldLine>
          </EditorRow>
        );
      })}

      {visibleBadges.length === 0 && (
        <div
          data-testid={`${testIdPrefix}-empty-hint`}
          style={{
            padding: "12px 0",
            borderTop: `1px solid ${UI_COLORS.border}`,
            fontFamily: "var(--app-font-mono)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.04em",
            lineHeight: 1.6,
            color: UI_COLORS.textMuted,
          }}
        >
          {t("badge.empty")}
        </div>
      )}

      <BadgePresetRail
        presets={BADGE_PRESETS}
        usedIconKeys={usedIconKeys}
        testIdPrefix={testIdPrefix}
        onAdd={addPreset}
      />

      <div
        style={{
          paddingTop: 12,
          borderTop: `1px solid ${UI_COLORS.border}`,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <FieldLine label={t("label.search")}>
          <TextInput
            testId={`${testIdPrefix}-add-search`}
            value={addQuery}
            onChange={setAddQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter" && addOptions[0]) {
                e.preventDefault();
                addBadge(addOptions[0].iconKey);
              }
            }}
            placeholder={t("badge.searchPlaceholder")}
            mono
          />
        </FieldLine>

        <BadgeAddResults
          options={addOptions}
          testIdPrefix={testIdPrefix}
          onAdd={addBadge}
        />
      </div>
    </div>
  );
}

function BadgeToolButton({
  testId,
  label,
  glyph,
  disabled = false,
  danger = false,
  onClick,
}: {
  testId: string;
  label: string;
  glyph: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      style={{
        width: 26,
        minWidth: 26,
        height: 30,
        minHeight: 30,
        border: "none",
        background: "transparent",
        color: disabled ? UI_COLORS.textSubtle : UI_COLORS.textMuted,
        opacity: disabled ? 0.38 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--app-font-mono)",
        fontSize: 14,
        fontWeight: 650,
        lineHeight: 1,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color 0.12s, opacity 0.12s",
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLElement).style.color = danger
          ? UI_COLORS.danger
          : UI_COLORS.accentText;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = disabled
          ? UI_COLORS.textSubtle
          : UI_COLORS.textMuted;
      }}
    >
      {glyph}
    </button>
  );
}

function BadgePresetRail({
  presets,
  usedIconKeys,
  testIdPrefix,
  onAdd,
}: {
  presets: typeof BADGE_PRESETS;
  usedIconKeys: Set<BadgeIconKey>;
  testIdPrefix: string;
  onAdd: (keys: readonly BadgeIconKey[]) => void;
}) {
  const { t } = useLocale();

  return (
    <div
      style={{
        paddingTop: 12,
        borderTop: `1px solid ${UI_COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <span
        style={{
          fontFamily: "var(--app-font-mono)",
          fontSize: 10,
          fontWeight: 650,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: UI_COLORS.textMuted,
        }}
      >
        {t("badge.presets")}
      </span>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          borderTop: `1px solid ${UI_COLORS.border}`,
          borderBottom: `1px solid ${UI_COLORS.border}`,
        }}
      >
        {presets.map((preset, i) => {
          const disabled = preset.keys.every((key) => usedIconKeys.has(key));
          return (
            <button
              key={preset.id}
              data-testid={`${testIdPrefix}-preset-${preset.id}`}
              disabled={disabled}
              onClick={() => onAdd(preset.keys)}
              style={{
                minWidth: 0,
                padding: "8px 8px 7px",
                border: "none",
                borderRight: i % 2 === 0 ? `1px solid ${UI_COLORS.border}` : "none",
                borderBottom:
                  i < presets.length - 2 ? `1px solid ${UI_COLORS.border}` : "none",
                background: "transparent",
                color: disabled ? UI_COLORS.textSubtle : UI_COLORS.textSoft,
                opacity: disabled ? 0.48 : 1,
                cursor: disabled ? "not-allowed" : "pointer",
                textAlign: "left",
                fontFamily: "var(--app-font-mono)",
                fontSize: 10,
                fontWeight: 650,
                letterSpacing: "0.035em",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BadgeAddResults({
  options,
  testIdPrefix,
  onAdd,
}: {
  options: ReturnType<typeof searchBadgeIcons>;
  testIdPrefix: string;
  onAdd: (iconKey: BadgeIconKey) => void;
}) {
  const { t } = useLocale();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        borderTop: `1px solid ${UI_COLORS.border}`,
        borderBottom: `1px solid ${UI_COLORS.border}`,
      }}
    >
      {options.map((meta, i) => {
        const categoryLabel = t(
          `badge.category.${meta.category}` as TranslationKey,
        );
        const addLabel = `${t("btn.add")} ${meta.label}`;
        return (
          <button
            key={meta.iconKey}
            data-testid={`${testIdPrefix}-add-${meta.iconKey}`}
            onClick={() => onAdd(meta.iconKey)}
            title={addLabel}
            aria-label={addLabel}
            style={{
              minWidth: 0,
              display: "grid",
              gridTemplateColumns: "18px minmax(0, 1fr) 18px",
              alignItems: "center",
              gap: 8,
              padding: "8px 8px 7px",
              border: "none",
              borderRight:
                i % 2 === 0 ? `1px solid ${UI_COLORS.border}` : "none",
              borderBottom:
                i < options.length - 2 ? `1px solid ${UI_COLORS.border}` : "none",
              background: "transparent",
              color: UI_COLORS.textMuted,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <BadgeIcon
              iconKey={meta.iconKey}
              mode="mono"
              color={UI_COLORS.textMuted}
              size={15}
              label={meta.label}
            />
            <span
              style={{
                minWidth: 0,
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                overflow: "hidden",
                whiteSpace: "nowrap",
              }}
            >
              <span
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  fontFamily: "var(--app-font-mono)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  color: UI_COLORS.textSoft,
                }}
              >
                {meta.label}
              </span>
              <span
                style={{
                  flexShrink: 0,
                  fontFamily: "var(--app-font-mono)",
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: UI_COLORS.textSubtle,
                }}
              >
                {categoryLabel}
              </span>
            </span>
            <span
              aria-hidden="true"
              style={{
                color: UI_COLORS.accentText,
                fontFamily: "var(--app-font-mono)",
                fontSize: 14,
                lineHeight: 1,
                textAlign: "center",
              }}
            >
              +
            </span>
          </button>
        );
      })}
    </div>
  );
}

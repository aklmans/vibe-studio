import { useMemo, useState } from "react";
import type { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import {
  BADGE_ICON_REGISTRY,
  badgeLabelForIconKey,
  searchBadgeIcons,
  type BadgeConfig,
  type BadgeIconKey,
  type BadgeIconMode,
} from "../lib/badges";
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
    () => new Set(visibleBadges.map(({ badge }) => badge.iconKey)),
    [visibleBadges],
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

  const addBadge = (iconKey: BadgeIconKey) => {
    if (usedIconKeys.has(iconKey)) return;
    writeBadges([
      ...state.cover.badges,
      {
        visible: true,
        iconKey,
        iconMode: "brand",
        label: badgeLabelForIconKey(iconKey),
        customIconUrl: "",
      },
    ]);
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
              <RemoveBadgeButton
                testId={`${testIdPrefix}-${visibleIndex}-remove`}
                label={t("btn.remove")}
                onClick={() => removeBadge(originalIndex)}
              />
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

function RemoveBadgeButton({
  testId,
  label,
  onClick,
}: {
  testId: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{
        width: 30,
        minWidth: 30,
        height: 30,
        minHeight: 30,
        border: "none",
        background: "transparent",
        color: UI_COLORS.textSubtle,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 16,
        lineHeight: 1,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color 0.12s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = UI_COLORS.danger;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = UI_COLORS.textSubtle;
      }}
    >
      ×
    </button>
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

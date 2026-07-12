import { useMemo, useState } from "react";
import type { OverlayState } from "../types";
import { patchSection } from "../lib/state";
import { BRAND_ICON_PRESETS, type BrandIconKey, type BrandIconMode } from "../lib/brand-icons";
import {
  searchSocialIconOptions,
  socialIconLabel,
  type SocialConfig,
  type SocialIconOption,
} from "../lib/socials";
import { UI_COLORS } from "../lib/design-tokens";
import { useLocale } from "../hooks/useLocale";
import { editorialPalette } from "./lib/editorial-palette";
import { TextInput } from "./shared/Field";
import { BrandIcon } from "./shared/BrandIcon";
import IconSearchPicker, { type IconSearchPickerOption, type IconSearchPickerPreset } from "./shared/IconSearchPicker";
import {
  EditorRow,
  FieldLine,
  FIELD_CONTENT_INSET,
  LineSegmented,
  RuleNote,
} from "./inspector/EditorRow";

interface SocialsEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  testIdPrefix?: string;
}

type VisibleSocial = {
  social: SocialConfig;
  originalIndex: number;
};

interface SocialPreset {
  id: string;
  label: string;
  keys: readonly BrandIconKey[];
}

/**
 * Editor for the social-link list shown in Sidebar / Overlay sidebar / Poster
 * footer. It follows the same add-list pattern as badges and the tool stack:
 * visible rows are the active list; add a platform by search, or add a custom
 * link when the registry does not have the icon the user needs.
 */
export default function SocialsEditor({
  state,
  onChange,
  testIdPrefix = "social",
}: SocialsEditorProps) {
  const { locale, t } = useLocale();
  const palette = editorialPalette(state.colors);
  const [addQuery, setAddQuery] = useState("");

  const visibleSocials = state.cover.socials.reduce<VisibleSocial[]>(
    (items, social, originalIndex) => {
      if (social.visible) items.push({ social, originalIndex });
      return items;
    },
    [],
  );

  const usedIconKeys = useMemo(
    () => new Set(visibleSocials.map(({ social }) => social.iconKey).filter(Boolean)),
    [visibleSocials],
  );

  const socialPresets = useMemo<SocialPreset[]>(() => {
    const presetLabel = (id: string) =>
      BRAND_ICON_PRESETS.find((preset) => preset.id === id)?.label ?? id;
    return [
      {
        id: "social",
        label: presetLabel("social"),
        keys: ["x", "github", "website", "discord", "wechat", "telegram"],
      },
      {
        id: "streaming",
        label: presetLabel("streaming"),
        keys: ["youtube", "bilibili"],
      },
    ];
  }, []);

  const addOptions = useMemo<IconSearchPickerOption[]>(() => {
    const platformOptions = searchSocialIconOptions(addQuery, locale)
      .filter((option) => !usedIconKeys.has(option.iconKey))
      .slice(0, 8)
      .map((option) => ({
        id: option.iconKey,
        label: option.label,
        icon: (
          <BrandIcon
            iconKey={option.iconKey}
            mode="mono"
            color={UI_COLORS.textMuted}
            size={13}
            label={option.label}
          />
        ),
      }));
    return [...platformOptions, { id: "custom", label: t("label.custom") }];
  }, [addQuery, locale, t, usedIconKeys]);

  const writeSocials = (socials: SocialConfig[]) => {
    onChange(patchSection(state, "cover", { socials }));
  };

  const updateSocial = (idx: number, patch: Partial<SocialConfig>) => {
    writeSocials(
      state.cover.socials.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  };

  const removeSocial = (idx: number) => {
    writeSocials(state.cover.socials.filter((_, i) => i !== idx));
  };

  const moveSocial = (visibleIndex: number, direction: -1 | 1) => {
    const target = visibleSocials[visibleIndex + direction];
    const current = visibleSocials[visibleIndex];
    if (!current || !target) return;
    const socials = [...state.cover.socials];
    [socials[current.originalIndex], socials[target.originalIndex]] = [
      socials[target.originalIndex],
      socials[current.originalIndex],
    ];
    writeSocials(socials);
  };

  const addSocial = (iconKey?: BrandIconKey) => {
    if (iconKey && usedIconKeys.has(iconKey)) return;
    const label = iconKey ? socialIconLabel(iconKey, locale) : t("label.custom");

    writeSocials([
      ...state.cover.socials,
      {
        visible: true,
        iconKey,
        iconMode: "mono",
        label,
        value: "",
        customColor: iconKey ? "" : palette.primaryMark,
      },
    ]);
    setAddQuery("");
  };

  const addSocialPreset = (preset: SocialPreset) => {
    const additions = preset.keys.filter((key) => !usedIconKeys.has(key));
    if (additions.length === 0) return;
    writeSocials([
      ...state.cover.socials,
      ...additions.map((iconKey) => ({
        visible: true,
        iconKey,
        iconMode: "mono" as const,
        label: socialIconLabel(iconKey, locale),
        value: "",
        customColor: "",
      })),
    ]);
    setAddQuery("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <RuleNote>{t("mapping.socials")}</RuleNote>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {visibleSocials.map(({ social, originalIndex }, visibleIndex) => (
          <EditorRow
            key={`${social.iconKey ?? "custom"}-${originalIndex}`}
            index={visibleIndex + 1}
            title={
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span
                  data-testid={`${testIdPrefix}-${visibleIndex}-icon`}
                  style={{ display: "inline-flex", alignItems: "center", width: 16, flexShrink: 0 }}
                >
                  <BrandIcon
                    iconKey={social.iconKey}
                    mode={social.iconMode}
                    color={UI_COLORS.textMuted}
                    size={14}
                    label={social.label}
                  />
                  {!social.iconKey && (
                    <span
                      aria-hidden="true"
                      style={{
                        width: 12,
                        height: 12,
                        borderLeft: `2px solid ${social.customColor || palette.primaryMark}`,
                      }}
                    />
                  )}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {social.label || `${t("label.social")} ${visibleIndex + 1}`}
                </span>
              </span>
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
                <SocialToolButton
                  testId={`${testIdPrefix}-${visibleIndex}-move-up`}
                  label={t("btn.moveUp")}
                  glyph="↑"
                  disabled={visibleIndex === 0}
                  onClick={() => moveSocial(visibleIndex, -1)}
                />
                <SocialToolButton
                  testId={`${testIdPrefix}-${visibleIndex}-move-down`}
                  label={t("btn.moveDown")}
                  glyph="↓"
                  disabled={visibleIndex === visibleSocials.length - 1}
                  onClick={() => moveSocial(visibleIndex, 1)}
                />
                <SocialToolButton
                  testId={`${testIdPrefix}-${visibleIndex}-remove`}
                  label={t("btn.remove")}
                  glyph="×"
                  danger
                  onClick={() => removeSocial(originalIndex)}
                />
              </div>
            }
          >
            {social.iconKey && (
              <LineSegmented
                active={social.iconMode}
                columns={2}
                onSelect={(value) =>
                  updateSocial(originalIndex, { iconMode: value as BrandIconMode })
                }
                options={[
                  {
                    value: "mono",
                    label: "Mono",
                    testId: `${testIdPrefix}-${visibleIndex}-mode-mono`,
                  },
                  {
                    value: "brand",
                    label: "Brand",
                    testId: `${testIdPrefix}-${visibleIndex}-mode-brand`,
                  },
                ]}
              />
            )}

            <FieldLine label={t("label.socialLabel")}>
              <TextInput
                testId={`${testIdPrefix}-${visibleIndex}-label`}
                value={social.label}
                onChange={(label) => updateSocial(originalIndex, { label })}
                placeholder={t("label.socialLabel")}
              />
            </FieldLine>

            <FieldLine label={t("label.socialValue")}>
              <TextInput
                testId={`${testIdPrefix}-${visibleIndex}-value`}
                value={social.value}
                onChange={(value) => updateSocial(originalIndex, { value })}
                placeholder={t("label.socialValue")}
                mono
              />
            </FieldLine>

            {!social.iconKey && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingLeft: FIELD_CONTENT_INSET,
                }}
              >
                <input
                  data-testid={`${testIdPrefix}-${visibleIndex}-color`}
                  type="color"
                  value={social.customColor || palette.primaryMark}
                  onChange={(e) =>
                    updateSocial(originalIndex, { customColor: e.target.value })
                  }
                  style={{
                    width: 22,
                    height: 18,
                    border: `1px solid ${UI_COLORS.controlBorder}`,
                    borderRadius: 0,
                    padding: 1,
                    background: "transparent",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--app-font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: UI_COLORS.textMuted,
                  }}
                >
                  {t("label.customColor")}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 11,
                    fontFamily: "var(--app-font-mono)",
                    color: UI_COLORS.textSubtle,
                  }}
                >
                  {social.customColor || "—"}
                </span>
              </div>
            )}
          </EditorRow>
        ))}
      </div>

      {visibleSocials.length === 0 && (
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
          {t("social.empty")}
        </div>
      )}

      <IconSearchPicker
        testIdPrefix={testIdPrefix}
        query={addQuery}
        onQueryChange={setAddQuery}
        placeholder={t("social.searchPlaceholder")}
        presets={socialPresets.map((preset): IconSearchPickerPreset => ({
          id: preset.id,
          label: preset.label,
          disabled: preset.keys.every((key) => usedIconKeys.has(key)),
        }))}
        options={addOptions}
        onSelectPreset={(preset) => {
          const found = socialPresets.find((item) => item.id === preset.id);
          if (found) addSocialPreset(found);
        }}
        onSelectOption={(option) =>
          addSocial(option.id === "custom" ? undefined : (option.id as BrandIconKey))
        }
      />
    </div>
  );
}

function SocialToolButton({
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

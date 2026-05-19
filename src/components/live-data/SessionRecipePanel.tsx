import { useState, type CSSProperties } from "react";
import type { OverlayState } from "../../types";
import { useLocale } from "../../hooks/useLocale";
import { UI_BORDERS, UI_COLORS } from "../../lib/design-tokens";
import {
  applySessionRecipeToOverlayState,
  formatSessionRecipeMarkdown,
  parseSessionRecipe,
  stateToSessionRecipe,
} from "../../lib/session-recipe";

interface SessionRecipePanelProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

const panelStyle: CSSProperties = {
  minWidth: 0,
  background: UI_COLORS.appSurface,
  border: `1px solid ${UI_COLORS.panelSurface}`,
  borderRadius: 8,
  overflow: "hidden",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 172,
  resize: "vertical",
  border: UI_BORDERS.control,
  borderRadius: 8,
  background: UI_COLORS.controlSurface,
  color: UI_COLORS.text,
  outline: "none",
  padding: "12px 14px",
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  fontSize: 12,
  lineHeight: 1.55,
};

export default function SessionRecipePanel({
  state,
  onChange,
}: SessionRecipePanelProps) {
  const { t, locale } = useLocale();
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");

  const applyRecipe = () => {
    if (!draft.trim()) {
      setMessage(t("recipe.empty"));
      return;
    }

    const recipe = parseSessionRecipe(draft, locale);
    onChange(applySessionRecipeToOverlayState(state, recipe, locale));
    setMessage(t("recipe.applied"));
  };

  const exportCurrentRecipe = () => {
    const markdown = formatSessionRecipeMarkdown(stateToSessionRecipe(state));
    setDraft(markdown);
    setMessage(t("recipe.exported"));

    if (!navigator.clipboard) {
      return;
    }

    void navigator.clipboard.writeText(markdown).catch(() => {
      setMessage(t("recipe.copyFailed"));
    });
  };

  return (
    <section data-testid="session-recipe-panel" style={panelStyle}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: UI_COLORS.text,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 3,
                  height: 14,
                  borderRadius: 2,
                  background: UI_COLORS.purple,
                  boxShadow: `0 0 14px ${UI_COLORS.purple}66`,
                }}
              />
              {t("recipe.title")}
            </div>
            <div
              style={{
                maxWidth: 760,
                fontSize: 11,
                color: UI_COLORS.textMuted,
                lineHeight: 1.45,
              }}
            >
              {t("recipe.hint")}
            </div>
          </div>

          {message && (
            <div
              style={{
                flexShrink: 0,
                maxWidth: 280,
                fontSize: 11,
                color: UI_COLORS.focus,
                background: UI_COLORS.previewBadgeSurface,
                border: UI_BORDERS.control,
                borderRadius: 6,
                padding: "4px 8px",
                lineHeight: 1.4,
              }}
            >
              {message}
            </div>
          )}
        </div>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t("recipe.placeholder")}
          spellCheck={false}
          style={textareaStyle}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <RecipeButton onClick={exportCurrentRecipe}>
            {t("recipe.exportCurrent")}
          </RecipeButton>
          <RecipeButton onClick={applyRecipe} accentColor={UI_COLORS.purple}>
            {t("recipe.apply")}
          </RecipeButton>
        </div>
      </div>
    </section>
  );
}

function RecipeButton({
  children,
  onClick,
  accentColor = UI_COLORS.textSoft,
}: {
  children: React.ReactNode;
  onClick: () => void;
  accentColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: 118,
        height: 32,
        borderRadius: 7,
        border: `1px solid ${accentColor}66`,
        background: `${accentColor}18`,
        color: accentColor,
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 12,
        fontWeight: 650,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </button>
  );
}

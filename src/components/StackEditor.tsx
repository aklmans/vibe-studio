import { useState } from "react";
import type { OverlayState } from "../types";
import { UI_COLORS } from "../lib/design-tokens";
import { patchSection } from "../lib/state";
import { useLocale } from "../hooks/useLocale";

interface StackEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
}

/**
 * Inline editor for the tool stack (Claude / Cursor / etc) shown in the
 * bottom-bar Stack slot. Items are an ordered string list; each row supports
 * inline edit + delete, and a single input at the bottom appends.
 */
export default function StackEditor({ state, onChange }: StackEditorProps) {
  const { t } = useLocale();
  const [draft, setDraft] = useState("");

  const writeItems = (items: string[]) => {
    onChange(patchSection(state, "stack", { items }));
  };

  const updateItem = (idx: number, value: string) => {
    writeItems(state.stack.items.map((s, i) => (i === idx ? value : s)));
  };

  const removeItem = (idx: number) => {
    writeItems(state.stack.items.filter((_, i) => i !== idx));
  };

  const addItem = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    writeItems([...state.stack.items, trimmed]);
    setDraft("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {state.stack.items.map((item, idx) => (
        <div key={idx} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            data-testid={`stack-item-${idx}`}
            value={item}
            onChange={(e) => updateItem(idx, e.target.value)}
            style={{
              flex: 1,
              background: UI_COLORS.controlSurface,
              border: `1px solid ${UI_COLORS.controlBorder}`,
              borderRadius: 6,
              padding: "6px 10px",
              fontSize: 13,
              color: UI_COLORS.text,
              outline: "none",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = UI_COLORS.focus)}
            onBlur={(e) => (e.target.style.borderColor = UI_COLORS.controlBorder)}
          />
          <button
            data-testid={`stack-remove-${idx}`}
            onClick={() => removeItem(idx)}
            title={t("btn.remove")}
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: `1px solid ${UI_COLORS.controlBorder}`,
              background: UI_COLORS.controlSurface,
              color: UI_COLORS.textMuted,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = UI_COLORS.danger;
              (e.currentTarget as HTMLElement).style.borderColor = `${UI_COLORS.danger}60`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = UI_COLORS.textMuted;
              (e.currentTarget as HTMLElement).style.borderColor = UI_COLORS.controlBorder;
            }}
          >
            ×
          </button>
        </div>
      ))}

      <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
        <input
          data-testid="stack-add-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder={t("stackEditor.placeholder")}
          style={{
            flex: 1,
            background: UI_COLORS.controlSurface,
            border: `1px dashed ${UI_COLORS.controlBorder}`,
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 13,
            color: UI_COLORS.text,
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
          onFocus={(e) => (e.target.style.borderColor = UI_COLORS.focus)}
          onBlur={(e) => (e.target.style.borderColor = UI_COLORS.controlBorder)}
        />
        <button
          data-testid="stack-add"
          onClick={addItem}
          disabled={!draft.trim()}
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            border: `1px solid ${UI_COLORS.controlBorder}`,
            background: draft.trim() ? UI_COLORS.panelSurface : UI_COLORS.controlSurface,
            color: draft.trim() ? UI_COLORS.cyan : UI_COLORS.textSubtle,
            cursor: draft.trim() ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            fontSize: 16,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          +
        </button>
      </div>
    </div>
  );
}

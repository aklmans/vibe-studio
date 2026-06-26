import { useEffect, useRef, type CSSProperties } from "react";
import type { OverlayState } from "../../types";
import { UI_COLORS, cssAlpha } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import SessionConfigEditor from "./SessionConfigEditor";
import { focusTargetTestId, needsFocusRetry } from "./drawer-focus";

interface ConfigJsonDrawerProps {
  open: boolean;
  onClose: () => void;
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  /** When opened from a setting row, jump to this JSON key. */
  focusKey?: string | null;
}

/** JSON keys the user can jump to — the shape of the v1 portable core. */
const MODULE_KEYS = [
  "title",
  "subtitle",
  "profile",
  "cover",
  "badges",
  "stack",
  "socials",
  "sections",
] as const;

const monoLabel: CSSProperties = {
  fontFamily: "var(--app-font-mono)",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: UI_COLORS.textSubtle,
};

/**
 * Global JSON drawer. The live-session.config.json source is first-class but
 * not a daily nav page — it slides in over the current context and away. It
 * reuses SessionConfigEditor untouched (Synced / Editing / Apply / Discard /
 * Import / Export / drift warning) and adds lightweight module jumps.
 *
 * Focus management: on open it stores the trigger, focuses the close button
 * (and jumps to a key if requested); on close it restores focus to the trigger.
 * While closed the panel is `inert`, so its controls can't be tabbed into.
 * Always mounted (so the editor keeps its synced projection / editing buffer).
 */
export default function ConfigJsonDrawer({
  open,
  onClose,
  state,
  onChange,
  focusKey,
}: ConfigJsonDrawerProps) {
  const { t } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Lightweight locate: select the key inside the JSON textarea and scroll it
  // into view. Works on whatever the editor currently shows (synced or draft).
  const locateKey = (key: string) => {
    const ta = panelRef.current?.querySelector(
      '[data-testid="config-input"]',
    ) as HTMLTextAreaElement | null;
    if (!ta) return;
    const idx = ta.value.indexOf(`"${key}"`);
    if (idx < 0) return;
    ta.focus();
    ta.setSelectionRange(idx, idx + key.length + 2);
    const line = ta.value.slice(0, idx).split("\n").length - 1;
    ta.scrollTop = Math.max(0, line * 20 - 48);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (open && e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    const panel = panelRef.current;
    if (open) {
      restoreFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      if (panel) panel.inert = false;
      // Move focus into the dialog once the panel is no longer inert. A key jump
      // focuses the textarea; otherwise focus the close button (focusTargetTestId).
      // We retry on the next macrotask because the opening click can otherwise
      // reclaim focus to its trigger, stranding it behind the scrim (needsFocusRetry).
      const focusIntoDialog = () => {
        if (focusKey) {
          locateKey(focusKey);
          return;
        }
        const target = panel?.querySelector(
          `[data-testid="${focusTargetTestId(focusKey)}"]`,
        );
        if (target instanceof HTMLElement) target.focus();
      };
      const raf = requestAnimationFrame(focusIntoDialog);
      const timer = window.setTimeout(() => {
        if (needsFocusRetry(panel, document.activeElement)) focusIntoDialog();
      }, 0);
      return () => {
        cancelAnimationFrame(raf);
        window.clearTimeout(timer);
      };
    }
    if (panel) panel.inert = true;
    restoreFocusRef.current?.focus?.();
    restoreFocusRef.current = null;
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, focusKey]);

  return (
    <div aria-hidden={!open} data-testid="config-json-drawer-root">
      <div
        data-testid="config-json-drawer-scrim"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: UI_COLORS.overlayScrim,
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.18s",
          zIndex: 60,
        }}
      />

      <aside
        ref={panelRef}
        data-testid="config-json-drawer"
        role="dialog"
        aria-modal={open ? "true" : undefined}
        aria-label={t("config.title")}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 560,
          maxWidth: "92vw",
          background: UI_COLORS.appSurface,
          borderLeft: `1px solid ${UI_COLORS.border}`,
          boxShadow: open ? UI_COLORS.commandShadow : "none",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.2s ease",
          zIndex: 61,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "14px 16px",
            borderBottom: `1px solid ${UI_COLORS.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                aria-hidden
                style={{ width: 3, height: 14, borderRadius: 2, background: UI_COLORS.accent }}
              />
              <span
                style={{
                  fontFamily: "var(--app-font-mono)",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: UI_COLORS.text,
                }}
              >
                {t("config.title")}
              </span>
            </div>
            <span
              data-testid="config-json-file-note"
              style={{ fontSize: 10, color: UI_COLORS.textMuted, paddingLeft: 11, lineHeight: 1.4 }}
            >
              {t("config.fileNote")}
            </span>
          </div>
          <button
            data-testid="config-json-drawer-close"
            onClick={onClose}
            aria-label={t("drawer.close")}
            title={t("drawer.close")}
            style={{
              appearance: "none",
              border: "none",
              background: "transparent",
              color: UI_COLORS.textMuted,
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ×
          </button>
        </header>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            padding: "10px 16px",
            borderBottom: `1px solid ${UI_COLORS.border}`,
            flexShrink: 0,
          }}
        >
          <span style={monoLabel}>{t("drawer.jumpTo")}</span>
          {MODULE_KEYS.map((key) => (
            <button
              key={key}
              data-testid={`config-json-module-${key}`}
              onClick={() => locateKey(key)}
              style={{
                appearance: "none",
                border: `1px solid ${UI_COLORS.controlBorder}`,
                borderRadius: 3,
                background: "transparent",
                color: UI_COLORS.textMuted,
                cursor: "pointer",
                fontFamily: "var(--app-font-mono)",
                fontSize: 10,
                letterSpacing: "0.02em",
                padding: "3px 7px",
                transition: "color 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = UI_COLORS.text;
                e.currentTarget.style.borderColor = cssAlpha(UI_COLORS.accent, 44);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = UI_COLORS.textMuted;
                e.currentTarget.style.borderColor = UI_COLORS.controlBorder;
              }}
            >
              {key}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 16px 28px" }}>
          <SessionConfigEditor state={state} onChange={onChange} />
        </div>
      </aside>
    </div>
  );
}

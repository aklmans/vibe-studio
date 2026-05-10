import { useEffect, useRef } from "react";

export interface ShortcutHandlers {
  /** Cmd/Ctrl + 1..4 — switch to overlay/cover/poster/wallpaper */
  onSwitchTab?: (index: number) => void;
  /** Cmd/Ctrl + E — export the artifact for the current tab */
  onExportCurrent?: () => void;
  /** Cmd/Ctrl + K — open the command palette (also closes if already open) */
  onCommandPalette?: () => void;
  /** Cmd/Ctrl + , — open settings drawer */
  onOpenSettings?: () => void;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

/**
 * Global keyboard shortcuts. Listens on window and ignores events whose target
 * is a text input / textarea / contenteditable, EXCEPT for ⌘K which always
 * opens the palette so the user can escape any focus context.
 *
 * Handlers are wrapped in a ref so callers don't need to memoize — the effect
 * runs once and reads the latest handlers at fire time.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key;
      const lower = key.toLowerCase();

      // ⌘K — palette is escape hatch from any focus
      if (lower === "k") {
        e.preventDefault();
        handlersRef.current.onCommandPalette?.();
        return;
      }

      // Other shortcuts: skip when the user is typing somewhere
      if (isTypingTarget(e.target)) return;

      // ⌘1..4 — switch tab
      if (key >= "1" && key <= "4") {
        e.preventDefault();
        handlersRef.current.onSwitchTab?.(parseInt(key, 10) - 1);
        return;
      }

      // ⌘E — export current
      if (lower === "e") {
        e.preventDefault();
        handlersRef.current.onExportCurrent?.();
        return;
      }

      // ⌘, — settings
      if (key === ",") {
        e.preventDefault();
        handlersRef.current.onOpenSettings?.();
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

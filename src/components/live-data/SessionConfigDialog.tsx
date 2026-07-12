import { useEffect, useRef, type ReactNode } from "react";
import { UI_COLORS } from "../../lib/design-tokens";

interface SessionConfigDialogProps {
  onClose: () => void;
  /** Esc closes the dialog only when no higher modal (JSON drawer) owns it. */
  closeOnEsc?: boolean;
  /** Trap Tab within the dialog, unless a higher modal owns focus. */
  trapFocus?: boolean;
  /** Whether this dialog is the active modal owner. A higher drawer can take over. */
  modalActive?: boolean;
  ariaLabelledBy: string;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Session Config Center modal shell — a centered dialog over the dimmed,
 * blurred workbench, in the spirit of a desktop settings window. It owns the
 * scrim, the panel, and the accessibility contract (role="dialog" / aria-modal,
 * Esc to close, a focus trap, and focus restore to the trigger on close). The
 * global JSON drawer renders as a sibling at a higher z-index and takes over
 * focus while open (closeOnEsc / trapFocus are then disabled here).
 */
export default function SessionConfigDialog({
  onClose,
  closeOnEsc = true,
  trapFocus = true,
  modalActive = true,
  ariaLabelledBy,
  children,
}: SessionConfigDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  // Focus into the dialog on open; restore to the trigger on close.
  useEffect(() => {
    restoreRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const raf = requestAnimationFrame(() => {
      const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel)?.focus();
    });
    return () => {
      cancelAnimationFrame(raf);
      restoreRef.current?.focus?.();
      restoreRef.current = null;
    };
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && closeOnEsc) {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !trapFocus) return;
      const panel = panelRef.current;
      if (!panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (active && !panel.contains(active)) {
        event.preventDefault();
        first.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [closeOnEsc, trapFocus, onClose]);

  return (
    <div data-testid="session-config-dialog-root">
      <div
        data-testid="session-config-dialog-scrim"
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: UI_COLORS.overlayScrim,
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          zIndex: 40,
        }}
      />
      <div
        ref={panelRef}
        data-testid="session-config-dialog"
        role="dialog"
        aria-modal={modalActive ? "true" : undefined}
        aria-hidden={!modalActive ? "true" : undefined}
        aria-labelledby={ariaLabelledBy}
        inert={!modalActive ? true : undefined}
        tabIndex={-1}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(1140px, 94vw)",
          height: "min(82vh, 860px)",
          background: UI_COLORS.appSurface,
          border: `1px solid ${UI_COLORS.border}`,
          borderRadius: 0,
          boxShadow: UI_COLORS.commandShadow,
          zIndex: 41,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          overflow: "hidden",
          outline: "none",
        }}
      >
        {children}
      </div>
    </div>
  );
}

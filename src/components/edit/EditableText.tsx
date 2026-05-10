import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { UI_COLORS } from "../../lib/design-tokens";

type EditableTag = "span" | "div" | "h1" | "h2" | "h3" | "p";

interface EditableTextProps {
  value: string;
  onCommit: (next: string) => void;
  /** Disable inline editing (used by offscreen export nodes). */
  readonly?: boolean;
  /** Tag to render. Defaults to span; pass "h1" / "div" etc. when needed. */
  as?: EditableTag;
  /** Allow the user to type Enter to insert a newline (default false: Enter commits). */
  multiline?: boolean;
  placeholder?: string;
  style?: CSSProperties;
  className?: string;
  testId?: string;
  ariaLabel?: string;
}

/**
 * Inline-editable text. Double-click (or focus + Enter) flips it into
 * `contentEditable`; Enter commits, Esc reverts, blur commits. Hover paints
 * a faint outline + pencil affordance so users can discover the interaction
 * without docs.
 *
 * Critical guards:
 *   - `readonly` mode renders a plain element with no listeners — required
 *     so html-to-image export nodes don't pick up carets, outlines, or
 *     contenteditable attributes.
 *   - IME composition windows are tracked so CJK pinyin/zhuyin sequences
 *     don't commit mid-character.
 *   - Single-line mode strips '\n' on commit and intercepts Enter.
 */
export default function EditableText({
  value,
  onCommit,
  readonly = false,
  as = "span",
  multiline = false,
  placeholder,
  style,
  className,
  testId,
  ariaLabel,
}: EditableTextProps) {
  const Tag = as;

  if (readonly) {
    return createElement(
      Tag,
      {
        className,
        style,
        "data-testid": testId,
        "aria-label": ariaLabel,
      },
      value || placeholder || "",
    );
  }

  const ref = useRef<HTMLElement | null>(null);
  const composingRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [hover, setHover] = useState(false);

  // Keep DOM text in sync with `value` while not actively editing. We avoid
  // touching the node mid-edit so the caret position is preserved.
  useEffect(() => {
    if (!editing && ref.current && ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
  }, [value, editing]);

  const beginEdit = () => {
    if (editing) return;
    setEditing(true);
    queueMicrotask(() => {
      const el = ref.current;
      if (!el) return;
      el.focus();
      // place caret at end
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  };

  const commit = () => {
    if (!editing) return;
    const raw = ref.current?.textContent ?? "";
    const next = multiline ? raw : raw.replace(/\n+/g, " ").trim();
    setEditing(false);
    if (next !== value) onCommit(next);
    else if (ref.current) ref.current.textContent = value; // re-sync visual
  };

  const cancel = () => {
    if (!editing) return;
    setEditing(false);
    if (ref.current) ref.current.textContent = value;
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    if (composingRef.current) return;
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  const ringColor = `${UI_COLORS.focus}CC`;
  const baseOutline: CSSProperties = editing
    ? {
        outline: `1px solid ${ringColor}`,
        outlineOffset: 2,
        borderRadius: 2,
        background: "rgba(141,168,255,0.08)",
      }
    : hover
      ? {
          outline: `1px dashed ${ringColor}`,
          outlineOffset: 2,
          borderRadius: 2,
          cursor: "text",
        }
      : { cursor: "text" };

  const composedStyle: CSSProperties = {
    ...style,
    ...baseOutline,
    transition: "outline-color 0.15s, background 0.15s",
  };

  const placeholderShown = !value && !editing;

  return createElement(
    Tag,
    {
      ref: ref as React.Ref<HTMLElement>,
      className,
      "data-testid": testId,
      "data-editable": "true",
      "aria-label": ariaLabel,
      contentEditable: editing,
      suppressContentEditableWarning: true,
      style: composedStyle,
      onMouseEnter: () => setHover(true),
      onMouseLeave: () => setHover(false),
      onDoubleClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        beginEdit();
      },
      onFocus: beginEdit,
      onBlur: commit,
      onKeyDown: handleKeyDown,
      onCompositionStart: () => {
        composingRef.current = true;
      },
      onCompositionEnd: () => {
        composingRef.current = false;
      },
      tabIndex: 0,
    },
    placeholderShown ? placeholder ?? "" : value,
  );
}

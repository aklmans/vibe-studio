import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { OverlayState } from "../../types";
import { useLocale } from "../../hooks/useLocale";
import { UI_BORDERS, UI_COLORS, cssAlpha } from "../../lib/design-tokens";
import type {
  LiveStudioConfig,
  LiveStudioConfigValidation,
} from "../../lib/live-studio-config";
import {
  applyConfigText,
  beginEditing,
  displayedConfigText,
  initialDriftState,
  isChangedUnderneath,
  parseConfigText,
  projectConfigText,
  resyncToState,
  type ConfigParse,
} from "../../lib/session-config-drift";
import {
  boundTo,
  browserFileAccessAdapter,
  initialFileBinding,
  markPermissionLost,
  markRead,
  markReadError,
  markWrite,
  markWriteError,
  readBoundFile,
  writeBoundFile,
  type ConfigFileHandle,
  type FileAccessAdapter,
} from "../../lib/config-file-access";
import {
  WorkbenchButton,
  applyWorkbenchFocus,
  clearWorkbenchFocus,
  monoInputStyle,
} from "../shared/Field";

/*
 * Session Config — the JSON view of the current live config.
 *
 * Layer boundaries (single direction of authority):
 *  - LiveStudioConfig v1 / live-session.config.json — the AI- and human-editable
 *    *portable core* projection: title, subtitle, author, cover, badges, stack,
 *    socials, sections. It is NOT the whole page: live-session start time,
 *    active section, done states, and bottom-bar segments are runtime/display
 *    controls outside v1. Apply also rebuilds active section, done states, and
 *    bottom-bar segments to v1 defaults — so the form and the JSON are two views
 *    of the same config, not of the entire Session Config page.
 *  - OverlayState — the runtime effective state. It is the single source of
 *    truth that drives the canvases, the preview, and the OBS live-state push.
 *    The form editors above write it directly; this JSON view projects it and
 *    only writes it back on an explicit "Apply".
 *  - localStorage — the local autosave/draft of OverlayState (recovery), not an
 *    outward config file.
 *  - DB session / live data — persistence + history, not the config file.
 *  - /api/live-state — the one-way OBS runtime sync channel; never edited back.
 *
 * Drift safety: the textarea is "synced" (mirrors the live config projection)
 * until the user edits it, which switches it to an "editing" buffer detached
 * from state. If the form changes the underlying config while editing, a banner
 * warns instead of silently overwriting either side. Apply / Discard are the
 * only transitions that move data between the buffer and OverlayState. The drift
 * state machine itself lives in lib/session-config-drift.ts (tested there).
 */

/** Outward file name for import / export / AI-agent handoff. */
export const SESSION_CONFIG_FILE_NAME = "live-session.config.json";

interface SessionConfigEditorProps {
  state: OverlayState;
  onChange: (state: OverlayState) => void;
  /** Injectable for tests; defaults to the real File System Access adapter. */
  fileAccess?: FileAccessAdapter;
}

function formatClock(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

const sectionStyle: CSSProperties = {
  // First-class workspace view (no longer appended to a stack), so no leading
  // margin / rule — it sits at the top of the JSON pane.
  display: "flex",
  flexDirection: "column",
  gap: 16,
  maxWidth: 720,
};

const textareaStyle: CSSProperties = {
  ...monoInputStyle,
  width: "100%",
  minHeight: 286,
  resize: "vertical",
  border: UI_BORDERS.control,
  borderRadius: 4,
  background: UI_COLORS.inputInset,
  padding: "12px 14px",
  lineHeight: 1.55,
};

const resultStyle: CSSProperties = {
  borderTop: UI_BORDERS.hair,
  paddingTop: 16,
  display: "grid",
  gap: 14,
};

const eyebrowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  color: UI_COLORS.text,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
};

const hintStyle: CSSProperties = {
  maxWidth: 760,
  fontSize: 11,
  color: UI_COLORS.textMuted,
  lineHeight: 1.5,
};

export default function SessionConfigEditor({
  state,
  onChange,
  fileAccess,
}: SessionConfigEditorProps) {
  const { t } = useLocale();
  // Live projection of the current config — recomputed whenever the form/state
  // changes so the synced view never drifts.
  const projected = useMemo(() => projectConfigText(state), [state]);

  const adapter = useMemo(
    () => fileAccess ?? browserFileAccessAdapter(),
    [fileAccess],
  );
  const supportsBinding = adapter.supported();

  const [drift, setDrift] = useState(initialDriftState);
  const [validation, setValidation] =
    useState<LiveStudioConfigValidation | null>(null);
  const [previewConfig, setPreviewConfig] = useState<LiveStudioConfig | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [binding, setBinding] = useState(() => initialFileBinding(supportsBinding));
  const [lastImportName, setLastImportName] = useState<string | null>(null);
  const [lastExportAt, setLastExportAt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleRef = useRef<ConfigFileHandle | null>(null);

  const editing = drift.mode === "editing";
  const displayedText = displayedConfigText(drift, projected);
  const changedUnderneath = isChangedUnderneath(drift, projected);

  // A read (bound file or import) always lands in the editing buffer + a fresh
  // validation — it never auto-applies. Mirrors importConfigFile exactly.
  const loadTextIntoBuffer = (text: string) => {
    setDrift(beginEditing(drift, projected, text));
    const { validation: next, config } = parseToValidation(parseConfigText(text));
    setValidation(next);
    setPreviewConfig(config);
    return next.valid;
  };

  const readBoundIntoBuffer = async (handle: ConfigFileHandle | null) => {
    if (!handle) return;
    const result = await readBoundFile(adapter, handle);
    if (!result.ok) {
      if (result.reason === "permission") {
        setBinding((prev) => markPermissionLost(prev));
        setMessage(t("config.file.permissionLost"));
      } else {
        setBinding((prev) => markReadError(prev, result.error));
        setMessage(t("config.file.readError"));
      }
      return;
    }
    const valid = loadTextIntoBuffer(result.text);
    setBinding((prev) => markRead(prev, new Date().toISOString()));
    setMessage(valid ? t("config.file.read") : t("config.importInvalid"));
  };

  const bindFile = async () => {
    try {
      const { handle, name } = await adapter.pick();
      handleRef.current = handle;
      setBinding(boundTo(name));
      // Picking a file loads it for review (still no auto-apply).
      await readBoundIntoBuffer(handle);
    } catch (error) {
      if (isAbortError(error)) return; // user cancelled the picker
      setBinding((prev) => markReadError(prev, error instanceof Error ? error.message : String(error)));
      setMessage(t("config.file.readError"));
    }
  };

  const saveBoundFile = async () => {
    const handle = handleRef.current;
    if (!handle) return;
    // Save rule (same as Export): always the current *state* projection, never
    // the editing draft. A failed write leaves the draft untouched.
    const result = await writeBoundFile(adapter, handle, projected);
    if (!result.ok) {
      if (result.reason === "permission") {
        setBinding((prev) => markPermissionLost(prev));
        setMessage(t("config.file.permissionLost"));
      } else {
        setBinding((prev) => markWriteError(prev, result.error));
        setMessage(t("config.file.writeError"));
      }
      return;
    }
    setBinding((prev) => markWrite(prev, new Date().toISOString()));
    setMessage(t("config.file.saved"));
  };

  const unbindFile = () => {
    handleRef.current = null;
    setBinding(initialFileBinding(supportsBinding));
    setMessage(t("config.file.unbound"));
  };

  // Map the i18n-free parse result into the UI's validation shape + messages.
  const parseToValidation = (
    parse: ConfigParse,
  ): { validation: LiveStudioConfigValidation; config: LiveStudioConfig | null } => {
    if (parse.ok) {
      return { validation: { valid: true, issues: [] }, config: parse.config };
    }
    const issues =
      parse.reason === "empty"
        ? [t("config.empty")]
        : parse.reason === "json"
          ? [`${t("config.invalidJson")}: ${parse.detail}`]
          : parse.issues;
    return { validation: { valid: false, issues }, config: null };
  };

  const enterEditing = (nextDraft: string) => {
    setDrift(beginEditing(drift, projected, nextDraft));
    setValidation(null);
    setMessage("");
  };

  const resyncFromState = () => {
    setDrift(resyncToState());
    setValidation(null);
    setPreviewConfig(null);
    setMessage(t("config.resynced"));
  };

  const validateConfigText = () => {
    const { validation: next, config } = parseToValidation(
      parseConfigText(displayedText),
    );
    setValidation(next);
    setPreviewConfig(config);
    setMessage(next.valid ? t("config.valid") : t("config.invalid"));
  };

  const handleApply = () => {
    const result = applyConfigText(state, displayedText);
    const { validation: next, config } = parseToValidation(result.parse);
    setValidation(next);
    setPreviewConfig(config);

    if (!result.ok || !result.nextState) {
      setMessage(t("config.invalid"));
      return;
    }

    // Apply is the explicit transaction: the buffer overwrites OverlayState,
    // then the view returns to synced (now mirroring the applied config).
    onChange(result.nextState);
    setDrift(result.nextDrift);
    setMessage(t("config.applied"));
  };

  const exportCurrentConfig = () => {
    // Export rule: always the current *state* projection (the portable core v1
    // config) — never the unsaved editing draft. So an in-progress, unvalidated
    // buffer can never be exported by accident.
    const json = projected;

    if (typeof document !== "undefined") {
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = SESSION_CONFIG_FILE_NAME;
      link.click();
      URL.revokeObjectURL(url);
    }

    // The file download is the success main path. A clipboard copy is a bonus;
    // its failure message still affirms the download succeeded.
    setLastExportAt(new Date().toISOString());
    setMessage(t("config.downloaded"));
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(json).catch(() => {
        setMessage(t("config.copyFailed"));
      });
    }
  };

  const importConfigFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const isJson = /\.json$/i.test(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      // Import always lands in the editing buffer — it never auto-applies. The
      // user reviews and presses Apply. We pre-validate so a bad file / bad
      // content surfaces immediately, but nothing is written to state.
      const valid = loadTextIntoBuffer(text);
      setLastImportName(file.name);
      setMessage(
        !isJson
          ? t("config.importNotJson")
          : valid
            ? t("config.imported")
            : t("config.importInvalid"),
      );
    };
    reader.readAsText(file);
  };

  const fileStatus =
    binding.status === "permission-lost"
      ? { label: t("config.file.permissionLostShort"), color: UI_COLORS.danger }
      : binding.status === "read-error"
        ? { label: t("config.file.readErrorShort"), color: UI_COLORS.danger }
        : binding.status === "write-error"
          ? { label: t("config.file.writeErrorShort"), color: UI_COLORS.danger }
          : binding.status === "bound"
            ? { label: `${t("config.file.bound")}: ${binding.fileName ?? ""}`, color: UI_COLORS.accentText }
            : binding.status === "unsupported"
              ? { label: t("config.file.unsupported"), color: UI_COLORS.textMuted }
              : { label: t("config.file.manual"), color: UI_COLORS.textMuted };
  const boundActive =
    binding.status === "bound" ||
    binding.status === "read-error" ||
    binding.status === "write-error";

  return (
    <section data-testid="session-config-panel" style={sectionStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <div style={eyebrowStyle}>
            <AccentMark />
            {t("config.title")}
            <ModeChip editing={editing} />
          </div>
          <div style={hintStyle}>{t("config.hint")}</div>
        </div>

        {message && (
          <div
            style={{
              flexShrink: 0,
              maxWidth: 300,
              fontSize: 11,
              color: validation?.valid === false ? UI_COLORS.danger : UI_COLORS.accentText,
              background:
                validation?.valid === false
                  ? UI_COLORS.dangerSurface
                  : UI_COLORS.previewBadgeSurface,
              border:
                validation?.valid === false
                  ? UI_BORDERS.danger
                  : UI_BORDERS.control,
              borderRadius: 4,
              padding: "4px 8px",
              lineHeight: 1.4,
            }}
          >
            {message}
          </div>
        )}
      </div>

      {/* File workflow — manual import / export plus an optional bound file.
          A bound file is never watched; reads + saves are explicit user actions
          and a read still goes through review + Apply. */}
      <div
        data-testid="config-file-workflow"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          padding: "10px 12px",
          border: UI_BORDERS.control,
          borderRadius: 4,
          background: UI_COLORS.inputInset,
        }}
      >
        <div
          data-testid="config-file-status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            fontFamily: "var(--app-font-mono)",
            fontSize: 11,
          }}
        >
          <span aria-hidden style={{ width: 5, height: 5, borderRadius: "50%", background: fileStatus.color, flexShrink: 0 }} />
          <span style={{ fontWeight: 600, color: fileStatus.color }}>{fileStatus.label}</span>
          {binding.lastReadAt && (
            <span style={{ color: UI_COLORS.textSubtle }}>· {t("config.file.lastRead")} {formatClock(binding.lastReadAt)}</span>
          )}
          {binding.lastWriteAt && (
            <span style={{ color: UI_COLORS.textSubtle }}>· {t("config.file.lastSaved")} {formatClock(binding.lastWriteAt)}</span>
          )}
          {lastImportName && (
            <span style={{ color: UI_COLORS.textSubtle }}>· {t("config.file.lastImport")} {lastImportName}</span>
          )}
          {lastExportAt && (
            <span style={{ color: UI_COLORS.textSubtle }}>· {t("config.file.lastExport")} {formatClock(lastExportAt)}</span>
          )}
        </div>
        <div data-testid="config-file-note" style={{ fontSize: 10.5, color: UI_COLORS.textMuted, lineHeight: 1.45 }}>
          {supportsBinding ? t("config.file.note") : t("config.file.unsupportedNote")}
        </div>
        {supportsBinding && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {binding.status === "unbound" && (
              <ConfigButton data-testid="config-bind-file" onClick={bindFile}>
                {t("config.file.bindFile")}
              </ConfigButton>
            )}
            {boundActive && (
              <>
                <ConfigButton data-testid="config-read-file" onClick={() => readBoundIntoBuffer(handleRef.current)}>
                  {t("config.file.readFile")}
                </ConfigButton>
                <ConfigButton data-testid="config-save-file" onClick={saveBoundFile}>
                  {t("config.file.saveFile")}
                </ConfigButton>
                <ConfigButton data-testid="config-unbind" onClick={unbindFile}>
                  {t("config.file.unbind")}
                </ConfigButton>
              </>
            )}
            {binding.status === "permission-lost" && (
              <>
                <ConfigButton data-testid="config-relink" onClick={bindFile} accentColor={UI_COLORS.accent}>
                  {t("config.file.relink")}
                </ConfigButton>
                <ConfigButton data-testid="config-unbind" onClick={unbindFile}>
                  {t("config.file.unbind")}
                </ConfigButton>
              </>
            )}
          </div>
        )}
      </div>

      {changedUnderneath && (
        <div
          data-testid="config-changed-banner"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 11,
            lineHeight: 1.45,
            color: UI_COLORS.text,
            background: UI_COLORS.previewBadgeSurface,
            border: `1px solid ${cssAlpha(UI_COLORS.accent, 38)}`,
            borderRadius: 4,
            padding: "8px 12px",
          }}
        >
          <span style={{ minWidth: 0 }}>{t("config.changedUnderneath")}</span>
          <ConfigButton data-testid="config-resync" onClick={resyncFromState}>
            {t("config.discard")}
          </ConfigButton>
        </div>
      )}

      <textarea
        data-testid="config-input"
        value={displayedText}
        onChange={(event) => enterEditing(event.target.value)}
        placeholder={t("config.placeholder")}
        spellCheck={false}
        style={textareaStyle}
        onFocus={(event) => applyWorkbenchFocus(event.currentTarget)}
        onBlur={(event) => clearWorkbenchFocus(event.currentTarget)}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={importConfigFile}
        data-testid="config-file-input"
      />

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 8,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <ConfigButton data-testid="config-export" onClick={exportCurrentConfig}>
            {t("config.exportCurrent")}
          </ConfigButton>
          <ConfigButton
            data-testid="config-import"
            onClick={() => fileInputRef.current?.click()}
          >
            {t("config.import")}
          </ConfigButton>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {editing && (
            <ConfigButton data-testid="config-discard" onClick={resyncFromState}>
              {t("config.discard")}
            </ConfigButton>
          )}
          <ConfigButton data-testid="config-validate" onClick={validateConfigText}>
            {t("config.validate")}
          </ConfigButton>
          <ConfigButton
            data-testid="config-apply"
            onClick={handleApply}
            accentColor={UI_COLORS.accent}
          >
            {t("config.apply")}
          </ConfigButton>
        </div>
      </div>

      <ConfigResultPanel validation={validation} config={previewConfig} />
    </section>
  );
}

function ModeChip({ editing }: { editing: boolean }) {
  const { t } = useLocale();
  const color = editing ? UI_COLORS.accentText : UI_COLORS.textMuted;
  return (
    <span
      data-testid="config-mode"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--app-font-mono)",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color,
        border: `1px solid ${cssAlpha(color, 40)}`,
        borderRadius: 3,
        padding: "1px 6px",
      }}
    >
      {t(editing ? "config.mode.editing" : "config.mode.synced")}
    </span>
  );
}

function ConfigResultPanel({
  validation,
  config,
}: {
  validation: LiveStudioConfigValidation | null;
  config: LiveStudioConfig | null;
}) {
  const { t } = useLocale();

  return (
    <div data-testid="config-result" style={resultStyle}>
      <div style={{ ...eyebrowStyle, fontSize: 11 }}>
        <AccentMark muted />
        {t("config.previewTitle")}
      </div>

      {validation && <ValidationStatus validation={validation} />}

      {!config ? (
        <div style={hintStyle}>{t("config.previewEmpty")}</div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gap: 8 }}>
            <PreviewLine label={t("config.summaryTitle")} value={config.title} />
            <PreviewLine label={t("config.summarySubtitle")} value={config.subtitle} />
            <PreviewLine
              label={t("config.summarySections")}
              value={String(config.sections.length)}
            />
            <PreviewLine
              label={t("config.summaryStack")}
              value={String(config.stack.length)}
            />
            <PreviewLine
              label={t("config.summaryBadges")}
              value={String(config.badges.length)}
            />
            <PreviewLine
              label={t("config.summarySocials")}
              value={String(config.socials.length)}
            />
          </div>

          <PreviewBlock
            label={t("config.previewSurfaces")}
            values={[
              t("config.surface.cover"),
              t("config.surface.badges"),
              t("config.surface.stack"),
              t("config.surface.socials"),
              t("config.surface.sections"),
              t("config.surface.bottomBar"),
            ]}
          />
        </div>
      )}
    </div>
  );
}

function ValidationStatus({
  validation,
}: {
  validation: LiveStudioConfigValidation;
}) {
  const { t } = useLocale();
  const color = validation.valid ? UI_COLORS.success : UI_COLORS.danger;

  return (
    <div
      style={{
        display: "grid",
        gap: 8,
        padding: "10px 0 0",
        borderTop: UI_BORDERS.hair,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          color,
          fontFamily: "var(--app-font-mono)",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        <span
          aria-hidden
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: color,
          }}
        />
        {validation.valid ? t("config.valid") : t("config.invalid")}
      </div>

      {!validation.valid && validation.issues.length > 0 && (
        <ul
          style={{
            margin: 0,
            padding: "0 0 0 18px",
            color: UI_COLORS.danger,
            fontSize: 11,
            lineHeight: 1.45,
          }}
        >
          {validation.issues.map((issue, index) => (
            <li key={`${issue}-${index}`}>{issue}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px minmax(0, 1fr)",
        gap: 12,
        alignItems: "baseline",
      }}
    >
      <span style={previewLabelStyle}>{label}</span>
      <span style={previewValueStyle}>{value || "—"}</span>
    </div>
  );
}

function PreviewBlock({
  label,
  values,
}: {
  label: string;
  values: readonly string[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "120px minmax(0, 1fr)",
        gap: 12,
      }}
    >
      <span style={previewLabelStyle}>{label}</span>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {values.map((value, index) => (
          <span
            key={`${value}-${index}`}
            style={{
              ...previewValueStyle,
              border: UI_BORDERS.control,
              borderRadius: 3,
              padding: "3px 7px",
              background: UI_COLORS.inputInset,
            }}
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

const previewLabelStyle: CSSProperties = {
  color: UI_COLORS.textSoft,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
};

const previewValueStyle: CSSProperties = {
  color: UI_COLORS.text,
  fontFamily: "var(--app-font-mono)",
  fontSize: 11,
  lineHeight: 1.45,
  overflowWrap: "anywhere",
};

function AccentMark({ muted = false }: { muted?: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        width: 3,
        height: 14,
        borderRadius: 2,
        background: muted ? cssAlpha(UI_COLORS.accent, 52) : UI_COLORS.accent,
      }}
    />
  );
}

function ConfigButton({
  children,
  onClick,
  accentColor = UI_COLORS.textSoft,
  "data-testid": testId,
}: {
  children: ReactNode;
  onClick: () => void;
  accentColor?: string;
  "data-testid"?: string;
}) {
  return (
    <WorkbenchButton
      data-testid={testId}
      onClick={onClick}
      tone={accentColor === UI_COLORS.textSoft ? "neutral" : "accent"}
      accentColor={accentColor}
      style={{
        minWidth: 118,
        height: 32,
        padding: "0 12px",
      }}
    >
      {children}
    </WorkbenchButton>
  );
}

"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { UI_COLORS, cssAlpha } from "../lib/design-tokens";
import { useLocale } from "../hooks/useLocale";
import type { StudioProfile } from "../lib/studio-profile";
import { downscaleImageToDataUrl } from "../lib/image-downscale";
import { socialIconLabel } from "../lib/socials";
import type { BrandIconKey } from "../lib/brand-icons";
import { DARK_PRESET } from "../lib/theme";
import { editorialPalette } from "./lib/editorial-palette";
import { fontFamilies } from "../lib/typography";
import { BrandIcon } from "./shared/BrandIcon";
import {
  TextInput,
  WorkbenchButton,
  WorkbenchLabel,
  choiceChipStyle,
} from "./shared/Field";

/** Platforms offered in step 3 — a curated slice of the social icon registry. */
const WIZARD_PLATFORMS: BrandIconKey[] = ["bilibili", "youtube", "x", "github"];

const AVATAR_MAX_DIMENSION = 512;

/** The preview card is a piece of the BROADCAST, not of the app shell: it
 *  always renders in the overlay's own dark editorial palette, so the facts
 *  the host types are shown the way the stream will actually wear them. */
const E = editorialPalette(DARK_PRESET);

const monoCaps: CSSProperties = {
  fontFamily: fontFamilies.mono,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

/** Quiet running text — no input-like chrome (that reads as a disabled field). */
const quietNote: CSSProperties = {
  margin: 0,
  fontSize: 11,
  lineHeight: 1.6,
  color: UI_COLORS.textMuted,
};

interface FirstRunWizardProps {
  /** Finish: persist this brand profile and apply it to the workspace. */
  onComplete: (profile: StudioProfile) => void;
  /** Skip setup entirely — the studio opens on neutral defaults. */
  onSkip: () => void;
}

/**
 * First-run setup — greets a brand-new studio (no saved draft, no brand
 * profile) with the three identity facts the Brand layer needs: name, avatar,
 * main platform. The left column walks the steps; the right pane renders a
 * live brand card in the broadcast's own design language, so the very first
 * thing a new host sees is their identity becoming a piece of the stream.
 * Every step but the name is skippable, and the whole setup can be skipped;
 * it never shows in demo mode or once anything is persisted.
 */
export default function FirstRunWizard({ onComplete, onSkip }: FirstRunWizardProps) {
  const { t, locale } = useLocale();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [platform, setPlatform] = useState<BrandIconKey | null>(null);
  const [handle, setHandle] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("input,button")?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [step]);

  const finish = () => {
    const trimmedName = name.trim();
    const socials =
      platform && handle.trim()
        ? [
            {
              visible: true,
              iconKey: platform,
              iconMode: "mono" as const,
              label: socialIconLabel(platform, locale),
              value: handle.trim(),
              customColor: "",
            },
          ]
        : [];
    // Nothing filled in = nothing worth saving: finishing an empty wizard is
    // the same explicit decision as skipping it (no empty brand profile).
    if (!trimmedName && !avatarUrl && socials.length === 0) {
      onSkip();
      return;
    }
    onComplete({
      version: 3,
      author: trimmedName,
      // No upload -> keep the built-in default portrait instead of an empty
      // slot, so the camera's avatar theme never degrades to a placeholder.
      avatarUrl: avatarUrl || "/avatar.png",
      avatarVisible: true,
      socialVisible: socials.length > 0,
      socials,
    });
  };

  const stepLabels = [t("wizard.stepName"), t("wizard.stepAvatar"), t("wizard.stepSocial")];
  const stepHints = [t("wizard.nameHint"), t("wizard.avatarHint"), t("wizard.socialHint")];
  const isLast = step === 2;

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    try {
      setAvatarUrl(await downscaleImageToDataUrl(file, { maxDimension: AVATAR_MAX_DIMENSION }));
    } catch {
      // Undecodable image — keep the current avatar and let the host retry.
    }
  };

  return (
    <div data-testid="first-run-wizard">
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: UI_COLORS.overlayScrim,
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          zIndex: 50,
        }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="first-run-wizard-title"
        tabIndex={-1}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(920px, 94vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: UI_COLORS.appSurface,
          border: `1px solid ${UI_COLORS.border}`,
          borderRadius: 0,
          boxShadow: UI_COLORS.commandShadow,
          zIndex: 51,
          display: "flex",
          flexWrap: "wrap",
        }}
      >
        {/* Corner accent — the same mark the broadcast main frame carries. */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 72,
            height: 3,
            background: UI_COLORS.accent,
            pointerEvents: "none",
          }}
        />

        {/* ── Left column: the editorial walk-through ── */}
        <div
          style={{
            flex: "1 1 400px",
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            padding: "26px 30px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span aria-hidden style={{ width: 6, height: 6, background: UI_COLORS.accent }} />
            <span style={{ ...monoCaps, fontSize: 10, color: UI_COLORS.textSubtle }}>
              Vibe Studio
            </span>
            <span
              style={{
                ...monoCaps,
                marginLeft: "auto",
                fontSize: 10,
                color: UI_COLORS.textSubtle,
              }}
            >
              {`0${step + 1} / 03`}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              id="first-run-wizard-title"
              style={{
                fontFamily: "var(--app-font-serif)",
                fontSize: 27,
                lineHeight: 1.3,
                fontWeight: 500,
                color: UI_COLORS.text,
              }}
            >
              {t("wizard.title")}
            </span>
            <p style={quietNote}>{t("wizard.tagline")}</p>
          </div>

          {/* Step rail — visited steps are clickable, the current one is marked. */}
          <div
            style={{
              display: "flex",
              borderTop: `1px solid ${UI_COLORS.border}`,
              borderBottom: `1px solid ${UI_COLORS.border}`,
            }}
          >
            {stepLabels.map((label, idx) => {
              const isCurrent = idx === step;
              const isPast = idx < step;
              return (
                <button
                  key={label}
                  type="button"
                  data-testid={`wizard-rail-${idx}`}
                  aria-current={isCurrent ? "step" : undefined}
                  disabled={idx > step}
                  onClick={() => {
                    if (isPast) setStep(idx);
                  }}
                  style={{
                    appearance: "none",
                    flex: 1,
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                    padding: "10px 2px 8px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `2px solid ${isCurrent ? UI_COLORS.accent : "transparent"}`,
                    cursor: isPast ? "pointer" : "default",
                  }}
                >
                  <span
                    style={{
                      fontFamily: fontFamilies.mono,
                      fontSize: 11,
                      letterSpacing: "0.08em",
                      color: isCurrent
                        ? UI_COLORS.accent
                        : isPast
                          ? UI_COLORS.accentText
                          : UI_COLORS.textSubtle,
                    }}
                  >
                    {isPast ? "✓" : `0${idx + 1}`}
                  </span>
                  <span
                    style={{
                      ...monoCaps,
                      fontSize: 10,
                      color: isCurrent ? UI_COLORS.text : UI_COLORS.textSubtle,
                    }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minHeight: 158,
            }}
          >
            {step === 0 && (
              <>
                <WorkbenchLabel>{t("wizard.nameLabel")}</WorkbenchLabel>
                <TextInput
                  testId="wizard-name-input"
                  value={name}
                  onChange={setName}
                  placeholder={t("wizard.namePlaceholder")}
                  ariaLabel={t("wizard.nameLabel")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setStep(1);
                  }}
                />
              </>
            )}
            {step === 1 && (
              <>
                <WorkbenchLabel>{t("wizard.avatarLabel")}</WorkbenchLabel>
                <div style={{ display: "flex", alignItems: "stretch", gap: 14 }}>
                  <button
                    type="button"
                    data-testid="wizard-avatar-upload"
                    aria-label={t("wizard.dropHint")}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      void onPickFile(e.dataTransfer.files?.[0] ?? null);
                    }}
                    style={{
                      appearance: "none",
                      width: 108,
                      height: 108,
                      flexShrink: 0,
                      padding: 0,
                      cursor: "pointer",
                      background: dragOver ? cssAlpha(UI_COLORS.accent, 10) : "transparent",
                      border: `1px ${avatarUrl ? "solid" : "dashed"} ${
                        dragOver ? UI_COLORS.accent : UI_COLORS.controlBorder
                      }`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={avatarUrl}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span
                        aria-hidden
                        style={{
                          fontFamily: fontFamilies.mono,
                          fontSize: 22,
                          color: dragOver ? UI_COLORS.accent : UI_COLORS.textSubtle,
                        }}
                      >
                        ⤓
                      </span>
                    )}
                  </button>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <div>
                      <WorkbenchButton onClick={() => fileRef.current?.click()}>
                        {avatarUrl ? t("wizard.replace") : t("wizard.upload")}
                      </WorkbenchButton>
                    </div>
                    <p style={quietNote}>{t("wizard.dropHint")}</p>
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  aria-label={t("wizard.avatarLabel")}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    void onPickFile(e.target.files?.[0] ?? null);
                    e.target.value = "";
                  }}
                />
              </>
            )}
            {step === 2 && (
              <>
                <WorkbenchLabel>{t("wizard.socialLabel")}</WorkbenchLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {WIZARD_PLATFORMS.map((key) => (
                    <button
                      key={key}
                      type="button"
                      data-testid={`wizard-platform-${key}`}
                      aria-pressed={platform === key}
                      onClick={() => setPlatform(platform === key ? null : key)}
                      style={choiceChipStyle(platform === key)}
                    >
                      {socialIconLabel(key, locale)}
                    </button>
                  ))}
                </div>
                <TextInput
                  testId="wizard-handle-input"
                  value={handle}
                  onChange={setHandle}
                  placeholder={t("wizard.handlePlaceholder")}
                  ariaLabel={t("wizard.socialLabel")}
                  mono
                  onKeyDown={(e) => {
                    if (e.key === "Enter") finish();
                  }}
                />
              </>
            )}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              borderTop: `1px solid ${UI_COLORS.border}`,
              paddingTop: 12,
              marginTop: "auto",
            }}
          >
            <button
              type="button"
              data-testid="wizard-skip-all"
              onClick={onSkip}
              style={{
                appearance: "none",
                border: "none",
                background: "transparent",
                cursor: "pointer",
                fontFamily: "var(--app-font-mono)",
                fontSize: 10,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: UI_COLORS.textSubtle,
                padding: "6px 0",
              }}
            >
              {t("wizard.skipAll")}
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              {step > 0 && (
                <WorkbenchButton testId="wizard-back" onClick={() => setStep(step - 1)}>
                  {t("wizard.back")}
                </WorkbenchButton>
              )}
              {!isLast && step > 0 && (
                <WorkbenchButton testId="wizard-skip-step" onClick={() => setStep(step + 1)}>
                  {t("wizard.skipStep")}
                </WorkbenchButton>
              )}
              {!isLast ? (
                <WorkbenchButton
                  testId="wizard-next"
                  tone="accent"
                  onClick={() => setStep(step + 1)}
                >
                  {t("wizard.next")}
                </WorkbenchButton>
              ) : (
                <WorkbenchButton testId="wizard-finish" tone="accent" onClick={finish}>
                  {t("wizard.finish")}
                </WorkbenchButton>
              )}
            </div>
          </div>
        </div>

        {/* ── Right pane: the brand card, live, in broadcast clothes ── */}
        <div
          data-testid="wizard-preview"
          style={{
            flex: "1 1 300px",
            minWidth: 280,
            display: "flex",
            flexDirection: "column",
            gap: 16,
            padding: "24px 28px",
            background: E.bg1,
            borderLeft: `1px solid ${UI_COLORS.border}`,
          }}
        >
          <span style={{ ...monoCaps, fontSize: 9, color: E.subtle }}>
            {t("wizard.previewLabel")}
          </span>

          <div
            style={{
              margin: "auto",
              width: "min(248px, 100%)",
              position: "relative",
              background: E.bg2,
              border: `1px solid ${E.line}`,
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: 28,
                height: 2,
                background: E.accent,
              }}
            />
            <div style={{ position: "relative" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarUrl || "/avatar.png"}
                alt=""
                style={{
                  display: "block",
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  border: `1px solid ${E.line}`,
                  opacity: avatarUrl ? 1 : 0.45,
                  transition: "opacity 200ms ease",
                }}
              />
              {!avatarUrl && (
                <span
                  style={{
                    ...monoCaps,
                    position: "absolute",
                    left: 8,
                    bottom: 8,
                    fontSize: 8,
                    color: E.subtle,
                  }}
                >
                  {t("wizard.previewDefaultAvatar")}
                </span>
              )}
            </div>
            <span style={{ ...monoCaps, fontSize: 9, color: E.accent, letterSpacing: "0.2em" }}>
              {t("wizard.previewHost")}
            </span>
            <span
              style={{
                fontFamily: fontFamilies.serif,
                fontSize: 21,
                lineHeight: 1.25,
                color: name.trim() ? E.text : E.subtle,
                transition: "color 200ms ease",
              }}
            >
              {name.trim() || t("wizard.previewNameGhost")}
            </span>
            <div aria-hidden style={{ height: 1, background: E.lineSoft }} />
            {platform ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <BrandIcon iconKey={platform} color={E.muted} size={13} />
                <span style={{ ...monoCaps, fontSize: 9, color: E.muted, flexShrink: 0 }}>
                  {socialIconLabel(platform, locale)}
                </span>
                <span
                  style={{
                    fontFamily: fontFamilies.mono,
                    fontSize: 12,
                    color: handle.trim() ? E.text : E.subtle,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {handle.trim() || t("wizard.previewHandleGhost")}
                </span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  aria-hidden
                  style={{ width: 12, height: 12, border: `1px dashed ${E.line}`, flexShrink: 0 }}
                />
                <span style={{ ...monoCaps, fontSize: 9, color: E.subtle }}>
                  {t("wizard.previewHandleGhost")}
                </span>
              </div>
            )}
          </div>

          {/* Where the current step's fact lands in the product. */}
          <p
            style={{
              margin: "0 auto",
              maxWidth: 248,
              fontSize: 11,
              lineHeight: 1.6,
              color: E.muted,
            }}
          >
            {stepHints[step]}
          </p>
        </div>
      </div>
    </div>
  );
}

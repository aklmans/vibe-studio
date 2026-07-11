"use client";

import { useEffect, useRef, useState } from "react";
import { UI_COLORS } from "../lib/design-tokens";
import { useLocale } from "../hooks/useLocale";
import type { StudioProfile } from "../lib/studio-profile";
import { downscaleImageToDataUrl } from "../lib/image-downscale";
import { socialIconLabel } from "../lib/socials";
import type { BrandIconKey } from "../lib/brand-icons";
import {
  TextInput,
  WorkbenchButton,
  WorkbenchLabel,
  choiceChipStyle,
  workbenchNoteStyle,
} from "./shared/Field";

/** Platforms offered in step 3 — a curated slice of the social icon registry. */
const WIZARD_PLATFORMS: BrandIconKey[] = ["bilibili", "youtube", "x", "github"];

const AVATAR_MAX_DIMENSION = 512;

interface FirstRunWizardProps {
  /** Finish: persist this brand profile and apply it to the workspace. */
  onComplete: (profile: StudioProfile) => void;
  /** Skip setup entirely — the studio opens on neutral defaults. */
  onSkip: () => void;
}

/**
 * First-run setup — greets a brand-new studio (no saved draft, no brand
 * profile) with the three identity facts the Brand layer needs: name, avatar,
 * main platform. Every step but the name is skippable, and the whole setup can
 * be skipped; it never shows in demo mode or once anything is persisted.
 */
export default function FirstRunWizard({ onComplete, onSkip }: FirstRunWizardProps) {
  const { t, locale } = useLocale();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [platform, setPlatform] = useState<BrandIconKey | null>(null);
  const [handle, setHandle] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>("input,button")?.focus();
    });
    return () => cancelAnimationFrame(raf);
  }, [step]);

  const finish = () => {
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
    onComplete({
      version: 3,
      author: name.trim(),
      avatarUrl,
      avatarVisible: Boolean(avatarUrl),
      socialVisible: socials.length > 0,
      socials,
    });
  };

  const stepLabels = [t("wizard.stepName"), t("wizard.stepAvatar"), t("wizard.stepSocial")];
  const isLast = step === 2;
  const nextDisabled = step === 0 && !name.trim();

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
          width: "min(480px, 94vw)",
          background: UI_COLORS.appSurface,
          border: `1px solid ${UI_COLORS.border}`,
          borderRadius: 12,
          boxShadow: UI_COLORS.commandShadow,
          zIndex: 51,
          display: "flex",
          flexDirection: "column",
          padding: "22px 24px 18px",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <span
            id="first-run-wizard-title"
            style={{
              fontFamily: "var(--app-font-serif)",
              fontSize: 19,
              fontWeight: 500,
              color: UI_COLORS.text,
            }}
          >
            {t("wizard.title")}
          </span>
          <span
            style={{
              fontFamily: "var(--app-font-mono)",
              fontSize: 10,
              letterSpacing: "0.08em",
              color: UI_COLORS.textSubtle,
            }}
          >
            {step + 1} / 3 · {stepLabels[step]}
          </span>
        </div>
        <p style={{ ...workbenchNoteStyle, margin: 0 }}>{t("wizard.tagline")}</p>

        <div
          style={{
            borderTop: `1px solid ${UI_COLORS.border}`,
            paddingTop: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            minHeight: 128,
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
                  if (e.key === "Enter" && name.trim()) setStep(1);
                }}
              />
              <p style={{ ...workbenchNoteStyle, margin: 0 }}>{t("wizard.nameHint")}</p>
            </>
          )}
          {step === 1 && (
            <>
              <WorkbenchLabel>{t("wizard.avatarLabel")}</WorkbenchLabel>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      border: `1px solid ${UI_COLORS.border}`,
                    }}
                  />
                ) : (
                  <div
                    aria-hidden
                    style={{
                      width: 56,
                      height: 56,
                      border: `1px dashed ${UI_COLORS.controlBorder}`,
                    }}
                  />
                )}
                <WorkbenchButton testId="wizard-avatar-upload" onClick={() => fileRef.current?.click()}>
                  {avatarUrl ? t("wizard.replace") : t("wizard.upload")}
                </WorkbenchButton>
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
              </div>
              <p style={{ ...workbenchNoteStyle, margin: 0 }}>{t("wizard.avatarHint")}</p>
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
              />
              <p style={{ ...workbenchNoteStyle, margin: 0 }}>{t("wizard.socialHint")}</p>
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
            paddingTop: 14,
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
                disabled={nextDisabled}
                onClick={() => setStep(step + 1)}
              >
                {t("wizard.next")}
              </WorkbenchButton>
            ) : (
              <WorkbenchButton testId="wizard-finish" onClick={finish}>
                {t("wizard.finish")}
              </WorkbenchButton>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

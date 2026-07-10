import { useRef, useState } from "react";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import { downscaleImageToDataUrl } from "../../lib/image-downscale";
import { ToggleButton, WorkbenchButton } from "./Field";

interface AvatarUploaderProps {
  url: string;
  onUrlChange: (url: string) => void;
  /** Visibility toggle is optional — the cover visual-type control owns
   *  visibility itself and reuses just the upload/clear/preview block. */
  showToggle?: boolean;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  /** Value to restore when clearing. Empty string preserves the legacy remove behavior. */
  clearValue?: string;
  /** Longest-edge cap for the stored image. Small for avatars, larger for covers. */
  maxDimension?: number;
  /** Avatars preview as a circle; logos and scenes want the uncropped square. */
  previewShape?: "round" | "square";
  testIdPrefix?: string;
}

/**
 * Avatar upload + clear + (optional) visibility toggle, factored out so Cover,
 * Poster, and the new BrandIdentityEditor can share one implementation. The
 * file input lives inside this component so multiple instances don't fight over
 * a single shared ref.
 */
export default function AvatarUploader({
  url,
  onUrlChange,
  showToggle = true,
  visible = true,
  onVisibleChange,
  clearValue = "",
  maxDimension = 512,
  previewShape = "round",
  testIdPrefix = "avatar",
}: AvatarUploaderProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState(false);
  const canClear = Boolean(url) && url !== clearValue;

  // Downscale before storing so a large photo can't overflow the localStorage
  // quota or bloat the export DOM. A decode failure surfaces instead of silently
  // storing an unbounded blob.
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(false);
    try {
      onUrlChange(await downscaleImageToDataUrl(file, { maxDimension }));
    } catch {
      setError(true);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {showToggle && onVisibleChange && (
        <ToggleButton
          label={t("toggle.showAvatar")}
          checked={visible}
          onChange={onVisibleChange}
          testId={`${testIdPrefix}-visible`}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleUpload}
        data-testid={`${testIdPrefix}-file-input`}
      />

      <div style={{ display: "flex", gap: 6 }}>
        <WorkbenchButton
          testId={`${testIdPrefix}-upload`}
          onClick={() => fileInputRef.current?.click()}
          tone="accent"
          accentColor={UI_COLORS.uploadAccent}
          style={{ flex: 1, padding: "0 10px" }}
        >
          {url ? t("btn.replace") : t("btn.upload")}
        </WorkbenchButton>
        {canClear && (
          <WorkbenchButton
            testId={`${testIdPrefix}-clear`}
            onClick={() => onUrlChange(clearValue)}
            tone="danger"
            style={{ padding: "0 10px" }}
          >
            {t("btn.clear")}
          </WorkbenchButton>
        )}
      </div>

      {error && (
        <span
          data-testid={`${testIdPrefix}-error`}
          style={{ fontSize: 11, color: UI_COLORS.danger }}
        >
          {t("avatar.uploadFailed")}
        </span>
      )}

      {url && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src={url}
            alt="Avatar preview"
            style={{
              width: 40,
              height: 40,
              borderRadius: previewShape === "round" ? "50%" : 4,
              objectFit: previewShape === "round" ? "cover" : "contain",
              border: `1px solid ${UI_COLORS.controlBorder}`,
            }}
          />
          <span style={{ fontSize: 11, color: UI_COLORS.textMuted }}>{t("avatar.uploaded")}</span>
        </div>
      )}
    </div>
  );
}

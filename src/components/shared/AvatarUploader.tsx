import { useRef } from "react";
import { UI_COLORS } from "../../lib/design-tokens";
import { useLocale } from "../../hooks/useLocale";
import { ToggleButton, WorkbenchButton } from "./Field";

interface AvatarUploaderProps {
  url: string;
  visible: boolean;
  onUrlChange: (url: string) => void;
  onVisibleChange: (visible: boolean) => void;
  testIdPrefix?: string;
}

/**
 * Avatar upload + clear + visibility toggle, factored out so Cover, Poster,
 * and the new BrandIdentityEditor can share one implementation. The visual is
 * identical to the legacy inline block but the file input lives inside this
 * component so multiple instances don't fight over a single shared ref.
 */
export default function AvatarUploader({
  url,
  visible,
  onUrlChange,
  onVisibleChange,
  testIdPrefix = "avatar",
}: AvatarUploaderProps) {
  const { t } = useLocale();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onUrlChange((ev.target?.result as string) ?? "");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <ToggleButton
        label={t("toggle.showAvatar")}
        checked={visible}
        onChange={onVisibleChange}
        testId={`${testIdPrefix}-visible`}
      />

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
        {url && (
          <WorkbenchButton
            testId={`${testIdPrefix}-clear`}
            onClick={() => onUrlChange("")}
            tone="danger"
            style={{ padding: "0 10px" }}
          >
            {t("btn.clear")}
          </WorkbenchButton>
        )}
      </div>

      {url && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src={url}
            alt="Avatar preview"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              objectFit: "cover",
              border: `1px solid ${UI_COLORS.controlBorder}`,
            }}
          />
          <span style={{ fontSize: 11, color: UI_COLORS.textMuted }}>{t("avatar.uploaded")}</span>
        </div>
      )}
    </div>
  );
}

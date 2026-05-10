import { useRef } from "react";
import { useLocale } from "../../hooks/useLocale";

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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 0",
        }}
      >
        <span style={{ fontSize: 13, color: "#C7D2FE" }}>{t("toggle.showAvatar")}</span>
        <button
          data-testid={`${testIdPrefix}-visible`}
          onClick={() => onVisibleChange(!visible)}
          style={{
            width: 40,
            height: 22,
            borderRadius: 11,
            border: "none",
            cursor: "pointer",
            background: visible ? "#8DA8FF" : "#1F2235",
            position: "relative",
            transition: "background 0.2s",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: "#F4F7FF",
              position: "absolute",
              top: 3,
              left: visible ? 21 : 3,
              transition: "left 0.2s",
            }}
          />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleUpload}
        data-testid={`${testIdPrefix}-file-input`}
      />

      <div style={{ display: "flex", gap: 6 }}>
        <button
          data-testid={`${testIdPrefix}-upload`}
          onClick={() => fileInputRef.current?.click()}
          style={{
            flex: 1,
            padding: "7px 10px",
            background: "#3B4FD818",
            border: "1px solid #3B4FD840",
            borderRadius: 7,
            color: "#7C9FFF",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
            textAlign: "center",
          }}
        >
          {url ? t("btn.replace") : t("btn.upload")}
        </button>
        {url && (
          <button
            data-testid={`${testIdPrefix}-clear`}
            onClick={() => onUrlChange("")}
            style={{
              padding: "7px 10px",
              background: "#FF6FAE12",
              border: "1px solid #FF6FAE30",
              borderRadius: 7,
              color: "#FF6FAE",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {t("btn.clear")}
          </button>
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
              border: "1px solid #2a3060",
            }}
          />
          <span style={{ fontSize: 11, color: "#6B7CA8" }}>{t("avatar.uploaded")}</span>
        </div>
      )}
    </div>
  );
}

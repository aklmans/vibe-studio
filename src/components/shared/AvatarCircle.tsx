interface AvatarCircleProps {
  src: string;
  size: number;
  alt?: string;
  bordered?: boolean;
  borderInset?: number;
  borderWidth?: number;
  borderColor?: string;
  reflection?: {
    width: number;
    height: number;
    background?: string;
  };
}

export default function AvatarCircle({
  src,
  size,
  alt = "Avatar",
  bordered = true,
  borderInset = 4,
  borderWidth = 1,
  borderColor = "rgba(255,255,255,0.08)",
  reflection,
}: AvatarCircleProps) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      {bordered && (
        <div
          style={{
            position: "absolute",
            inset: -borderInset,
            borderRadius: "50%",
            border: `${borderWidth}px solid ${borderColor}`,
            zIndex: 0,
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        style={{
          position: "relative",
          zIndex: 1,
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          display: "block",
        }}
      />
      {reflection && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: reflection.width,
            height: reflection.height,
            background:
              reflection.background ??
              "radial-gradient(ellipse at center bottom, rgba(255,255,255,0.05), transparent 80%)",
            borderRadius: "50%",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}


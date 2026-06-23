export function avatarPlaceholder(
  accentColor: string,
  label: string,
  fontSize: number,
): string {
  const isLarge = fontSize >= 68;
  const startColor = isLarge ? "#8f5a45" : "#2a211b";
  const endColor = isLarge ? "#c95f3d" : "#4a3830";
  const fontWeight = isLarge ? 700 : 500;

  return `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${startColor}"/>
      <stop offset="100%" stop-color="${endColor}"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="100" fill="url(#g)"/>
  <text x="100" y="118" text-anchor="middle" font-family="system-ui,sans-serif"
    font-size="${fontSize}" font-weight="${fontWeight}" fill="${accentColor}">${label}</text>
</svg>
`)}`;
}

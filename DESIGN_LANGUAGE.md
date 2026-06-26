# Editorial Live Design Language

Design language for the `editorial-live` branch of Vibe Studio.

This project is not a content website. It is a live-graphics workbench for
creating broadcast overlays, cover screens, posters, wallpapers, sidebars, and
bottom bars. The redesign should borrow Zhaphar's editorial restraint without
turning the app into an article page.

## 1. Direction

The target feeling:

- warm editorial live studio;
- quiet asset workbench;
- premium typography with practical controls;
- broadcast-ready, not decorative;
- calm enough for long live sessions.

Avoid:

- neon AI dashboard;
- blue-purple SaaS template;
- gamer HUD;
- heavy rounded cards;
- gradient logo marks;
- glowing shadows;
- platform-color badge clutter;
- decorative UI chrome that does not help the live workflow.

The signature should be recognizable through:

- warm black / warm paper surfaces;
- upright serif display type where appropriate;
- mono labels, metadata, shortcuts, export names, and status;
- thin hairlines and rules;
- restrained warm-orange accent marks;
- generous spacing;
- quiet, readable controls.

## 2. Product Role

The app has two visual surfaces:

1. The builder shell: the working UI where the user edits, switches tabs, opens
   settings, uses the command palette, and exports assets.
2. The broadcast assets: the actual canvases used in OBS or exported as PNG.

The shell may be utilitarian, but it should not look generic. The assets may be
more expressive, but they must remain readable on video and in screenshots.

## 3. Hard Contracts

Visual style may change on this branch. These must not change unless explicitly
requested:

- export dimensions;
- export filenames;
- OBS routes: `/obs/overlay`, `/obs/sidebar`, `/obs/bottom-bar`;
- OBS source names used by `pnpm live:prepare`;
- off-screen export nodes;
- preview/export shared render tree;
- `OverlayState` semantics;
- `localStorage` normalization and migrations;
- live-state APIs;
- database APIs;
- core keyboard shortcuts;
- command palette behavior;
- language persistence;
- export behavior.

## 4. Palette

Use a warm editorial palette as the app-shell default.

Recommended base tokens:

- Background: `#1a1a1a`
- Elevated surface: `#20201e`
- Control surface: `#24231f`
- Text: `#fafafa`
- Muted text: `#b8b8b8`
- Subtle text: `#85827c`
- Border: `#3a3832`
- Rule: `#4a463d`
- Accent: `#e8835b`
- Accent text on dark: `#ef9a73`
- Danger: `#e07070`
- Success, only when semantic: `#5ab88a`

Light/export paper variants may use:

- Paper: `#f7f4ee`
- Paper elevated: `#eee8dd`
- Ink: `#1a1a1a`
- Muted ink: `#55514b`
- Border: `#c6c0b6`
- Accent: `#c95f3d`

Rules:

- Accent is a mark, not a fill.
- Do not flood panels with accent backgrounds.
- Do not use purple/blue gradients as the main identity.
- Dark shadows must be black; never white glow.
- Use green/red only for actual semantic states, not decoration.

## 5. Typography

Recommended roles:

- Serif: canvas hero titles, cover/poster/wallpaper display text, occasional
  app-shell brand text.
- Mono: labels, tabs, dimensions, export names, counters, shortcuts, captions,
  OBS/source metadata.
- Sans: form controls and dense utility text where readability matters.

Use upright structure:

- headings should not be italic;
- Chinese should not use synthesized italic;
- avoid negative letter spacing;
- use wide tracking only on short mono labels, not long Chinese text.

Suggested font stacks:

```css
--live-font-serif: "Source Serif 4", "Noto Serif SC", Georgia, serif;
--live-font-sans: Inter, -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
--live-font-mono: "JetBrains Mono", "SF Mono", Menlo, monospace;
```

If external fonts are not wired yet, use local fallbacks and keep the hierarchy
stable.

## 6. Builder Shell

The builder is an editorial tool surface, not a marketing page.

### Top Bar

- Use text brand, not a logo mark.
- Use `Vibe Studio` as the text brand.
- Tabs should be hairline / underline states, not filled segmented pills.
- Search, settings, and export controls should share one quiet button language.
- The export action may be prominent through placement, not a loud fill.

### Tabs

Use mono labels and thin active states:

- inactive: subtle text;
- hover: accent text;
- active: text + warm accent underline/rule;
- no large colored background.

### Inspector

The inspector should feel like a precise editing rail:

- thin left border;
- section dividers;
- mono group labels;
- compact hints;
- no nested cards;
- no glowing accent bars;
- no accordion theatrics.

### Inputs And Toggles

- Inputs: warm control surface, thin border, clear focus outline.
- Toggles: restrained switch or checkbox; avoid saturated fills.
- Color inputs: show swatch and value, but do not dominate the row.
- Buttons: mono or sans, thin border, stable height.

### Command Palette

The command palette should mirror a quiet search overlay:

- centered dialog;
- warm black surface;
- black shadow only;
- mono group headings;
- selected row can use a subtle row background or left rule;
- shortcuts use small kbd boxes.

### Settings Drawer

- Warm black drawer with hairline left border.
- Use the same controls as the inspector.
- Theme/color tools should feel technical but not neon.

## 7. Broadcast Assets

Do not implement all of this in Phase 1 unless explicitly assigned. This section
defines the later direction.

### Overlay

The overlay must remain useful during a live stream:

- main screen area should be quiet and not compete with the captured app;
- sidebar should behave like a readable field note, not a colorful dashboard;
- bottom bar should summarize status, progress, and stack with thin dividers;
- LIVE indicator can be red, but small;
- camera frame should be clean and secondary.

### Cover

Cover screen direction:

- mono eyebrow;
- upright serif title;
- short subtitle;
- one thin rule or accent period;
- optional avatar, but not mandatory;
- less decorative chrome.

### Poster

Poster direction:

- 3-4 information groups max;
- title, topic/dek, platform/time or stack, signature;
- social links as a quiet footer row, not colored badges;
- may use warm paper or warm black.

### Wallpaper

Wallpaper direction:

- very quiet;
- title/slogan plus small signature;
- plenty of empty space;
- minimal or no social/card UI.

## 8. Motion And Interaction

Motion should be practical:

- hover transitions: about `120ms`;
- overlay/drawer transitions: about `200ms`;
- no springy or playful movement;
- respect `prefers-reduced-motion`;
- focus-visible must be clear and keyboard-friendly.

## 9. Anti-Patterns

Do not add:

- decorative gradient orbs;
- bokeh/glow blobs;
- emoji covers;
- logo marks unless explicitly requested;
- card piles;
- nested cards;
- large accent fills;
- heavy rounded boxes;
- platform-colored social blocks as primary visual structure;
- unreadable low-contrast dark-on-dark text.

## 10. Phase 1 Scope

For the first redesign phase, change only the builder shell and shared UI tokens:

- `src/lib/design-tokens.ts`
- `src/app/globals.css`
- `src/components/topbar/*`
- `src/components/inspector/*`
- `src/components/shared/Field.tsx`
- `src/components/SettingsDrawer.tsx`
- `src/components/CommandPalette.tsx`
- light-touch fixes to the Session Config shell (`LiveDataManager` and the
  `live-data/` Manual / Agent / JSON-drawer components) only if token changes
  make them visually inconsistent. (There is no longer a `SessionRecipePanel`
  or a Recipe / Brief flow — those were retired when Live Data became the
  Session Config center.)

Do not redesign:

- `OverlayCanvas`
- `CoverCanvas`
- `PosterCanvas`
- `WallpaperCanvas`
- `SidebarPanel`
- `BottomBarPanel`
- README screenshots

Those belong to later phases.

## 11. Verification

Before handing off:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Manual smoke:

- `/` loads;
- Overlay / Session Config / Cover / Poster / Wallpaper tabs work;
- command palette opens and closes;
- settings drawer opens and closes;
- export primary and export menu still work;
- inspector controls still update state;
- language switching still works;
- `/obs/overlay?camera=empty`, `/obs/overlay?camera=avatar`, `/obs/sidebar`,
  and `/obs/bottom-bar` render.

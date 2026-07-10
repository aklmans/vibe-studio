import { OverlayState } from "../types";
import { useLocale } from "../hooks/useLocale";
import { activeAgenda, sectionWindow } from "../lib/agenda";
import { fontFamilies, wrapProse } from "../lib/typography";
import { editorialPalette } from "./lib/editorial-palette";

interface SidebarSectionsProps {
  state: OverlayState;
}

/**
 * Shared section list used by both the live OverlayCanvas sidebar and the
 * SidebarPanel export slice. Editorial "field note" treatment: a single warm
 * accent marks only the active section; the rest read as quiet, muted notes.
 * No per-section rainbow accents, no glows.
 */
export default function SidebarSections({ state }: SidebarSectionsProps) {
  const { t, locale } = useLocale();
  const { colors } = state;
  const agenda = activeAgenda(state);
  const { textColor, mutedText, subtleText } = colors;
  const E = editorialPalette(colors);
  const accent = E.activeRule;
  const activeIdx = agenda.activeSection;
  const currentLabel = t("canvas.current");
  // The fixed-height sidebar shows a window of 3 sections from the active one;
  // with ≤ 3 sections this renders every section exactly as before.
  const total = agenda.sections.length;
  const { start, end } = sectionWindow(activeIdx, total);
  const windowed = agenda.sections
    .map((section, idx) => ({ section, idx }))
    .slice(start, end);

  return (
    <>
      {total > 3 && (
        <div
          data-testid="sidebar-section-window"
          style={{
            flexShrink: 0,
            padding: "10px 24px 0",
            fontFamily: fontFamilies.mono,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: subtleText,
          }}
        >
          {String(start + 1).padStart(2, "0")}–{String(end).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </div>
      )}
      {windowed.map(({ section, idx }) => {
        const isActive = idx === activeIdx;
        const headingColor = isActive ? textColor : mutedText;
        const railColor = isActive ? accent : E.line;

        const doneBullets = agenda.sectionsDone[idx] ?? [];
        const doneCount = doneBullets.filter(Boolean).length;
        const totalCount = section.bullets.length;
        const currentIdx = section.bullets.findIndex(
          (bullet, i) => !doneBullets[i] && bullet.trim().length > 0,
        );
        const firstCurrentIdx = currentIdx >= 0 ? currentIdx : 0;

        return (
          <div
            key={idx}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "16px 24px",
              borderBottom:
                idx < agenda.sections.length - 1
                  ? `1px solid ${E.line}`
                  : "none",
              overflow: "hidden",
              // De-emphasis is by ink colour + weight, not opacity — dimming the
              // whole block pushed inactive copy under the Light paper contrast
              // floor. Active identity still comes from the rail, weight, ink and
              // the "now" marker below — never a filled accent block.
              background: "transparent",
            }}
          >
            {/* Title row + progress glyph */}
            <div
              style={{
                fontFamily: fontFamilies.mono,
                fontSize: isActive ? 12 : 11,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: "0.08em",
                color: headingColor,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 9,
              }}
            >
              <div
                style={{
                  width: isActive ? 3 : 2,
                  height: isActive ? 18 : 13,
                  background: railColor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {section.title}
              </span>
              {/* Progress glyph: filled / empty squares + small count */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 10,
                  fontWeight: 500,
                  color: isActive ? mutedText : subtleText,
                  letterSpacing: "0.06em",
                }}
              >
                <span style={{ display: "inline-flex", gap: 3 }}>
                  {Array.from({ length: totalCount }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: 2,
                        background: doneBullets[i] ? accent : "transparent",
                        border: `1px solid ${
                          doneBullets[i] ? accent : E.line
                        }`,
                      }}
                    />
                  ))}
                </span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {doneCount}/{totalCount}
                </span>
              </span>
            </div>

            {/* Bullets */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {section.bullets.map((bullet, bIdx) => {
                const done = doneBullets[bIdx] ?? false;
                const current = isActive && !done && bIdx === firstCurrentIdx;
                return (
                  <div
                    key={bIdx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: current ? 11 : 10,
                      fontSize: current ? 15 : 14,
                      color: done
                        ? `${textColor}99`
                        : isActive
                          ? textColor
                          : mutedText,
                      lineHeight: 1.48,
                      fontWeight: current ? 650 : 450,
                    }}
                  >
                    {done ? (
                      <div
                        style={{
                          width: 15,
                          height: 15,
                          borderRadius: "50%",
                          background: `${accent}26`,
                          border: `1px solid ${accent}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 3,
                          flexShrink: 0,
                        }}
                      >
                        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                          <path
                            d="M1.5 4.5L3.5 6.5L7.5 2.5"
                            stroke={accent}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: current ? 9 : 5,
                          height: current ? 9 : 5,
                          borderRadius: "50%",
                          background: current ? accent : `${mutedText}66`,
                          border: current ? `2px solid ${E.lineStrong}` : "none",
                          marginTop: current ? 6 : 7,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      style={{
                        ...wrapProse,
                        minWidth: 0,
                        textDecoration: done ? "line-through" : "none",
                      }}
                    >
                      {bullet}
                      {current && (
                        <span
                          style={{
                            marginLeft: 8,
                            fontFamily: fontFamilies.mono,
                            fontSize: 9,
                            fontWeight: 700,
                            letterSpacing: locale === "en" ? "0.1em" : 0,
                            color: accent,
                            textTransform: locale === "en" ? "uppercase" : "none",
                          }}
                        >
                          {currentLabel}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

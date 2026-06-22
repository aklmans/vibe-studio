import { OverlayState } from "../types";
import { fontFamilies, wrapProse } from "../lib/typography";

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
  const { sidebar, colors } = state;
  const { borderColor, textColor, mutedText, subtleText, pinkAccent } = colors;
  const accent = pinkAccent;
  const activeIdx = sidebar.activeSection;

  return (
    <>
      {sidebar.sections.map((section, idx) => {
        const isActive = idx === activeIdx;
        const headingColor = isActive ? textColor : mutedText;
        const railColor = isActive ? accent : `${borderColor}80`;

        const doneBullets = sidebar.sectionsDone?.[idx] ?? [];
        const doneCount = doneBullets.filter(Boolean).length;
        const totalCount = section.bullets.length;

        return (
          <div
            key={idx}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "16px 24px",
              borderBottom:
                idx < sidebar.sections.length - 1
                  ? `1px solid ${borderColor}33`
                  : "none",
              overflow: "hidden",
              opacity: isActive ? 1 : 0.66,
              background: isActive ? `${accent}0d` : "transparent",
            }}
          >
            {/* Title row + progress glyph */}
            <div
              style={{
                fontFamily: fontFamilies.mono,
                fontSize: 11,
                fontWeight: 600,
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
                  width: 2,
                  height: 13,
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
                  color: subtleText,
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
                          doneBullets[i] ? accent : `${borderColor}80`
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
                return (
                  <div
                    key={bIdx}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      fontSize: 14,
                      color: done ? `${textColor}66` : textColor,
                      lineHeight: 1.5,
                    }}
                  >
                    {done ? (
                      <div
                        style={{
                          width: 15,
                          height: 15,
                          borderRadius: "50%",
                          background: `${accent}26`,
                          border: `1px solid ${accent}66`,
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
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: `${mutedText}66`,
                          marginTop: 7,
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

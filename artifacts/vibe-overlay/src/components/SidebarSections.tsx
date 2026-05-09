import { OverlayState } from "../types";

interface SidebarSectionsProps {
  state: OverlayState;
}

/**
 * Shared section list used by both the live OverlayCanvas sidebar and the
 * SidebarPanel export slice. Keeps the "active section is the only one
 * accented" behavior consistent across canvas and slice.
 */
export default function SidebarSections({ state }: SidebarSectionsProps) {
  const { sidebar, colors } = state;
  const { borderColor, textColor, mutedText, cyanAccent, pinkAccent, warmAccent } = colors;
  const accents = [cyanAccent, pinkAccent, warmAccent];
  const activeIdx = sidebar.activeSection;

  return (
    <>
      {sidebar.sections.map((section, idx) => {
        const isActive = idx === activeIdx;
        const sectionAccent = accents[idx] ?? cyanAccent;
        // Active section uses its accent. Inactive sections fall back to a
        // neutral muted color so the viewer's eye locks onto the current step.
        const headingColor = isActive ? sectionAccent : `${mutedText}80`;
        const railColor = isActive ? sectionAccent : `${mutedText}40`;

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
                  ? `1px solid ${borderColor}25`
                  : "none",
              overflow: "hidden",
              opacity: isActive ? 1 : 0.7,
              background: isActive ? `${sectionAccent}08` : "transparent",
            }}
          >
            {/* Title row + progress glyph */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.05em",
                color: headingColor,
                marginBottom: 10,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 3,
                  height: 12,
                  borderRadius: 2,
                  background: railColor,
                  boxShadow: isActive
                    ? `0 0 8px ${sectionAccent}80`
                    : "none",
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1 }}>{section.title}</span>
              {/* Progress glyph: filled / empty squares + small count */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10,
                  fontWeight: 600,
                  color: isActive ? sectionAccent : `${mutedText}60`,
                  letterSpacing: "0.06em",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    gap: 3,
                  }}
                >
                  {Array.from({ length: totalCount }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: doneBullets[i]
                          ? sectionAccent
                          : "transparent",
                        border: `1px solid ${
                          doneBullets[i] ? sectionAccent : `${mutedText}50`
                        }`,
                      }}
                    />
                  ))}
                </span>
                <span style={{ opacity: 0.85 }}>
                  {doneCount}/{totalCount}
                </span>
              </span>
            </div>

            {/* Bullets */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
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
                      color: done ? `${textColor}55` : textColor,
                      lineHeight: 1.5,
                    }}
                  >
                    {done ? (
                      <div
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: "50%",
                          background: `${sectionAccent}25`,
                          border: `1px solid ${sectionAccent}60`,
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
                            stroke={sectionAccent}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    ) : (
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: `${mutedText}55`,
                          marginTop: 7,
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      style={{
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

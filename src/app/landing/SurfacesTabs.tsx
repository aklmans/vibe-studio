"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { imageSrcForTheme } from "./content";
import type { LandingTheme, SurfaceCard, SurfaceGalleryImage } from "./content";

interface SurfacesTabsProps {
  cards: ReadonlyArray<SurfaceCard>;
  tablistLabel: string;
  panelEyebrow: string;
  theme: LandingTheme;
  galleryCarouselLabel: string;
  galleryControlsLabel: string;
  galleryPrevLabel: string;
  galleryNextLabel: string;
}

/**
 * Accessible tabs for the Surfaces section. Uses the WAI-ARIA tabs pattern:
 * - container has role="tablist"
 * - each tab is a button with role="tab", aria-selected, aria-controls
 * - each panel has role="tabpanel", aria-labelledby
 * - Left/Right arrows move focus and activate (automatic activation)
 * - Home/End jump to first/last tab
 * - Focus ring uses the warm accent color
 *
 * Only this component is a client component; the rest of the landing page
 * stays server-rendered.
 */
export default function SurfacesTabs({
  cards,
  tablistLabel,
  panelEyebrow,
  theme,
  galleryCarouselLabel,
  galleryControlsLabel,
  galleryPrevLabel,
  galleryNextLabel,
}: SurfacesTabsProps) {
  const [selected, setSelected] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();

  const focusTab = useCallback((index: number) => {
    const clamped = ((index % cards.length) + cards.length) % cards.length;
    setSelected(clamped);
    tabRefs.current[clamped]?.focus();
  }, [cards.length]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
          event.preventDefault();
          focusTab(selected + 1);
          break;
        case "ArrowLeft":
        case "ArrowUp":
          event.preventDefault();
          focusTab(selected - 1);
          break;
        case "Home":
          event.preventDefault();
          focusTab(0);
          break;
        case "End":
          event.preventDefault();
          focusTab(cards.length - 1);
          break;
      }
    },
    [selected, focusTab, cards.length],
  );

  // Keep tabRefs array length in sync if cards change (static in practice).
  useEffect(() => {
    tabRefs.current = tabRefs.current.slice(0, cards.length);
  }, [cards.length]);

  return (
    <>
      <div className="akl-surface-tablist" role="tablist" aria-label={tablistLabel}>
        {cards.map((card, index) => {
          const tabId = `${baseId}-tab-${card.id}`;
          const panelId = `${baseId}-panel-${card.id}`;
          const isSelected = index === selected;
          return (
            <button
              key={card.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={tabId}
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              className="akl-surface-tab"
              data-selected={isSelected || undefined}
              onClick={() => setSelected(index)}
              onKeyDown={onKeyDown}
            >
              {card.title}
            </button>
          );
        })}
      </div>
      <div className="akl-surface-stage">
        {cards.map((card, index) => {
          const tabId = `${baseId}-tab-${card.id}`;
          const panelId = `${baseId}-panel-${card.id}`;
          const isSelected = index === selected;
          return (
            <article
              key={card.id}
              id={panelId}
              role="tabpanel"
              aria-labelledby={tabId}
              hidden={!isSelected}
              className={`akl-surface-panel akl-surface-panel-${card.id} akl-surface-kind-${card.kind}`}
              data-surface-kind={card.kind}
            >
              <div className={`akl-surface-preview${card.gallery ? " akl-surface-preview-gallery" : ""}`}>
                {card.gallery ? (
                  <GalleryCarousel
                    images={card.gallery}
                    baseId={`${baseId}-gallery-${card.id}`}
                    theme={theme}
                    carouselLabel={galleryCarouselLabel}
                    controlsLabel={galleryControlsLabel}
                    prevLabel={galleryPrevLabel}
                    nextLabel={galleryNextLabel}
                  />
                ) : card.image ? (
                  <img
                    src={imageSrcForTheme(card.image, theme)}
                    alt={card.image.alt}
                    width={card.image.width}
                    height={card.image.height}
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
              </div>
              <div className="akl-surface-copy">
                <p className="akl-eyebrow">{panelEyebrow}</p>
                <h3>{card.title}</h3>
                <p>{card.summary}</p>
                <ul>
                  {card.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

interface GalleryCarouselProps {
  images: ReadonlyArray<SurfaceGalleryImage>;
  baseId: string;
  theme: LandingTheme;
  carouselLabel: string;
  controlsLabel: string;
  prevLabel: string;
  nextLabel: string;
}

/**
 * A lightweight carousel for the Export-the-kit gallery. Keeps the image stage
 * clean: slide metadata sits in a bottom rail and controls live below the image.
 *
 * Accessibility:
 * - The viewport is a group with aria-label.
 * - Prev/Next buttons have aria-label and aria-controls.
 * - The current image has aria-roledescription="slide" and an aria-label with
 *   its position.
 * - Arrow Left/Right on the viewport switch slides.
 * - Home/End jump to first/last.
 * - Buttons are real <button> elements with visible focus rings.
 */
function GalleryCarousel({ images, baseId, theme, carouselLabel, controlsLabel, prevLabel, nextLabel }: GalleryCarouselProps) {
  const [current, setCurrent] = useState(0);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const count = images.length;

  const goTo = useCallback(
    (index: number) => {
      const clamped = ((index % count) + count) % count;
      setCurrent(clamped);
    },
    [count],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          goTo(current - 1);
          break;
        case "ArrowRight":
          event.preventDefault();
          goTo(current + 1);
          break;
        case "Home":
          event.preventDefault();
          goTo(0);
          break;
        case "End":
          event.preventDefault();
          goTo(count - 1);
          break;
      }
    },
    [current, goTo, count],
  );

  const prevId = `${baseId}-prev`;
  const nextId = `${baseId}-next`;
  const viewportId = `${baseId}-viewport`;
  const activeImage = images[current];
  const positionLabel = `${String(current + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;

  return (
    <div className="akl-surface-gallery">
      <div className="akl-gallery-stage">
        <div
          id={viewportId}
          ref={viewportRef}
          className="akl-gallery-viewport"
          tabIndex={0}
          aria-label={carouselLabel}
          onKeyDown={onKeyDown}
        >
          {images.map((img, index) => {
            const isActive = index === current;
            return (
              <figure
                key={img.darkSrc}
                className="akl-surface-gallery-item"
                data-active={isActive || undefined}
                aria-hidden={!isActive || undefined}
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${count}: ${img.label}`}
              >
                <img
                  src={imageSrcForTheme(img, theme)}
                  alt={img.alt}
                  width={img.width}
                  height={img.height}
                  loading={index === 0 ? "eager" : "lazy"}
                  decoding="async"
                />
              </figure>
            );
          })}
        </div>
        <p className="akl-gallery-meta" aria-live="polite">
          {activeImage.label}
        </p>
      </div>
      <div className="akl-gallery-controls" aria-label={controlsLabel}>
        <button
          type="button"
          id={prevId}
          className="akl-gallery-button akl-gallery-prev"
          aria-label={prevLabel}
          aria-controls={viewportId}
          onClick={() => goTo(current - 1)}
          disabled={count <= 1}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M9 2L4 7l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="akl-gallery-position" aria-live="polite">
          <span>{positionLabel}</span>
        </p>
        <button
          type="button"
          id={nextId}
          className="akl-gallery-button akl-gallery-next"
          aria-label={nextLabel}
          aria-controls={viewportId}
          onClick={() => goTo(current + 1)}
          disabled={count <= 1}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M5 2l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="akl-gallery-caption">{images.map((img) => img.label.split(" · ")[0]).join(" → ")}</p>
    </div>
  );
}

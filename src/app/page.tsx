const MAIN_SITE_URL = "https://aklman.com";
const GITHUB_URL = "https://github.com/aklmans/Vibe-Coding-Live";
const GITHUB_PROFILE_URL = "https://github.com/aklmans";
const X_URL = "https://x.com/aklman2018";
const RSS_URL = "https://aklman.com/rss.xml";

const appNav = [
  { label: "Product", href: "#product" },
  { label: "Surfaces", href: "#surfaces" },
  { label: "Workflow", href: "#workflow" },
  { label: "Studio", href: "/studio" },
  { label: "GitHub", href: GITHUB_URL },
];

const mobileNav = [
  { label: "Product", href: "#product" },
  { label: "Surfaces", href: "#surfaces" },
  { label: "Workflow", href: "#workflow" },
  { label: "Try demo", href: "/demo" },
  { label: "Studio", href: "/studio" },
  { label: "GitHub", href: GITHUB_URL },
  { label: "Main site", href: MAIN_SITE_URL },
];

const featureItems = [
  {
    title: "Live Overlay Builder",
    copy: "Design a transparent main-screen frame, camera slot, sidebar and bottom bar without rebuilding surfaces by hand.",
  },
  {
    title: "Session Config Agent",
    copy: "Ask the agent for a session plan. Review the proposed config in a JSON drawer. Apply it only when you are ready.",
  },
  {
    title: "OBS-ready browser sources",
    copy: "Keep overlay, sidebar and bottom bar as clean browser sources while OBS owns the actual screen capture below.",
  },
];

const workflowItems = [
  {
    title: "Describe the session",
    copy: "Write a short brief or ask the agent to draft one. The agent proposes a config; nothing is applied yet.",
  },
  {
    title: "Review the config",
    copy: "Open the proposal in the JSON review drawer. Inspect the diff, then Apply — or discard. You stay in control.",
  },
  {
    title: "Connect OBS sources",
    copy: "Add overlay, sidebar and bottom bar as browser sources. OBS or Livehime keeps the real screen capture underneath.",
  },
  {
    title: "Export the kit",
    copy: "Export cover, poster, sidebar, bottom bar and wallpapers. Run Export All for the whole package from one state.",
  },
];

const agentFlow = [
  {
    step: "01",
    title: "Agent drafts a session config",
    copy: "Describe the stream. The agent returns a proposed config — title, sections, stack, socials — as JSON you can read.",
  },
  {
    step: "02",
    title: "Human reviews and applies",
    copy: "The proposal opens in the JSON review drawer. Inspect the field-level diff, then Apply. Nothing is auto-applied.",
  },
  {
    step: "03",
    title: "OBS renders browser sources",
    copy: "The overlay, sidebar and bottom bar render as clean browser sources. OBS owns the real capture below the frame.",
  },
];

const agentSafety = [
  "AI output is never auto-applied. A returned config opens in the JSON review drawer, exactly like Import.",
  "The API key stays on the server. It never enters the client bundle, localStorage, or logs.",
];

type SurfaceKind = "wide" | "tall" | "strip";

const visualCards: ReadonlyArray<{
  id: string;
  kind: SurfaceKind;
  title: string;
  src: string;
  alt: string;
  summary: string;
  points: string[];
}> = [
  {
    id: "cover",
    kind: "wide",
    title: "Cover",
    src: "/product/vibe-coding-cover.png",
    alt: "Vibe Coding Live cover export",
    summary: "Open the stream with an editorial title card that already matches the overlay language.",
    points: ["Serif headline and host profile", "Warm dark / light theme aware", "Export-ready social preview"],
  },
  {
    id: "poster",
    kind: "wide",
    title: "Poster",
    src: "/product/vibe-coding-poster.png",
    alt: "Vibe Coding Live poster export",
    summary: "Generate a compact promotional poster from the same session configuration.",
    points: ["Session topic and agenda", "Reusable host identity", "Clean social sharing asset"],
  },
  {
    id: "sidebar",
    kind: "tall",
    title: "Sidebar",
    src: "/product/vibe-coding-sidebar.png",
    alt: "Vibe Coding Live sidebar export",
    summary: "Keep the live sidebar readable as a separate OBS browser source.",
    points: ["Current focus and section progress", "Quiet social metadata", "Transparent source friendly"],
  },
  {
    id: "bottom-bar",
    kind: "strip",
    title: "Bottom bar",
    src: "/product/vibe-coding-bottom-bar.png",
    alt: "Vibe Coding Live bottom bar export",
    summary: "Use a broadcast metadata strip for timer, progress and stack details.",
    points: ["Low-profile status signals", "Stack chips and session metadata", "Consistent export slice"],
  },
];

const faqItems = [
  {
    question: "Is the public demo connected to my private stream?",
    answer: "No. Demo mode uses local browser storage and avoids real provider calls, database writes and OBS live-state publishing.",
  },
  {
    question: "Does the AI agent ever auto-apply changes?",
    answer:
      "No. Returned configs open in the JSON review drawer. You apply them manually. The agent never writes directly to OBS, localStorage, the database, or runtime state.",
  },
  {
    question: "Can I still use this as a private studio?",
    answer: "Yes. Open /studio for the full workspace that can connect to server-side AI, database persistence and OBS automation.",
  },
  {
    question: "Where is the real screen capture?",
    answer: "The overlay owns the UI frame. OBS or Livehime owns the real screen/video capture underneath, so layout stays flexible.",
  },
  {
    question: "Can I export the whole broadcast kit?",
    answer: "Yes. The app exports overlay, cover, poster, wallpaper set, sidebar and bottom bar assets from the same state.",
  },
];

const mobileMenuScript = `
  (function () {
    var menu = document.querySelector('[data-testid="landing-mobile-menu"]');
    if (!menu) return;
    menu.addEventListener('click', function (e) {
      if (e.target instanceof Element && e.target.closest('a')) menu.open = false;
    });
  })();
`;

export default function LandingPage() {
  return (
    <main data-testid="landing-page" className="akl-page">
      <style>{landingCss}</style>

      <header data-testid="landing-site-header" className="akl-site-header">
        <div className="akl-shell akl-header-row">
          <a className="akl-brand" href={MAIN_SITE_URL} aria-label="Return to Aklman main site">
            Aklman
          </a>
          <nav
            className="akl-site-nav"
            aria-label="Vibe Coding Live navigation"
            data-testid="landing-desktop-nav"
          >
            {appNav.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="akl-header-actions">
            <a
              href={MAIN_SITE_URL}
              className="akl-main-site-link"
              data-testid="landing-main-site-link"
            >
              Main site
            </a>
            <a href="/demo" data-testid="landing-demo-link" className="akl-button akl-button-light">
              Try Demo
            </a>
            <details className="akl-mobile-menu" data-testid="landing-mobile-menu">
              <summary className="akl-mobile-toggle" aria-label="Open navigation menu">
                <span>Menu</span>
                <i aria-hidden="true"></i>
              </summary>
              <nav className="akl-mobile-nav" aria-label="Mobile navigation">
                {mobileNav.map((item) => (
                  <a key={item.label} href={item.href}>
                    {item.label}
                  </a>
                ))}
              </nav>
            </details>
          </div>
        </div>
      </header>

      <section id="product" className="akl-hero">
        <p className="akl-hero-wordmark">Vibe Coding Live</p>
        <p className="akl-eyebrow">Editorial broadcast workbench</p>
        <h1>Broadcast graphics for coding streams</h1>
        <p className="akl-hero-lede">
          Prepare a live session, design every broadcast surface, point OBS browser sources at it,
          and export the full visual kit. Optional AI drafts the config — you review and apply.
        </p>
        <div className="akl-hero-actions">
          <a href="/demo" className="akl-button akl-button-light">
            Try Demo
          </a>
          <a href="/studio" className="akl-button akl-button-dark">
            Open Studio
          </a>
        </div>
        <p className="akl-hero-note">
          Demo mode is local-only. Private studio at <a href="/studio">/studio</a>.
          <br />
          <a href={GITHUB_URL} className="akl-hero-github">View on GitHub</a>
        </p>
      </section>

      <section className="akl-showcase" aria-label="Vibe Coding Live product preview">
        <div data-testid="landing-product-preview" className="akl-product-frame">
          <div className="akl-window-top" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <b>overlay · 1920×1080</b>
          </div>
          <img
            src="/product/vibe-coding-overlay.png"
            alt="Vibe Coding Live overlay export"
            className="akl-overlay-img"
          />
        </div>
      </section>

      <section id="features" className="akl-section akl-split-section">
        <div>
          <p className="akl-eyebrow">Features</p>
          <h2>What could you do with Vibe Coding Live?</h2>
        </div>
        <div className="akl-feature-list">
          {featureItems.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="surfaces" className="akl-section akl-surface-tabs" aria-label="Export examples">
        <p className="akl-eyebrow">Surfaces</p>
        <h2>One session config, many broadcast assets</h2>
        {visualCards.map((item) => (
          <input
            key={item.id}
            className="akl-surface-input"
            type="radio"
            id={`surface-${item.id}`}
            name="akl-surface"
            defaultChecked={item.id === "cover"}
          />
        ))}
        <div className="akl-surface-tablist" aria-label="Broadcast surface examples">
          {visualCards.map((item) => (
            <label key={item.id} className="akl-surface-tab" htmlFor={`surface-${item.id}`}>
              {item.title}
            </label>
          ))}
        </div>
        <div className="akl-surface-stage">
          {visualCards.map((item) => (
            <article
              key={item.id}
              className={`akl-surface-panel akl-surface-panel-${item.id} akl-surface-kind-${item.kind}`}
              data-surface-kind={item.kind}
            >
              <div className="akl-surface-preview">
                <img src={item.src} alt={item.alt} />
              </div>
              <div className="akl-surface-copy">
                <p className="akl-eyebrow">Export surface</p>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <ul>
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="workflow" className="akl-section">
        <p className="akl-eyebrow">Workflow</p>
        <h2>Meets you where you stream</h2>
        <div className="akl-workflow-grid">
          {workflowItems.map((item, index) => (
            <article key={item.title} className="akl-workflow-card">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="agent" className="akl-section akl-agent" aria-label="AI-assisted session prep">
        <p className="akl-eyebrow">Agent-assisted session prep</p>
        <h2>AI prepares. You review. OBS renders.</h2>
        <p className="akl-agent-lede">
          The Session Config Agent drafts a live-session config from your brief. You read the
          proposal, inspect the diff, and apply it only when it looks right. OBS then renders the
          overlay, sidebar and bottom bar as clean browser sources.
        </p>

        <ol className="akl-agent-flow" data-testid="landing-agent-flow">
          {agentFlow.map((item) => (
            <li key={item.step} className="akl-agent-step">
              <span className="akl-agent-step-num">{item.step}</span>
              <div className="akl-agent-step-body">
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
            </li>
          ))}
        </ol>

        <ul className="akl-agent-safety" data-testid="landing-agent-safety">
          {agentSafety.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>

        <p className="akl-agent-providers">
          Works with any OpenAI-compatible provider — DeepSeek, OpenAI, Kimi, z.ai and others —
          configured by server env. No key configured? The agent falls back to a local copy handoff.
        </p>
      </section>

      <section id="get-started" className="akl-section akl-guide">
        <div className="akl-guide-copy">
          <p className="akl-eyebrow">Get started</p>
          <h2>Try the demo, then take the studio live.</h2>
          <p>
            Start with the safe public demo, then move to the private studio when you want real AI
            provider configuration, database persistence and OBS automation.
          </p>
        </div>
        <div className="akl-guide-steps">
          <ol>
            <li>
              <span>01</span>
              <div>
                <h3>Open the public demo</h3>
                <p>Local-only. No provider calls, no database writes, no OBS side effects.</p>
                <a href="/demo" className="akl-guide-link">Try Demo →</a>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Run the private studio</h3>
                <p>Full workspace with optional AI, persistence and OBS automation.</p>
                <a href="/studio" className="akl-guide-link">Open Studio →</a>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Add OBS browser sources</h3>
                <p>Point OBS at these routes, place real captures underneath.</p>
                <code className="akl-guide-routes">
                  /obs/overlay?camera=empty<br />
                  /obs/overlay?camera=avatar<br />
                  /obs/sidebar<br />
                  /obs/bottom-bar
                </code>
              </div>
            </li>
          </ol>
          <div className="akl-guide-meta">
            <code>pnpm dev</code>
            <a href={GITHUB_URL} className="akl-guide-link">README on GitHub →</a>
          </div>
        </div>
      </section>

      <section id="faq" className="akl-faq">
        <p className="akl-faq-mark">?</p>
        <h2>FAQ</h2>
        <div className="akl-faq-list">
          {faqItems.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer data-testid="landing-site-footer" className="akl-site-footer">
        <div className="akl-shell akl-footer-row">
          <p>Aklman · 2026</p>
          <nav aria-label="Footer links">
            <a href={MAIN_SITE_URL}>Main site</a>
            <span aria-hidden="true">/</span>
            <a href={GITHUB_PROFILE_URL}>GitHub</a>
            <span aria-hidden="true">/</span>
            <a href={X_URL}>X</a>
            <span aria-hidden="true">/</span>
            <a href={RSS_URL}>RSS</a>
          </nav>
        </div>
      </footer>

      <script dangerouslySetInnerHTML={{ __html: mobileMenuScript }} />
    </main>
  );
}

const landingCss = `
  .akl-page {
    --akl-fixed-header-height: 88px;
    --akl-anchor-offset: calc(var(--akl-fixed-header-height) + 16px);
    --akl-border: #3a3832;
    --akl-border-subtle: #2f2d29;
    --akl-bg: #1a1a1a;
    --akl-surface: #20201e;
    --akl-text: #fafafa;
    --akl-text-muted: #9b958d;
    --akl-text-subtle: #7e776e;
    --akl-accent: #e8835b;
    --akl-paper: #f4efe6;
    --akl-paper-ink: #161513;
    min-height: 100vh;
    padding-top: var(--akl-fixed-header-height);
    background: var(--akl-bg);
    color: #f4efe6;
    font-family: var(--app-font-sans);
  }

  .akl-page a {
    color: inherit;
    text-decoration: none;
  }

  /* Offset anchor targets so fixed header does not cover section headings. */
  .akl-page section[id] {
    scroll-margin-top: var(--akl-anchor-offset);
  }

  .akl-shell {
    width: min(100%, 1180px);
    margin: 0 auto;
    padding-inline: 32px;
  }

  /* ─── Header ─────────────────────────────────────────── */

  .akl-site-header {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 50;
    background: color-mix(in srgb, var(--akl-bg) 92%, transparent);
    backdrop-filter: saturate(140%) blur(10px);
    -webkit-backdrop-filter: saturate(140%) blur(10px);
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-header-row {
    min-height: 84px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }

  .akl-brand {
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-size: 28px;
    font-weight: 500;
    line-height: 1;
    transition: color 180ms ease;
  }

  .akl-brand:hover,
  .akl-brand:focus-visible {
    color: var(--akl-accent);
  }

  .akl-site-nav {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 24px;
    margin-left: auto;
  }

  .akl-header-actions {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: nowrap;
  }

  .akl-site-nav a {
    position: relative;
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.22em;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
    transition: color 180ms ease;
  }

  .akl-site-nav a::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: -8px;
    left: 0;
    height: 1.5px;
    background: var(--akl-accent);
    opacity: 0;
    transform: scaleX(0.42);
    transform-origin: center;
    transition:
      opacity 180ms ease,
      transform 180ms ease;
  }

  .akl-site-nav a:hover,
  .akl-site-nav a:focus-visible {
    color: var(--akl-accent);
  }

  .akl-site-nav a:hover::after,
  .akl-site-nav a:focus-visible::after {
    opacity: 0.45;
    transform: scaleX(1);
  }

  /* Subtle "Main site" return link — visually below product nav. */
  .akl-main-site-link {
    color: var(--akl-text-subtle);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    white-space: nowrap;
    transition: color 180ms ease;
  }

  .akl-main-site-link:hover,
  .akl-main-site-link:focus-visible {
    color: var(--akl-accent);
  }

  .akl-site-nav a:focus-visible,
  .akl-main-site-link:focus-visible,
  .akl-brand:focus-visible,
  .akl-button:focus-visible,
  .akl-command a:focus-visible,
  .akl-surface-tab:focus-visible,
  .akl-mobile-toggle:focus-visible,
  .akl-mobile-nav a:focus-visible,
  .akl-hero-github:focus-visible {
    outline: 0.5px solid var(--akl-accent);
    outline-offset: 4px;
  }

  /* ─── Mobile menu ────────────────────────────────────── */

  .akl-mobile-menu {
    display: none;
  }

  .akl-mobile-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    line-height: 1;
    list-style: none;
    white-space: nowrap;
    transition: color 180ms ease;
  }

  .akl-mobile-toggle::-webkit-details-marker {
    display: none;
  }

  .akl-mobile-toggle i {
    position: relative;
    width: 1rem;
    height: 0.7rem;
  }

  .akl-mobile-toggle i::before,
  .akl-mobile-toggle i::after {
    content: "";
    position: absolute;
    left: 0;
    width: 100%;
    height: 1.5px;
    background: currentColor;
    transition:
      top 180ms ease,
      transform 180ms ease;
  }

  .akl-mobile-toggle i::before {
    top: 0.1rem;
  }

  .akl-mobile-toggle i::after {
    top: 0.48rem;
  }

  .akl-mobile-toggle:hover,
  .akl-mobile-toggle:focus-visible {
    color: var(--akl-accent);
  }

  .akl-mobile-menu[open] .akl-mobile-toggle i::before {
    top: 0.3rem;
    transform: rotate(45deg);
  }

  .akl-mobile-menu[open] .akl-mobile-toggle i::after {
    top: 0.3rem;
    transform: rotate(-45deg);
  }

  .akl-mobile-nav {
    position: absolute;
    top: 100%;
    right: 0;
    left: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0;
    padding: 8px 18px 20px;
    border-bottom: 0.5px solid var(--akl-border);
    background: color-mix(in srgb, var(--akl-bg) 96%, transparent);
    backdrop-filter: saturate(140%) blur(10px);
    -webkit-backdrop-filter: saturate(140%) blur(10px);
  }

  .akl-mobile-nav a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 2.4rem;
    padding: 0.5rem 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
    color: #c8c5be;
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    transition: color 160ms ease;
  }

  .akl-mobile-nav a:hover,
  .akl-mobile-nav a:focus-visible {
    color: var(--akl-accent);
  }

  /* ─── Buttons ────────────────────────────────────────── */

  .akl-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    border-radius: 2px;
    padding: 0 18px;
    font-family: var(--app-font-sans);
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
    transition:
      background 180ms ease,
      border-color 180ms ease,
      color 180ms ease;
  }

  .akl-page .akl-button-light {
    background: var(--akl-paper);
    color: #161513;
  }

  .akl-page .akl-button-light:hover,
  .akl-page .akl-button-light:focus-visible {
    background: #fff;
  }

  .akl-page .akl-button-dark {
    border: 0.5px solid var(--akl-border);
    background: var(--akl-surface);
    color: var(--akl-text);
  }

  .akl-page .akl-button-dark:hover,
  .akl-page .akl-button-dark:focus-visible {
    border-color: var(--akl-accent);
    color: var(--akl-accent);
  }

  /* ─── Hero ───────────────────────────────────────────── */

  .akl-hero {
    width: min(100%, 1080px);
    margin: 0 auto;
    padding: 88px 32px 64px;
    text-align: center;
  }

  .akl-hero-wordmark {
    margin: 0 0 14px;
    color: var(--akl-text-subtle);
    font-family: var(--app-font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.28em;
    text-transform: uppercase;
  }

  .akl-eyebrow {
    margin: 0;
    color: var(--akl-accent);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .akl-hero h1,
  .akl-section h2,
  .akl-guide-copy h2,
  .akl-faq h2 {
    margin: 0;
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-weight: 500;
    letter-spacing: 0;
  }

  .akl-hero h1 {
    margin-top: 16px;
    font-size: 80px;
    line-height: 1;
  }

  .akl-hero h1::after {
    content: ".";
    color: var(--akl-accent);
  }

  .akl-hero-lede {
    max-width: 720px;
    margin: 26px auto 0;
    color: var(--akl-text-muted);
    font-size: 22px;
    line-height: 1.45;
  }

  .akl-hero-actions {
    margin-top: 32px;
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .akl-hero-note {
    margin: 18px 0 0;
    color: var(--akl-text-subtle);
    font-size: 14px;
    line-height: 1.7;
  }

  .akl-hero-note a {
    border-bottom: 0.5px solid #4a463d;
    color: #aaa49b;
    transition:
      color 180ms ease,
      border-color 180ms ease;
  }

  .akl-hero-note a:hover,
  .akl-hero-note a:focus-visible {
    color: var(--akl-accent);
    border-bottom-color: var(--akl-accent);
  }

  .akl-hero-github {
    display: inline-block;
    margin-top: 4px;
    color: var(--akl-text-muted);
    font-family: var(--app-font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    border-bottom: 0.5px solid var(--akl-border);
    padding-bottom: 1px;
  }

  .akl-hero-github:hover,
  .akl-hero-github:focus-visible {
    color: var(--akl-accent);
    border-bottom-color: var(--akl-accent);
  }

  /* ─── Product showcase ───────────────────────────────── */

  .akl-showcase {
    width: min(100%, 1420px);
    margin: 0 auto;
    padding: 20px 32px 112px;
  }

  .akl-product-frame {
    overflow: hidden;
    border: 0.5px solid var(--akl-border);
    border-radius: 2px;
    background: #171615;
  }

  .akl-window-top {
    min-height: 36px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 18px;
    border-bottom: 0.5px solid var(--akl-border);
    background: #25231f;
  }

  .akl-window-top span {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #70695e;
  }

  .akl-window-top b {
    margin-left: auto;
    color: #8b847a;
    font-family: var(--app-font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .akl-overlay-img {
    display: block;
    width: 100%;
    height: auto;
  }

  /* ─── Sections ───────────────────────────────────────── */

  .akl-section {
    width: min(100%, 1180px);
    margin: 0 auto;
    padding: 96px 32px;
  }

  .akl-split-section {
    display: grid;
    grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
    gap: 72px;
    align-items: start;
  }

  .akl-section h2,
  .akl-guide-copy h2,
  .akl-faq h2 {
    margin-top: 16px;
    font-size: 48px;
    line-height: 1.05;
  }

  .akl-feature-list {
    border-top: 0.5px solid var(--akl-border-subtle);
  }

  .akl-feature-list article {
    padding: 26px 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-feature-list h3,
  .akl-workflow-card h3 {
    margin: 0;
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-size: 22px;
    font-weight: 600;
    line-height: 1.2;
  }

  .akl-feature-list p,
  .akl-workflow-card p,
  .akl-guide-copy p,
  .akl-faq details p {
    margin: 10px 0 0;
    color: var(--akl-text-muted);
    font-size: 16px;
    line-height: 1.62;
  }

  /* ─── Surfaces tabs ──────────────────────────────────── */

  .akl-surface-tabs {
    padding-top: 96px;
  }

  .akl-surface-input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .akl-surface-input:focus {
    outline: none;
  }

  .akl-surface-tablist {
    width: max-content;
    max-width: 100%;
    margin-top: 36px;
    display: flex;
    gap: 0;
    overflow-x: auto;
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-surface-tab {
    position: relative;
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    padding: 0 22px;
    color: var(--akl-text-muted);
    cursor: pointer;
    font-family: var(--app-font-sans);
    font-size: 15px;
    font-weight: 500;
    line-height: 1;
    white-space: nowrap;
    transition: color 160ms ease;
  }

  .akl-surface-tab::after {
    content: "";
    position: absolute;
    right: 0;
    bottom: -1px;
    left: 0;
    height: 1.5px;
    background: var(--akl-accent);
    opacity: 0;
    transform: scaleX(0.42);
    transform-origin: center;
    transition:
      opacity 180ms ease,
      transform 180ms ease;
  }

  .akl-surface-tab:hover {
    color: var(--akl-accent);
  }

  /* Checked state — accent underline + bright text (not a pill fill). */
  .akl-surface-tabs:has(#surface-cover:checked) label[for="surface-cover"],
  .akl-surface-tabs:has(#surface-poster:checked) label[for="surface-poster"],
  .akl-surface-tabs:has(#surface-sidebar:checked) label[for="surface-sidebar"],
  .akl-surface-tabs:has(#surface-bottom-bar:checked) label[for="surface-bottom-bar"] {
    color: var(--akl-text);
  }

  .akl-surface-tabs:has(#surface-cover:checked) label[for="surface-cover"]::after,
  .akl-surface-tabs:has(#surface-poster:checked) label[for="surface-poster"]::after,
  .akl-surface-tabs:has(#surface-sidebar:checked) label[for="surface-sidebar"]::after,
  .akl-surface-tabs:has(#surface-bottom-bar:checked) label[for="surface-bottom-bar"]::after {
    opacity: 1;
    transform: scaleX(1);
  }

  /* Keyboard focus — relay from hidden radio to visible label via :has(). */
  .akl-surface-tabs:has(#surface-cover:focus-visible) label[for="surface-cover"],
  .akl-surface-tabs:has(#surface-poster:focus-visible) label[for="surface-poster"],
  .akl-surface-tabs:has(#surface-sidebar:focus-visible) label[for="surface-sidebar"],
  .akl-surface-tabs:has(#surface-bottom-bar:focus-visible) label[for="surface-bottom-bar"] {
    color: var(--akl-accent);
    outline: 0.5px solid var(--akl-accent);
    outline-offset: 4px;
  }

  .akl-surface-tabs:has(#surface-cover:focus-visible) label[for="surface-cover"]::after,
  .akl-surface-tabs:has(#surface-poster:focus-visible) label[for="surface-poster"]::after,
  .akl-surface-tabs:has(#surface-sidebar:focus-visible) label[for="surface-sidebar"]::after,
  .akl-surface-tabs:has(#surface-bottom-bar:focus-visible) label[for="surface-bottom-bar"]::after {
    opacity: 1;
    transform: scaleX(1);
  }

  .akl-surface-stage {
    margin-top: 44px;
  }

  .akl-surface-panel {
    display: none;
  }

  .akl-surface-tabs:has(#surface-cover:checked) .akl-surface-panel-cover,
  .akl-surface-tabs:has(#surface-poster:checked) .akl-surface-panel-poster,
  .akl-surface-tabs:has(#surface-sidebar:checked) .akl-surface-panel-sidebar,
  .akl-surface-tabs:has(#surface-bottom-bar:checked) .akl-surface-panel-bottom-bar {
    display: grid;
  }

  /* Layout per surface kind. */
  .akl-surface-kind-wide {
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.7fr);
    gap: 64px;
    align-items: center;
  }

  .akl-surface-kind-tall {
    grid-template-columns: minmax(200px, 300px) minmax(0, 1fr);
    gap: 64px;
    align-items: center;
  }

  .akl-surface-kind-strip {
    grid-template-columns: 1fr;
    gap: 32px;
    align-items: start;
  }

  .akl-surface-preview {
    overflow: hidden;
    border: 0.5px solid var(--akl-border);
    border-radius: 2px;
    background: #151413;
  }

  .akl-surface-preview img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }

  .akl-surface-kind-wide .akl-surface-preview img {
    aspect-ratio: 16 / 9;
  }

  .akl-surface-kind-tall .akl-surface-preview img {
    aspect-ratio: 470 / 760;
  }

  .akl-surface-kind-tall .akl-surface-preview {
    max-width: 340px;
  }

  .akl-surface-kind-strip .akl-surface-preview img {
    aspect-ratio: 1856 / 180;
  }

  .akl-surface-copy h3 {
    margin: 14px 0 0;
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-size: 30px;
    font-weight: 600;
    line-height: 1.1;
  }

  .akl-surface-copy p:not(.akl-eyebrow) {
    margin: 18px 0 0;
    color: #aaa49b;
    font-size: 18px;
    line-height: 1.6;
  }

  .akl-surface-copy ul {
    margin: 28px 0 0;
    padding: 0;
    list-style: none;
    border-top: 0.5px solid var(--akl-border-subtle);
  }

  .akl-surface-copy li {
    padding: 16px 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
    color: #d8d0c4;
    font-size: 16px;
    line-height: 1.35;
  }

  .akl-surface-copy li::before {
    content: "";
    display: inline-block;
    width: 0.36rem;
    height: 0.36rem;
    margin-right: 12px;
    border-radius: 999px;
    background: var(--akl-accent);
    vertical-align: 0.08em;
  }

  /* ─── Workflow ───────────────────────────────────────── */

  .akl-workflow-grid {
    margin-top: 40px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-top: 0.5px solid var(--akl-border-subtle);
    border-left: 0.5px solid var(--akl-border-subtle);
  }

  .akl-workflow-card {
    min-height: 240px;
    padding: 24px;
    border-right: 0.5px solid var(--akl-border-subtle);
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-workflow-card span {
    display: block;
    margin-bottom: 32px;
    color: var(--akl-accent);
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
  }

  /* ─── Agent section ──────────────────────────────────── */

  .akl-agent-lede {
    max-width: 640px;
    margin: 18px 0 0;
    color: var(--akl-text-muted);
    font-size: 18px;
    line-height: 1.6;
  }

  .akl-agent-flow {
    margin: 56px 0 0;
    padding: 0;
    list-style: none;
    border-top: 0.5px solid var(--akl-border-subtle);
  }

  .akl-agent-step {
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 32px;
    align-items: start;
    padding: 32px 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-agent-step-num {
    color: var(--akl-accent);
    font-family: var(--app-font-mono);
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0.12em;
    line-height: 1;
    padding-top: 6px;
  }

  .akl-agent-step-body h3 {
    margin: 0;
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-size: 24px;
    font-weight: 600;
    line-height: 1.2;
  }

  .akl-agent-step-body p {
    margin: 10px 0 0;
    color: var(--akl-text-muted);
    font-size: 16px;
    line-height: 1.62;
  }

  .akl-agent-safety {
    margin: 48px 0 0;
    padding: 0;
    list-style: none;
    border-top: 0.5px solid var(--akl-border-subtle);
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-agent-safety li {
    padding: 18px 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
    color: #d8d0c4;
    font-size: 15px;
    line-height: 1.5;
  }

  .akl-agent-safety li:last-child {
    border-bottom: 0;
  }

  .akl-agent-safety li::before {
    content: "";
    display: inline-block;
    width: 0.36rem;
    height: 0.36rem;
    margin-right: 12px;
    border-radius: 999px;
    background: var(--akl-accent);
    vertical-align: 0.08em;
  }

  .akl-agent-providers {
    margin: 28px 0 0;
    color: var(--akl-text-subtle);
    font-family: var(--app-font-mono);
    font-size: 13px;
    line-height: 1.6;
  }

  /* ─── Get started ────────────────────────────────────── */

  .akl-guide {
    display: grid;
    grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
    gap: 72px;
    align-items: start;
  }

  .akl-guide-steps ol {
    margin: 0;
    padding: 0;
    list-style: none;
    border-top: 0.5px solid var(--akl-border-subtle);
  }

  .akl-guide-steps li {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 24px;
    align-items: start;
    padding: 24px 0;
    border-bottom: 0.5px solid var(--akl-border-subtle);
  }

  .akl-guide-steps li > span {
    color: var(--akl-accent);
    font-family: var(--app-font-mono);
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.12em;
    line-height: 1;
    padding-top: 4px;
  }

  .akl-guide-steps h3 {
    margin: 0;
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
  }

  .akl-guide-steps p {
    margin: 8px 0 12px;
    color: var(--akl-text-muted);
    font-size: 15px;
    line-height: 1.55;
  }

  .akl-guide-link {
    display: inline-block;
    color: #aaa49b;
    font-family: var(--app-font-mono);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.1em;
    border-bottom: 0.5px solid var(--akl-border);
    padding-bottom: 1px;
    transition:
      color 180ms ease,
      border-color 180ms ease;
  }

  .akl-guide-link:hover,
  .akl-guide-link:focus-visible {
    color: var(--akl-accent);
    border-bottom-color: var(--akl-accent);
  }

  .akl-guide-routes {
    display: block;
    margin-top: 10px;
    padding: 12px 14px;
    border: 0.5px solid var(--akl-border);
    border-radius: 2px;
    background: var(--akl-surface);
    color: var(--akl-accent);
    font-family: var(--app-font-mono);
    font-size: 13px;
    line-height: 1.7;
    white-space: normal;
  }

  .akl-guide-meta {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-top: 28px;
    padding: 14px 16px;
    border: 0.5px solid var(--akl-border);
    border-radius: 2px;
    background: var(--akl-surface);
  }

  .akl-guide-meta code {
    color: var(--akl-accent);
    font-family: var(--app-font-mono);
    font-size: 13px;
    white-space: nowrap;
  }

  /* ─── FAQ ────────────────────────────────────────────── */

  .akl-faq {
    width: min(100%, 760px);
    margin: 0 auto;
    padding: 88px 32px 112px;
    text-align: center;
  }

  .akl-faq-mark {
    margin: 0;
    color: #d8d0c4;
    font-family: var(--app-font-serif);
    font-size: 56px;
    line-height: 1;
  }

  .akl-faq-list {
    margin-top: 52px;
    border-top: 0.5px solid var(--akl-border-subtle);
    text-align: left;
  }

  .akl-faq details {
    border-bottom: 0.5px solid var(--akl-border-subtle);
    padding: 22px 0;
  }

  .akl-faq summary {
    cursor: pointer;
    color: var(--akl-text);
    font-family: var(--app-font-serif);
    font-size: 20px;
    font-weight: 600;
    list-style: none;
  }

  .akl-faq summary::-webkit-details-marker {
    display: none;
  }

  .akl-faq summary::after {
    content: "+";
    float: right;
    color: #8b847a;
    font-family: var(--app-font-mono);
  }

  .akl-faq details[open] summary::after {
    content: "–";
  }

  /* ─── Footer ─────────────────────────────────────────── */

  .akl-site-footer {
    border-top: 0.5px solid var(--akl-border-subtle);
    color: var(--akl-text-subtle);
  }

  .akl-footer-row {
    min-height: 96px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .akl-footer-row p {
    margin: 0;
  }

  .akl-footer-row nav {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .akl-footer-row a:hover,
  .akl-footer-row a:focus-visible {
    color: var(--akl-accent);
  }

  /* ─── Responsive ─────────────────────────────────────── */

  @media (max-width: 980px) {
    .akl-site-nav {
      display: none;
    }

    .akl-main-site-link {
      display: none;
    }

    .akl-mobile-menu {
      display: block;
    }

    .akl-hero h1 {
      font-size: 52px;
    }

    .akl-split-section,
    .akl-guide {
      grid-template-columns: 1fr;
      gap: 36px;
    }

    .akl-agent-step {
      grid-template-columns: 64px minmax(0, 1fr);
      gap: 24px;
    }

    .akl-surface-kind-wide {
      grid-template-columns: 1fr;
      gap: 32px;
    }

    .akl-surface-kind-tall {
      grid-template-columns: minmax(180px, 240px) minmax(0, 1fr);
      gap: 32px;
    }

    .akl-workflow-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 720px) {
    .akl-page {
      --akl-fixed-header-height: 72px;
    }

    .akl-shell {
      padding-inline: 18px;
    }

    .akl-header-row {
      min-height: 72px;
      gap: 12px;
    }

    .akl-brand {
      font-size: 24px;
    }

    .akl-header-actions {
      gap: 12px;
    }

    .akl-hero {
      padding: 56px 18px 44px;
    }

    .akl-hero h1 {
      font-size: 34px;
      line-height: 1.08;
    }

    .akl-hero-lede {
      font-size: 17px;
    }

    .akl-showcase,
    .akl-section,
    .akl-faq {
      padding-inline: 18px;
    }

    .akl-surface-tablist {
      width: 100%;
    }

    .akl-surface-tab {
      min-height: 42px;
      padding: 0 16px;
      font-size: 14px;
    }

    .akl-surface-kind-tall {
      grid-template-columns: 1fr;
    }

    .akl-surface-kind-tall .akl-surface-preview {
      max-width: 240px;
    }

    .akl-section h2,
    .akl-guide-copy h2,
    .akl-faq h2 {
      font-size: 32px;
    }

    .akl-workflow-grid {
      grid-template-columns: 1fr;
    }

    .akl-agent-step {
      grid-template-columns: 56px minmax(0, 1fr);
      gap: 18px;
    }

    .akl-guide-steps li {
      grid-template-columns: 48px minmax(0, 1fr);
      gap: 16px;
    }

    .akl-guide-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }

    .akl-footer-row {
      align-items: flex-start;
      flex-direction: column;
      justify-content: center;
      padding-block: 24px;
    }
  }
`;

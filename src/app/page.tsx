const MAIN_SITE_URL = "https://aklman.com";
const GITHUB_URL = "https://github.com/aklmans/Vibe-Coding-Live";
const GITHUB_PROFILE_URL = "https://github.com/aklmans";
const X_URL = "https://x.com/aklman2018";
const RSS_URL = "https://aklman.com/rss.xml";

const appNav = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Surfaces", href: "#surfaces" },
  { label: "Workflow", href: "#workflow" },
  { label: "FAQ", href: "#faq" },
  { label: "Docs / Guide", href: "#guide" },
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
    copy: "Ask for a stream plan, review the proposed live-session.config.json, then apply it only after human review.",
  },
  {
    title: "OBS-ready browser sources",
    copy: "Keep overlay, sidebar and bottom bar as clean browser sources while OBS owns the actual screen capture below.",
  },
];

const workflowItems = [
  {
    title: "Prepare session",
    copy: "Start with demo data, write the session brief, or ask the agent for a safe proposal.",
  },
  {
    title: "Design broadcast surfaces",
    copy: "Preview overlay, cover, poster, sidebar, bottom bar and wallpaper exports in one visual language.",
  },
  {
    title: "Connect OBS",
    copy: "Use browser sources for the frame and freely place real captures underneath in OBS or Livehime.",
  },
  {
    title: "Export assets",
    copy: "Export cover / poster / sidebar / bottom bar / wallpapers, or run Export All for the whole package.",
  },
];

const visualCards = [
  {
    id: "cover",
    title: "Cover",
    src: "/product/vibe-coding-cover.png",
    alt: "Vibe Coding Live cover export",
    summary: "Open the stream with an editorial title card that already matches the overlay language.",
    points: ["Serif headline and host profile", "Warm dark / light theme aware", "Export-ready social preview"],
  },
  {
    id: "poster",
    title: "Poster",
    src: "/product/vibe-coding-poster.png",
    alt: "Vibe Coding Live poster export",
    summary: "Generate a compact promotional poster from the same session configuration.",
    points: ["Session topic and agenda", "Reusable host identity", "Clean social sharing asset"],
  },
  {
    id: "sidebar",
    title: "Sidebar",
    src: "/product/vibe-coding-sidebar.png",
    alt: "Vibe Coding Live sidebar export",
    summary: "Keep the live sidebar readable as a separate OBS browser source.",
    points: ["Current focus and section progress", "Quiet social metadata", "Transparent source friendly"],
  },
  {
    id: "bottom-bar",
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

export default function LandingPage() {
  return (
    <main data-testid="landing-page" className="akl-page">
      <style>{landingCss}</style>

      <header data-testid="landing-site-header" className="akl-site-header">
        <div className="akl-shell akl-header-row">
          <a className="akl-brand" href={MAIN_SITE_URL} aria-label="Return to Aklman main site">
            Aklman
          </a>
          <nav className="akl-site-nav" aria-label="Vibe Coding Live navigation">
            {appNav.map((item) => (
              <a key={item.label} href={item.href}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="akl-header-actions">
            <a href="/demo" data-testid="landing-demo-link" className="akl-button akl-button-light">
              Try Demo
            </a>
          </div>
        </div>
      </header>

      <section id="product" className="akl-hero">
        <p className="akl-eyebrow">Editorial broadcast workbench</p>
        <h1>Vibe Coding Live</h1>
        <p className="akl-hero-lede">
          Editorial live graphics for coding streams. Prepare sessions, design broadcast
          surfaces, connect OBS browser sources, and export the full visual kit.
        </p>
        <div className="akl-hero-actions">
          <a href="/demo" className="akl-button akl-button-light">
            Try Demo
          </a>
          <a href={GITHUB_URL} className="akl-button akl-button-dark">
            View GitHub
          </a>
        </div>
        <p className="akl-hero-note">
          Demo mode is local-only. Private studio mode stays available at <a href="/studio">/studio</a>.
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
        {visualCards.map((item, index) => (
          <input
            key={item.id}
            className="akl-surface-input"
            type="radio"
            id={`surface-${item.id}`}
            name="akl-surface"
            defaultChecked={index === 0}
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
            <article key={item.id} className={`akl-surface-panel akl-surface-panel-${item.id}`}>
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

      <section id="guide" className="akl-section akl-guide">
        <div className="akl-guide-copy">
          <p className="akl-eyebrow">Docs / Guide</p>
          <h2>Public demo first. Private studio when you go live.</h2>
          <p>
            Start with the safe demo, then move to the private studio when you want real
            AI provider configuration, database persistence and OBS automation.
          </p>
        </div>
        <div className="akl-command">
          <a href="/demo" className="akl-command-button">
            Open demo
          </a>
          <code>pnpm dev</code>
          <a href="/studio">Open studio</a>
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
    </main>
  );
}

const landingCss = `
  .akl-page {
    --akl-fixed-header-height: 91px;
    min-height: 100vh;
    padding-top: var(--akl-fixed-header-height);
    background: #111111;
    color: #f4efe6;
    font-family: var(--app-font-sans);
  }

  .akl-page a {
    color: inherit;
    text-decoration: none;
  }

  .akl-shell {
    width: min(100%, 1180px);
    margin: 0 auto;
    padding-inline: 32px;
  }

  .akl-site-header {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 50;
    background: color-mix(in srgb, #111111 92%, transparent);
    backdrop-filter: saturate(140%) blur(10px);
    -webkit-backdrop-filter: saturate(140%) blur(10px);
    border-bottom: 0.5px solid #2f2d29;
  }

  .akl-header-row {
    min-height: 86px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
  }

  .akl-brand {
    color: #f4efe6;
    font-family: var(--app-font-serif);
    font-size: 32px;
    font-weight: 500;
    line-height: 1;
  }

  .akl-brand:hover,
  .akl-brand:focus-visible {
    color: #e8835b;
  }

  .akl-site-nav,
  .akl-header-actions,
  .akl-footer-row nav {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }

  .akl-site-nav {
    gap: 26px;
    margin-left: auto;
  }

  .akl-header-actions {
    gap: 12px;
  }

  .akl-site-nav a,
  .akl-header-actions > a:not(.akl-button) {
    position: relative;
    color: #9b958d;
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
    background: #e8835b;
    opacity: 0;
    transform: scaleX(0.42);
    transform-origin: center;
    transition:
      opacity 180ms ease,
      transform 180ms ease;
  }

  .akl-site-nav a:hover,
  .akl-header-actions > a:not(.akl-button):hover,
  .akl-site-nav a:focus-visible,
  .akl-header-actions > a:not(.akl-button):focus-visible {
    color: #e8835b;
  }

  .akl-site-nav a:hover::after,
  .akl-site-nav a:focus-visible::after {
    opacity: 0.45;
    transform: scaleX(1);
  }

  .akl-site-nav a:focus-visible,
  .akl-header-actions > a:not(.akl-button):focus-visible,
  .akl-brand:focus-visible,
  .akl-button:focus-visible,
  .akl-command a:focus-visible,
  .akl-surface-tab:focus-visible {
    outline: 0.5px solid #e8835b;
    outline-offset: 4px;
  }

  .akl-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 42px;
    border-radius: 8px;
    padding: 0 18px;
    font-family: var(--app-font-sans);
    font-size: 15px;
    font-weight: 700;
    line-height: 1;
  }

  .akl-page .akl-button-light {
    background: #f4efe6;
    color: #161513;
  }

  .akl-page .akl-button-dark {
    border: 1px solid #3a3732;
    background: #282622;
    color: #f4efe6;
  }

  .akl-hero {
    width: min(100%, 1080px);
    margin: 0 auto;
    padding: 96px 32px 74px;
    text-align: center;
  }

  .akl-eyebrow {
    margin: 0;
    color: #e8835b;
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
    color: #f4efe6;
    font-family: var(--app-font-serif);
    font-weight: 500;
    letter-spacing: 0;
  }

  .akl-hero h1 {
    margin-top: 16px;
    font-size: 88px;
    line-height: 0.95;
  }

  .akl-hero-lede {
    max-width: 720px;
    margin: 28px auto 0;
    color: #9b958d;
    font-size: 24px;
    line-height: 1.42;
  }

  .akl-hero-actions {
    margin-top: 34px;
    display: flex;
    justify-content: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .akl-hero-note {
    margin: 18px 0 0;
    color: #7e776e;
    font-size: 15px;
  }

  .akl-hero-note a {
    border-bottom: 1px solid #6b6258;
    color: #aaa49b;
  }

  .akl-showcase {
    width: min(100%, 1420px);
    margin: 0 auto;
    padding: 22px 32px 126px;
  }

  .akl-product-frame {
    overflow: hidden;
    border: 1px solid #302d28;
    border-radius: 24px;
    background: #171615;
    box-shadow: 0 44px 90px rgba(0, 0, 0, 0.42);
  }

  .akl-window-top {
    min-height: 38px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 18px;
    border-bottom: 1px solid #302d28;
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

  .akl-section {
    width: min(100%, 1180px);
    margin: 0 auto;
    padding: 106px 32px;
  }

  .akl-split-section {
    display: grid;
    grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
    gap: 76px;
    align-items: start;
  }

  .akl-section h2,
  .akl-guide-copy h2,
  .akl-faq h2 {
    margin-top: 16px;
    font-size: 54px;
    line-height: 1.03;
  }

  .akl-feature-list {
    border-top: 1px solid #2f2d29;
  }

  .akl-feature-list article {
    padding: 28px 0;
    border-bottom: 1px solid #2f2d29;
  }

  .akl-feature-list h3,
  .akl-visual-card h3,
  .akl-workflow-card h3 {
    margin: 0;
    color: #f4efe6;
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
    color: #9b958d;
    font-size: 16px;
    line-height: 1.62;
  }

  .akl-surface-tabs {
    padding-top: 110px;
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

  .akl-surface-tablist {
    width: max-content;
    max-width: 100%;
    margin-top: 38px;
    display: flex;
    gap: 0;
    overflow-x: auto;
    border: 1px solid #302d28;
    border-radius: 18px;
    background: #292723;
    padding: 7px;
  }

  .akl-surface-tab {
    display: inline-flex;
    min-height: 48px;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    padding: 0 22px;
    color: #c7bfb4;
    cursor: pointer;
    font-family: var(--app-font-sans);
    font-size: 16px;
    font-weight: 700;
    line-height: 1;
    white-space: nowrap;
    transition:
      background 160ms ease,
      color 160ms ease;
  }

  .akl-surface-tabs:has(#surface-cover:checked) label[for="surface-cover"],
  .akl-surface-tabs:has(#surface-poster:checked) label[for="surface-poster"],
  .akl-surface-tabs:has(#surface-sidebar:checked) label[for="surface-sidebar"],
  .akl-surface-tabs:has(#surface-bottom-bar:checked) label[for="surface-bottom-bar"] {
    background: #f4efe6;
    color: #161513;
  }

  .akl-surface-stage {
    margin-top: 34px;
  }

  .akl-surface-panel {
    display: none;
    grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.7fr);
    gap: 66px;
    align-items: center;
  }

  .akl-surface-tabs:has(#surface-cover:checked) .akl-surface-panel-cover,
  .akl-surface-tabs:has(#surface-poster:checked) .akl-surface-panel-poster,
  .akl-surface-tabs:has(#surface-sidebar:checked) .akl-surface-panel-sidebar,
  .akl-surface-tabs:has(#surface-bottom-bar:checked) .akl-surface-panel-bottom-bar {
    display: grid;
  }

  .akl-surface-preview {
    overflow: hidden;
    border: 1px solid #302d28;
    border-radius: 22px;
    background: #151413;
    box-shadow: 0 34px 76px rgba(0, 0, 0, 0.32);
  }

  .akl-surface-preview img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
  }

  .akl-surface-copy h3 {
    margin: 14px 0 0;
    color: #f4efe6;
    font-family: var(--app-font-serif);
    font-size: 30px;
    font-weight: 600;
    line-height: 1.1;
  }

  .akl-surface-copy p:not(.akl-eyebrow) {
    margin: 18px 0 0;
    color: #aaa49b;
    font-size: 19px;
    line-height: 1.6;
  }

  .akl-surface-copy ul {
    margin: 30px 0 0;
    padding: 0;
    list-style: none;
    border-top: 1px solid #302d28;
  }

  .akl-surface-copy li {
    padding: 17px 0;
    border-bottom: 1px solid #302d28;
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
    background: #e8835b;
    vertical-align: 0.08em;
  }

  .akl-workflow-grid {
    margin-top: 44px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    border-top: 1px solid #302d28;
    border-left: 1px solid #302d28;
  }

  .akl-workflow-card {
    min-height: 240px;
    padding: 24px;
    border-right: 1px solid #302d28;
    border-bottom: 1px solid #302d28;
  }

  .akl-workflow-card span {
    display: block;
    margin-bottom: 34px;
    color: #e8835b;
    font-family: var(--app-font-mono);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.12em;
  }

  .akl-guide {
    display: grid;
    grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.1fr);
    gap: 76px;
    align-items: center;
  }

  .akl-command {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 62px;
    padding: 9px;
    border: 1px solid #302d28;
    border-radius: 12px;
    background: #22201d;
    color: #aaa49b;
    font-family: var(--app-font-mono);
    font-size: 14px;
    overflow: hidden;
  }

  .akl-command-button {
    flex: 0 0 auto;
    padding: 12px 18px;
    border-radius: 8px;
    background: #f4efe6;
    color: #161513;
    font-family: var(--app-font-sans);
    font-weight: 700;
  }

  .akl-command code {
    color: #e8835b;
    white-space: nowrap;
  }

  .akl-command a:last-child {
    margin-left: auto;
    color: #f4efe6;
    white-space: nowrap;
  }

  .akl-faq {
    width: min(100%, 760px);
    margin: 0 auto;
    padding: 98px 32px 128px;
    text-align: center;
  }

  .akl-faq-mark {
    margin: 0;
    color: #d8d0c4;
    font-family: var(--app-font-serif);
    font-size: 64px;
    line-height: 1;
  }

  .akl-faq-list {
    margin-top: 58px;
    border-top: 1px solid #302d28;
    text-align: left;
  }

  .akl-faq details {
    border-bottom: 1px solid #302d28;
    padding: 22px 0;
  }

  .akl-faq summary {
    cursor: pointer;
    color: #f4efe6;
    font-family: var(--app-font-serif);
    font-size: 21px;
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
    content: "-";
  }

  .akl-site-footer {
    border-top: 1px solid #302d28;
    color: #7e776e;
  }

  .akl-footer-row {
    min-height: 104px;
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
    gap: 10px;
  }

  .akl-footer-row a:hover,
  .akl-footer-row a:focus-visible {
    color: #e8835b;
  }

  @media (max-width: 980px) {
    .akl-site-nav {
      display: none;
    }

    .akl-hero h1 {
      font-size: 62px;
    }

    .akl-split-section,
    .akl-guide,
    .akl-surface-panel {
      grid-template-columns: 1fr;
      gap: 38px;
    }

    .akl-workflow-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 720px) {
    .akl-page {
      --akl-fixed-header-height: 73px;
    }

    .akl-shell {
      padding-inline: 18px;
    }

    .akl-header-row {
      min-height: 72px;
      gap: 16px;
    }

    .akl-brand {
      font-size: 24px;
    }

    .akl-site-nav {
      display: none;
    }

    .akl-hero {
      padding: 68px 20px 48px;
    }

    .akl-hero h1 {
      font-size: 46px;
    }

    .akl-hero-lede {
      font-size: 18px;
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

    .akl-surface-preview img {
      aspect-ratio: 4 / 3;
    }

    .akl-section h2,
    .akl-guide-copy h2,
    .akl-faq h2 {
      font-size: 36px;
    }

    .akl-command {
      align-items: flex-start;
      flex-direction: column;
    }

    .akl-command a:last-child {
      margin-left: 0;
    }

    .akl-footer-row {
      align-items: flex-start;
      flex-direction: column;
      justify-content: center;
      padding-block: 26px;
    }
  }
`;

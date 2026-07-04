# MGGX Games — Official Studio Site

[![Live Site](https://img.shields.io/badge/live-mggx--games.xyz-FFA500)](https://mggx-games.xyz)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Three.js](https://img.shields.io/badge/three.js-r160-black)](vendor/three/)
[![No Build Step](https://img.shields.io/badge/build%20step-none-blue)](#tech-stack)
[![Deployed on Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black)](https://vercel.com)

The official website of **MGGX Games**, an independent one-developer game studio. Beyond being a product showcase, this repository is a case study in how far you can take a **zero-build-step static site**: a hand-rolled procedural 3D engine on top of Three.js, a serverless admin panel that uses **GitHub itself as its database**, and a strict Content Security Policy — all in vanilla HTML/CSS/JS.

**Live at [mggx-games.xyz](https://mggx-games.xyz)**

---

## Highlights

### 🎮 Procedural 3D engine (`js/3d/`)
Every 3D model on the site — the animated gas pump, the low-poly cars, the floating product icons — is **built from code, not loaded from `.glb` assets**. A ~200-line shared runtime handles the rest:

- **`scene-runtime.js`** — renderer lifecycle, `devicePixelRatio` capping, pause-when-offscreen (`IntersectionObserver`) and pause-in-background (Page Visibility API), `prefers-reduced-motion` support, unified mouse/touch pointer tracking, and a `responsiveScale` factor that reframes every scene for any aspect ratio — the same composition reads correctly on an ultrawide monitor and a phone in portrait.
- **`geo-builders.js`** — parametric model builders composed from Three.js primitives (boxes, cylinders, Catmull-Rom tube hoses, extruded 2D shapes). No binary assets to version, no DCC tooling required, fully diffable in code review.
- **`hero-scene.js`** — a reusable "particle field + floating icon" composition with spring-physics pointer repulsion and click/tap-to-pulse interaction, shared by four pages with per-product identity.

The flagship scene ([`gas-station/js/three-scene.js`](gas-station/js/three-scene.js)) includes a real interaction: click or tap the pump nozzle and it squeezes, spawning a burst of money particles — mouse and touch share the exact same raycasting path.

### 🔐 Serverless admin panel, GitHub as the database
A password-gated admin panel (the floating `A` on the home page) manages every product's release catalog:

- **No database.** The catalog is [`data/versions.json`](data/versions.json), committed to this repo. Vercel serverless functions ([`api/`](api/)) read and write it through the GitHub Contents API — every release published through the panel is a commit, with full history and rollback for free.
- **HMAC-signed session tokens** with expiry, constant-time password comparison, per-IP rate limiting, same-origin enforcement, and strict input allowlists before anything touches a GitHub API path.
- **AI-assisted release notes**: a serverless proxy generates patch-note copy from a short summary of changes, keeping API keys server-side.

### 🛡️ Security-first static hosting
- Strict CSP (`script-src 'self'` + exact ad origins, **no `unsafe-inline` scripts anywhere** — all page logic lives in external files), HSTS, COOP, X-Frame-Options, restrictive Permissions-Policy ([`vercel.json`](vercel.json)).
- Three.js is **vendored locally** ([`vendor/three/`](vendor/three/)) instead of hot-linked from a CDN — no third-party script origin, no supply-chain surprise.
- Zero inline event handlers: all interactions go through delegated `data-page-act` dispatch with keyboard accessibility.

### 📱 Responsive and accessible by construction
Fluid `clamp()` typography, mobile-first vertical layout restructuring for the 3D hero scenes, full touch parity (tap, drag-vs-tap disambiguation, tilt-by-finger on project cards), `prefers-reduced-motion` freezing every scene to a single frame, and focus-visible keyboard navigation.

---

## Products

| Project | Path | Platforms |
|---|---|---|
| Gas Station Simulator 3D | [`gas-station/`](gas-station/) | PC |
| WtsApp PC | [`wtsapp/`](wtsapp/) | PC & Android |
| Craft Book PC | [`craft-book/`](craft-book/) | PC |
| MGGX Autoclicker | [`autoclicker/`](autoclicker/) | PC |

---

## Tech stack

- **Frontend:** vanilla HTML/CSS/JS (ES modules), no framework, no bundler, no build step. What you see in the repo is byte-for-byte what ships.
- **3D:** [Three.js r160](https://threejs.org) (vendored, MIT).
- **Backend:** Vercel serverless functions (Node.js), GitHub Contents API as the persistence layer.
- **Testing:** [Playwright](https://playwright.dev)-driven verification suites ([`tests/`](tests/)) that click through real navigation links and exercise the full download flow on desktop and mobile viewports — including running under the exact production CSP header to catch what a dev server never shows.

## Repository layout

```
├── index.html            Studio home (3D hero + project catalog + admin panel)
├── gas-station/          Product page + its bespoke interactive 3D scene
├── wtsapp/  craft-book/  autoclicker/      Product pages (shared page pattern)
├── terminos/             Terms & conditions
├── css/site.css          Shared visual layer: tokens, motion, admin UI
├── js/
│   ├── 3d/               Procedural 3D engine (runtime, geometry builders, hero scene)
│   ├── motion.js         Scroll reveals, click delegation, card tilt, a11y helpers
│   ├── admin.js          Admin panel wizard
│   ├── version-store.js  Client-side catalog store (fetch + cache + mutations)
│   └── render-versions.js  Download lists & patch-note rendering
├── api/                  Serverless functions (login, versions CRUD, AI generation)
├── data/versions.json    Release catalog — the single source of truth
├── vendor/three/         Vendored Three.js + license
├── tests/                Playwright verification suites
└── vercel.json           Security headers (CSP, HSTS, …) and routing config
```

A full architecture document (in Spanish) lives in [`documentacion_arquitectura.md`](documentacion_arquitectura.md) — folder-by-folder rationale, the security model, and the reasoning behind procedural 3D over `.glb` assets.

## Running locally

No dependencies, no build. Any static file server works:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

For the admin panel / serverless functions, use the Vercel CLI with the environment variables documented in [`documentacion_arquitectura.md`](documentacion_arquitectura.md):

```bash
npm i -g vercel
vercel dev
```

To run the test suites (requires Playwright):

```bash
npm i -D playwright
node tests/verify-links.mjs
```

## Contributing

Issues and pull requests are welcome — bug reports, accessibility improvements, and new procedural geometry builders especially. Please:

1. Keep the zero-build philosophy: no bundlers, no transpilation, vanilla ES modules only.
2. Match the existing code style (see any file in `js/3d/` for the commenting conventions).
3. Verify visually, not just by diff — most of this codebase is runtime/visual behavior that linters can't see. The Playwright suites in `tests/` are the reference for how changes get verified here.

## License

[MIT](LICENSE) © MGGX Games (Maximo). The vendored Three.js library retains its own [MIT license](vendor/three/LICENSE).

---
inclusion: always
---

# UROMM — Universal ROM Management

## What This Project Is

A GitHub Pages-hosted Pokemon ROM hack patching platform. Users browse a library of ROM hacks, select patches, upload their own legally-obtained base ROMs, and download patched ROMs — all client-side in the browser. Community members can submit new hacks via a web form that auto-creates GitHub PRs.

## Architecture

- Fully client-side. No backend server. GitHub Pages serves `docs/` as root.
- Vanilla JavaScript ES6 modules, HTML5, CSS3. No framework.
- ROM patching via RomPatcher.js (third-party, supports IPS/BPS/UPS/XDelta).
- Search via Fuse.js. Icons via Lucide. Markdown via Marked.js.
- GitHub API integration for community submissions (fork → branch → PR).
- `manifest.json` is auto-generated from `metadata/` by `scripts/generate-manifest.js`.

## Key Directories

```css
docs/                    # GitHub Pages root (the live site)
├── index.html           # Landing page
├── patcher/index.html   # ROM patcher
├── library/index.html   # Searchable hack library
├── submit/index.html    # Community submission form
├── manifest.json        # Auto-generated patch catalog
├── assets/css/          # Modular CSS (design-system → components → layout → themes)
├── assets/js/
│   ├── modules/         # App logic (library-app, patcher-app, submit-form)
│   ├── services/        # GitHub API, auth, submission handler
│   ├── utils/           # Shared utilities (manifest-loader, config-loader, state-manager)
│   └── config/          # JS config (form-layout, metadata-fields, performance)
└── patcher/rom-patcher-js/  # Third-party patching engine

config/                  # Data definitions
├── systems.json         # Gaming systems (GB, GBC, GBA, NDS, 3DS, GC, WII, NSW)
└── base-roms.json       # 40+ Pokemon games with CRC variants and colors

patches/                 # ROM patch files organized by base ROM subdirectory
metadata/                # Patch metadata JSON files (one per hack)
scripts/                 # Automation (manifest generation, validation, renaming)
tests/                   # Playwright E2E tests (smoke, core, integration, mobile, visual)
.github/workflows/       # CI: manifest updates, submission validation, naming validation
```

## Data Flow

1. `scripts/generate-manifest.js` scans `patches/` + `metadata/` → produces `docs/manifest.json`
2. GitHub Actions auto-run this on PR merge when patches/metadata change
3. Frontend loads `manifest.json` → populates library grid and patcher search
4. User selects patch → uploads ROM → RomPatcher.js applies patch client-side → download

## Inspiration

This project draws inspiration from [Hackdex](https://www.hackdex.app/) — a similar community hub for discovering and sharing Pokemon ROM hack patches with in-browser patching. UROMM takes a static-site approach (GitHub Pages + vanilla JS) rather than Hackdex's Next.js/Supabase stack.

---
inclusion: always
---

# Architectural Decisions

Track significant decisions here. Update when new decisions are made.

## ADR-001: Static Site on GitHub Pages (Established)

- No backend server. All processing client-side.
- GitHub Pages serves `docs/` directory.
- Rationale: Zero hosting cost, no server maintenance, ROM files never leave user's device.

## ADR-002: Vanilla JS Over Frameworks (Established)

- No React, Vue, Next.js, or similar.
- ES6 modules loaded natively by the browser.
- Rationale: Simplicity, no build step, fast load times, easy to contribute.

## ADR-003: RomPatcher.js for Patching (Established)

- Third-party library in `docs/patcher/rom-patcher-js/`.
- Supports IPS, BPS, UPS, XDelta formats.
- Client-side only — ROMs never uploaded.

## ADR-004: GitHub API for Community Submissions (Established)

- Users authenticate with GitHub PAT (stored in sessionStorage).
- Submission form auto-forks repo, creates branch, uploads files, opens PR.
- GitHub Actions validate submissions on PR.

## ADR-005: Manifest-Driven Data (Established)

- `scripts/generate-manifest.js` produces `docs/manifest.json` from `patches/` + `metadata/`.
- GitHub Actions auto-regenerate on merge.
- Frontend reads manifest at runtime — single source of truth for all patch data.

## ADR-006: Modular CSS with Design Tokens (Established)

- CSS custom properties in `variables.css` for all colors, spacing, timing, z-index.
- Component-based CSS files. No CSS-in-JS, no preprocessors.
- Badge system with data attributes for dynamic styling.

## ADR-007: Hackdex Inspiration (Active)

- Drawing from [Hackdex](https://www.hackdex.app/) for UX patterns and community features.
- Maintaining static-site approach rather than adopting Hackdex's Next.js/Supabase stack.
- Focus areas: discovery UX, submission flow, patch presentation.

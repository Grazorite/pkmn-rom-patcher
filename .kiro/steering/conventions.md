---
inclusion: always
---

# Code Conventions

## JavaScript

- Vanilla ES6 modules (`export class`, `export function`, `import { } from`)
- camelCase for variables, functions, methods
- PascalCase for classes (`ROMLibraryApp`, `ManifestLoader`, `GitHubAPI`)
- No framework. No TypeScript. No bundler. Browser-native ES modules.
- Use `async/await` for async operations, `try/catch` with fallbacks
- Console warnings for non-critical failures, throw for critical ones
- State persistence via `sessionStorage` (never `localStorage` for auth tokens)
- CDN libraries loaded at runtime: Fuse.js, Lucide, Marked.js

## CSS

- kebab-case for class names and file names
- CSS custom properties defined in `docs/assets/css/base/variables.css` — never hardcode colors, spacing, or timing
- Modular file structure: `base/` → `design-system/` → `components/` → `layout/` → `themes/`
- Animation system: use `--anim-duration-*` and `--anim-delay-*` variables
- Page load animations: `fadeInUp` with staggered delays (0.2s intervals)
- Badge system: `badge-rom`, `badge-system`, `badge-difficulty` with `data-*` attributes
- Respect `prefers-reduced-motion`
- Z-index hierarchy defined in variables.css (background → content → sidebar → panels → modals)

## HTML

- Each page is a standalone HTML file in `docs/`
- Scripts loaded at bottom of `<body>`, CSS in `<head>`
- FOUC prevention: inline critical background color in `<style>` tag
- Lucide icons via `<i data-lucide="icon-name">` initialized by JS

## File Naming

- Patch files: `{TITLE}_{SYSTEM}_{BASEROM-CRC}_{VERSION}{VARIANT}_{YEAR}.{ext}`
  - See `docs/NAMING_CONVENTION.md` for full spec
- Metadata JSON: one file per hack in `metadata/{baseRom}/` directory
- CSS components: `docs/assets/css/components/{feature-name}.css`
- JS modules: `docs/assets/js/modules/{feature-name}.js`

## Config Files

- `config/systems.json`: gaming system definitions (name, abbreviation, colors)
- `config/base-roms.json`: ROM definitions (abbreviation, system, CRC variants, colors)
- `docs/manifest.json`: auto-generated — never edit manually

## Path Resolution

- ConfigLoader uses environment-aware paths: `/config/` for localhost, `../config/` for GitHub Pages
- Never use environment detection for file paths in other modules — use relative paths from `docs/`
- Both local dev (`npm run serve`) and GitHub Pages serve `docs/` as root

## Error Handling

- `docs/assets/js/utils/error-boundary.js` for centralized error handling
- Try-catch with fallbacks for non-critical operations
- Console warnings for degraded functionality
- User-facing error messages for critical failures

## Testing

- Playwright E2E tests in `tests/` directory
- Sociable tests — mock only external boundaries (network, GitHub API)
- Fast smoke suite (`npm run test:smoke`) for critical paths
- Test across Chromium, Firefox, WebKit
- Test fixtures in `tests/fixtures/`
- Run `npm test` before committing changes to frontend code

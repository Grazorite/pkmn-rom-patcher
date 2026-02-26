---
inclusion: fileMatch
fileMatchPattern: "docs/assets/js/**/*.js"
---

# JavaScript Patterns

When editing JS files in this project:

- ES6 modules with `export class` / `export function` — no CommonJS in frontend code
- App modules in `docs/assets/js/modules/` follow a class pattern: constructor → init() → setup methods
- Utilities in `docs/assets/js/utils/` are standalone classes or functions
- Services in `docs/assets/js/services/` handle external integrations (GitHub API)
- Use `ConfigLoader.getConfigPath()` for config file paths — handles localhost vs GitHub Pages
- Use `ManifestLoader` for loading manifest.json — has retry logic and 5-min cache
- Use `StateManager.loadState()`/`saveState()` for sessionStorage persistence
- Search uses Fuse.js — check `typeof Fuse !== 'undefined'` before initializing
- Icons: call `lucide.createIcons()` after DOM updates that add `data-lucide` attributes
- Error handling: try-catch with console.warn for non-critical, throw for critical
- No `document.write()`, no inline event handlers, no global variables

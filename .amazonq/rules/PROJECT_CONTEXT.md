# PROJECT_CONTEXT.md — Universal ROM Management (UROMM)

## Project Overview

- **Name**: Universal ROM Management (UROMM)
- **Purpose**: GitHub Pages-hosted ROM patching platform with automated patch management, community submissions, and client-side ROM patching
- **Tech Stack**: Vanilla JavaScript ES6 modules, HTML5, CSS3, GitHub Pages, Playwright testing, Python utilities
- **Entrypoints**:
  - `docs/index.html:1` (landing page)
  - `docs/library/index.html:1` (ROM library browser)
  - `docs/patcher/index.html:1` (ROM patcher interface)
  - `docs/submit/index.html:1` (community submission form)

## Architecture at a Glance

- **Modules & Responsibilities**:
  - `docs/assets/js/modules/` - Core app logic (library-app.js, patcher-app.js, submit-form.js)
  - `docs/assets/js/utils/` - Shared utilities (config-loader.js, manifest-loader.js, state-manager.js)
  - `docs/assets/js/services/` - External integrations (github-api.js, submission-handler.js)
  - `docs/patcher/rom-patcher-js/` - Third-party ROM patching engine
  - `config/` - Base ROM and system definitions (base-roms.json, systems.json)
  - `patches/` - ROM patch files organized by base ROM
  - `metadata/` - Patch metadata in JSON format
- **Data Flow**: Static files → GitHub Pages → Client-side JS modules → ROM Patcher engine → Patched ROM download
- **Error Handling**: Try-catch with fallbacks in `docs/assets/js/utils/error-boundary.js:1`, console warnings for non-critical failures

## Conventions & Constraints

- **Coding style**: No formal linters detected; uses ES6 modules, consistent naming (camelCase JS, kebab-case CSS)
- **Folder layout**: `docs/` (GitHub Pages root), modular JS in `assets/js/`, CSS components in `assets/css/`
- **Security**: No secrets in code; GitHub PAT via sessionStorage; client-side only (no server)
- **Dependencies**: Pinned versions in `package.json:20-24` (Playwright ^1.40.0, http-server ^14.1.1)

## Commands (Non-Interactive Friendly)

```bash
# Dev server (serves docs/ as root)
npm run serve

# Tests (comprehensive Playwright suite)
npm test                    # All tests across 3 browsers
npm run test:smoke         # Fast critical path tests
npm run test:core          # Core functionality tests
npm run test:ui            # UI interaction tests

# Build/Deploy
# Auto-deployed via GitHub Actions on push to main
# Manifest auto-generated via .github/workflows/update_manifest.yml
```

## Testing Strategy

- **Smoke Tests**: `tests/smoke/critical-paths.spec.js:1` - Fast validation of core user journeys
- **Integration Tests**: `tests/integration/patcher.spec.js:1` - End-to-end ROM patching workflow
- **Mobile Tests**: `tests/mobile/` - Responsive design and mobile-specific interactions
- **Test Approach**: Sociable tests with real DOM interactions, minimal mocking
- **Browsers**: Chromium, Firefox, WebKit via `playwright.config.js:3`

## Configuration & Security

- **Environment Variables**: None detected (client-side only)
- **Config Files**:
  - `config/base-roms.json:1` - ROM definitions with CRC variants
  - `config/systems.json:1` - Gaming system specifications
  - `docs/manifest.json:1` - Auto-generated patch catalog
- **Security Model**: Client-side patching only, no server uploads, GitHub PAT for submissions
- **Secrets**: GitHub Personal Access Token stored in sessionStorage (user-provided)

## GitHub Integration

- **Workflows**:
  - `.github/workflows/update_manifest.yml:1` - Auto-updates manifest on patch additions
  - `.github/workflows/validate-submission.yml:1` - Validates community PR submissions
- **Community Submissions**: Web form → GitHub API → Automated PR creation
- **Deployment**: GitHub Pages auto-deploy from `docs/` directory

## CRITICAL PATH RESOLUTION RULE

**NEVER use environment detection for file paths.** Both local development (`npm run serve`) and GitHub Pages serve the `docs/` directory as root. All relative paths (e.g., `../config/base-roms.json`, `./rom-patcher-js/worker.js`) work identically in both environments. This prevents 404 errors and ensures consistent behavior across all deployment targets.

## Key Insights for AI Operations

- **Path Resolution**: Local server and GitHub Pages have identical directory structure - no environment-specific logic needed
- **Client-Side Architecture**: All processing happens in browser - no backend API calls for core functionality
- **Modular Design**: ES6 modules with clear separation of concerns - reuse existing utilities before creating new ones
- **Testing Philosophy**: Comprehensive Playwright suite covers real user interactions across multiple browsers
- **Community-Driven**: GitHub-based submission workflow enables community contributions without direct repo access
- **Documentation Sync**: ALWAYS update supporting markdown files (README.md, docs/*.md) when implementations change to prevent outdated information

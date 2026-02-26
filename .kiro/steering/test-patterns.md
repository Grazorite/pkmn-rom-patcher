---
inclusion: fileMatch
fileMatchPattern: "tests/**/*.spec.js"
---

# Test Patterns

When writing or editing Playwright tests:

- Tests are in `tests/` organized by type: `smoke/`, `core/`, `integration/`, `mobile/`, `visual/`
- Use fixtures from `tests/fixtures/base.js` (desktop) and `tests/fixtures/mobile.js` (mobile viewport)
- Test ROM file available at `tests/fixtures/test-rom.gba`
- Sociable tests: mock only external boundaries (network requests, GitHub API), not internal modules
- Each test file uses `test.describe()` blocks grouped by feature
- Use `page.goto()` with relative paths: `/`, `/library/`, `/patcher/`, `/submit/`
- Wait for elements with `page.waitForSelector()` or `expect(locator).toBeVisible()`
- Smoke tests (`tests/smoke/`) should complete in under 30 seconds total
- Run `npm run test:smoke` for quick validation, `npm test` for full suite
- Tests run across Chromium, Firefox, WebKit — avoid browser-specific APIs

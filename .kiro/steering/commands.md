---
inclusion: always
---

# Commands & Workflows

## Development

```bash
npm run serve              # Local dev server at http://localhost:3000 (serves docs/)
```

## Testing

```bash
npm test                   # Full Playwright suite (all browsers)
npm run test:smoke         # Fast critical path tests (~30s)
npm run test:core          # Core functionality tests
npm run test:integration   # End-to-end patching workflow
npm run test:headed        # Tests with visible browser
npm run test:debug         # Debug mode with inspector
npm run test:ui            # Interactive Playwright UI
```

## Build / Generation

```bash
node scripts/generate-manifest.js    # Regenerate docs/manifest.json from patches/ + metadata/
python scripts/validate_filenames.py # Validate patch file naming convention
python scripts/rename_patches.py     # Batch rename patches to convention
python scripts/generate_badge_css.py # Generate badge CSS from config
```

## CI/CD (GitHub Actions)

- `update_manifest.yml` — auto-generates manifest when patches/metadata change
- `validate-submission.yml` — validates community PR submissions
- `validate-naming.yml` — checks patch file naming convention
- `pr-info.yml` — posts info comments on development PRs
- `generate-css.yml` — generates badge CSS from config

## Submission Validation Override

Add `Force validation: true` to a PR description to force validation on development PRs.

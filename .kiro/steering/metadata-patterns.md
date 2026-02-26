---
inclusion: fileMatch
fileMatchPattern: "metadata/**/*.json"
---

# Metadata File Patterns

When editing metadata JSON files:

- One JSON file per ROM hack in `metadata/{baseRom}/` directory
- Required fields: `baseRom`, `system`, `status`, `author`
- Common fields: `title`, `version`, `released`, `hackType`, `difficulty`, `tags`, `graphics`, `story`, `maps`, `postgame`, `mechanics`, `fakemons`, `variants`
- `baseRom` must match a key in `config/base-roms.json`
- `system` must match a key in `config/systems.json` (GB, GBC, GBA, NDS, 3DS, GC, WII, NSW)
- After editing metadata, run `node scripts/generate-manifest.js` to regenerate `docs/manifest.json`
- Never edit `docs/manifest.json` directly
- Validate naming with `python scripts/validate_filenames.py`

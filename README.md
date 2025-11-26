# Self-Updating ROM Patcher

A GitHub Pages-hosted ROM patcher that automatically updates its patch list when new files are added.

## Setup

1. **Enable GitHub Pages**: Go to Settings → Pages → Source: GitHub Actions
2. **Add RomPatcher.js**: Download `rompatcher.min.js` from [MarcRobledo/RomPatcher.js](https://github.com/MarcRobledo/RomPatcher.js) and place in `docs/js/`
3. **Add patches**: Upload patch files to `patches/` folder
4. **Naming convention**: `Game Name - Hack Name (v1.0).bps`

## Usage

- Upload patch files (IPS, BPS, UPS, XDelta) to `patches/` folder
- GitHub Actions automatically updates `docs/manifest.json`
- Users select patches and provide their own ROM files
- Patched ROM downloads automatically

## File Structure

```text
├── .github/workflows/update_manifest.yml  # Auto-update workflow
├── scripts/generate-manifest.js           # Manifest generator
├── patches/                               # Patch files go here
└── docs/                                  # GitHub Pages root
    ├── index.html                         # Main interface
    ├── style.css                          # Styling
    ├── manifest.json                      # Auto-generated patch list
    └── js/rompatcher.min.js              # Patcher library (add manually)
```

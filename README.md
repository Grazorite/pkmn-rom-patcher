# Universal ROM Management (UROMM)

A comprehensive ROM patching platform with automated patch management, community submissions, and GitHub Pages hosting.

## Features

### 🎮 ROM Patcher

- Client-side ROM patching (IPS, BPS, UPS, XDelta)
- Search and filter patches
- Automatic ROM validation
- CRC32/MD5/SHA-1 checksums
- No server uploads - everything runs in your browser

### 📚 ROM Library

- Searchable patch database
- Advanced filtering (system, difficulty, status, tags)
- Detailed patch information with descriptions
- Banner images and box art
- Direct links to documentation and communities

### 📤 Community Submissions

- Web-based submission form
- GitHub PAT authentication
- Automated PR creation
- Metadata validation via GitHub Actions
- No GitHub knowledge required

## Quick Start

### For Users

1. Visit the hosted site
2. Browse the library or search for patches
3. Select a patch and upload your ROM file
4. Download the patched ROM

### For Contributors

1. Navigate to `/submit` page
2. Fill out the 5-step submission form
3. Authenticate with GitHub (PAT)
4. Submit - creates automatic PR
5. Wait for maintainer review

## Setup (Self-Hosting)

### Prerequisites

- GitHub repository
- GitHub Pages enabled
- Node.js 18+ (for development)

### Installation

1. **Clone repository**

   ```bash
   git clone <repository-url>
   cd pkmn-rom-patcher
   ```

2. **Enable GitHub Pages**
   - Settings → Pages → Source: GitHub Actions

3. **Add RomPatcher.js**
   - Download from [MarcRobledo/RomPatcher.js](https://github.com/MarcRobledo/RomPatcher.js)
   - Place `rompatcher.min.js` in `docs/patcher/rom-patcher-js/`

4. **Configure workflows**
   - `.github/workflows/update_manifest.yml` - Auto-updates manifest
   - `.github/workflows/validate-submission.yml` - Validates submissions

### Development

```bash
# Install dependencies
npm install

# Start local server
npm run serve

# Run tests
npm test
npm run test:smoke
```

## Submission Templates

### Metadata Format

Submissions should follow this structure:

```json
{
  "id": "base-rom-hack-name",
  "title": "Hack Name",
  "file": "../patches/baserom/Hack_Name.bps",
  "type": "bps",
  "baseRom": "baserom",
  "meta": {
    "baseRom": "Base ROM Name",
    "system": "GBA",
    "author": "Author Name",
    "version": "1.0",
    "released": "2024-01-01",
    "status": "Complete",
    "difficulty": "Normal",
    "images": {
      "boxArt": "https://example.com/boxart.png",
      "banner": "https://example.com/banner.png"
    },
    "links": {
      "website": "https://example.com",
      "discord": "https://discord.gg/example",
      "documentation": "https://docs.example.com"
    }
  },
  "changelog": "# Description\n\nMarkdown formatted description..."
}
```

### Pull Request Template

Community submissions use `.github/PULL_REQUEST_TEMPLATE/community_submission.md`:

- Title format: `Add [Hack Name]`
- Required fields: title, author, base ROM, description
- Checklist for validation
- Auto-generated metadata preview

## File Structure

```css
├── .github/
│   ├── workflows/
│   │   ├── update_manifest.yml          # Auto-update manifest
│   │   └── validate-submission.yml      # Validate PRs
│   └── PULL_REQUEST_TEMPLATE/
│       └── community_submission.md      # PR template
├── docs/
│   ├── assets/
│   │   ├── css/                         # Modular CSS
│   │   └── js/
│   │       ├── modules/                 # App modules
│   │       └── services/                # GitHub integration
│   ├── library/                         # Library page
│   ├── patcher/                         # Patcher page
│   ├── submit/                          # Submission form
│   ├── manifest.json                    # Auto-generated
│   └── index.html                       # Landing page
├── patches/                             # Patch files
├── metadata/                            # Metadata files
└── tests/                               # Playwright tests
```

## GitHub Actions Workflows

### Update Manifest

Automatically updates `manifest.json` when patches are added:

- Triggers on push to `patches/` or `metadata/`
- Generates manifest from metadata files
- Commits changes back to repository

### Validate Submissions

Validates community submissions:

- Checks JSON validity
- Verifies required fields
- Validates patch file extensions
- Checks for duplicates
- Auto-comments on PRs

## Testing

### Test Suite

- **93 tests** across 3 browsers (Chromium, Firefox, WebKit)
- Smoke tests for critical paths
- Core functionality tests
- Integration tests
- Visual regression tests

```bash
# Run all tests
npm test

# Run smoke tests only
npm run test:smoke

# Run with UI
npm run test:ui
```

## Patch Naming Convention

All patches follow a standardized naming format for consistency and automation:

```
{TITLE}_{SYSTEM}_{BASEROM-CRC}_{VERSION}{VARIANT}_{YEAR}.{ext}
```

**Example**: `EMERALD-ENHANCED_GBA_EM-1961_v11.010_2025.bps`

See [NAMING_CONVENTION.md](NAMING_CONVENTION.md) for complete details and tools.

## Contributing

### Adding Patches (Maintainers)

1. Add patch file to `patches/[baserom]/`
2. Add metadata to `metadata/[baserom]/[hackname].json`
3. Commit and push - manifest updates automatically

### Community Submissions

1. Use `/submit` page on the website
2. Fill out all required fields
3. Authenticate with GitHub PAT
4. Submit creates automatic PR
5. Maintainers review and merge

### Development Guidelines

- Follow existing code structure
- Add tests for new features
- Update documentation
- Use semantic commit messages

## Security

- All patching happens client-side
- No ROM files uploaded to servers
- GitHub PAT stored in sessionStorage only
- Minimal permissions required (public_repo)
- Automated validation prevents malicious submissions

## License

ISC

## Credits

- [RomPatcher.js](https://github.com/MarcRobledo/RomPatcher.js) by Marc Robledo
- [Lucide Icons](https://lucide.dev/)
- [Fuse.js](https://fusejs.io/) for search
- [Marked.js](https://marked.js.org/) for markdown

## Support

For issues or questions:

- Open an issue on GitHub
- Check existing documentation
- Review PR template for submission guidelines

# Project Folder Structure

## Overview

The project is organized by base ROM to support scalability with thousands of patches.

## Directory Structure

```text
├── patches/                    # ROM patch files organized by base ROM
│   ├── crystal/               # Pokemon Crystal patches
│   ├── emerald/               # Pokemon Emerald patches
│   ├── firered/               # Pokemon FireRed patches
│   └── ...                    # Other base ROMs
├── metadata/                   # Metadata files (YAML frontmatter + markdown)
│   ├── crystal/               # Metadata for Crystal patches
│   ├── emerald/               # Metadata for Emerald patches
│   └── ...                    # Matching base ROM structure
├── images/                     # Static images (optional, URLs preferred)
│   ├── crystal/               # Images for Crystal patches
│   └── ...                    # Matching base ROM structure
└── docs/                      # Web application files (GitHub Pages root)
    ├── assets/
    │   ├── css/              # Stylesheets
    │   │   ├── base/         # Variables, reset, animations
    │   │   ├── layout/       # App layout, grid systems
    │   │   ├── components/   # UI components, buttons, cards
    │   │   └── themes/       # Dark theme
    │   └── js/
    │       ├── modules/      # Core application modules
    │       │   ├── library-app.js    # Library page controller
    │       │   ├── patcher-app.js    # Patcher page controller
    │       │   ├── search.js         # Search & filtering
    │       │   ├── ui.js             # UI rendering
    │       │   ├── patcher.js        # Patch management
    │       │   ├── cache.js          # LocalStorage caching
    │       │   ├── monitor.js        # Performance monitoring
    │       │   └── utils.js          # Utilities
    │       ├── utils/        # Utility functions
    │       │   └── animations.js     # Animation helpers
    │       ├── core.js       # Core initialization
    │       └── navigation.js # Navigation handling
    ├── patcher/
    │   ├── rom-patcher-js/   # RomPatcher.js library (280KB)
    │   │   ├── RomPatcher.webapp.js
    │   │   ├── worker files
    │   │   └── format modules (IPS, BPS, UPS, XDelta)
    │   └── index.html        # Patcher page
    ├── library/
    │   └── index.html        # Library page
    ├── index.html            # Landing page
    ├── test-patcher.html     # RomPatcher.js test page
    └── manifest.json         # Auto-generated from patches + metadata
```

## Adding New Patches

1. **Create base ROM folder** (if it doesn't exist):

   ```bash
   patches/[baserom]/
   metadata/[baserom]/
   ```

2. **Add patch file**:

   ```bash
   patches/[baserom]/PatchName.ips
   ```

3. **Add metadata file**:

   ```bash
   metadata/[baserom]/PatchName.md
   ```

4. **Run manifest generator**:

   ```bash
   node scripts/generate-manifest.js
   ```

## Metadata Format

Each patch requires a corresponding `.md` file with YAML frontmatter:

```yaml
---
title: "Patch Name"
baseRom: "Crystal"
system: "GBC"
status: "Completed"
author: "Author Name"
website: "https://example.com"
released: "2024-01-01"
hackType: "New"
tags: ["Tag1", "Tag2"]
graphics: "Enhanced"
story: "Enhanced"
maps: "Enhanced"
postgame: "Yes"
difficulty: "Hard"
mechanics: ["Mechanic1"]
fakemons: "None"
variants: ["None"]
typeChanges: ["None"]
physicalSpecialSplit: false
antiCheat: false
boxArt: "https://example.com/image.jpg"
bannerImage: "https://example.com/banner.jpg"
discord: "https://discord.gg/example"
documentation: "https://docs.example.com"
---

# Patch Description

Markdown content describing the patch...
```

## Benefits

- **Scalability**: Supports thousands of patches organized by base ROM
- **Maintainability**: Clear separation of patches, metadata, and images
- **Automation**: GitHub Actions automatically updates manifest
- **Performance**: Efficient filtering and search by base ROM
- **Modularity**: JavaScript code split into focused modules

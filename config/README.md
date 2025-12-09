# Configuration Files

Single source of truth for system and base ROM mappings used across the project.

## Files

### `systems.json`

Platform/system definitions with display names, abbreviations, and badge colors.

**Schema**:

```json
{
  "ABBREVIATION": {
    "name": "Full System Name",
    "abbreviation": "SHORT",
    "released": 1989,
    "colors": {
      "primary": "#HEX",
      "secondary": "#HEX",
      "text": "#HEX"
    }
  }
}
```

### `base-roms.json`

Base ROM definitions with CRC variants, system mappings, and badge colors.

**Schema**:

```json
{
  "ROM Name": {
    "abbreviation": "SHORT",
    "system": "SYSTEM_ABBR",
    "fullName": "Full ROM Name",
    "variants": [
      {
        "crc": "1234",
        "region": "US, EU",
        "revision": "rev1"
      }
    ],
    "colors": {
      "primary": "#HEX",
      "secondary": "#HEX",
      "text": "#HEX"
    }
  }
}
```

**CRC Variants**:

- Some ROMs have multiple CRCs due to regional differences or revisions
- `crc`: 4-digit identifier from [No-Intro database](https://datomatic.no-intro.org/)
- `region`: Region codes (US, EU, JP, AU, etc.)
- `revision`: null or "rev1", "rev2", etc.

## Usage

### Python (Backend)

```python
from scripts.utils.config_loader import load_systems, load_base_roms

systems = load_systems()
base_roms = load_base_roms()

# Get abbreviation
system_abbr = systems["GBA"]["abbreviation"]  # "GBA"
rom_abbr = base_roms["Emerald"]["abbreviation"]  # "EM"

# Get CRC variants
variants = base_roms["Platinum"]["variants"]
# [{"crc": "3541", "region": "US", ...}, ...]
```

### JavaScript (Frontend)

```javascript
import { loadSystems, loadBaseRoms } from './config/loader.js';

const systems = await loadSystems();
const baseRoms = await loadBaseRoms();

// Populate dropdowns
Object.values(systems).forEach(system => {
  // Add to dropdown
});
```

### CSS Generation

Badge styles are auto-generated from these configs:

```bash
python scripts/generate_badge_css.py
```

Output: `docs/assets/css/generated/badges.css`

## Adding New Entries

### Add a System

1. Add entry to `systems.json`
2. Choose colors that match the platform's branding
3. Run `python scripts/generate_badge_css.py`
4. Commit both config and generated CSS

### Add a Base ROM

1. Add entry to `base-roms.json`
2. Look up CRC codes from [No-Intro database](https://datomatic.no-intro.org/)
3. Add all regional variants if applicable
4. Choose colors that match the game's branding
5. Run `python scripts/generate_badge_css.py`
6. Commit both config and generated CSS

## CRC Code Sources

CRC codes are sourced from the [No-Intro database](https://datomatic.no-intro.org/):

- Search by game name
- Use the 4-digit ID from the database
- Include all regional variants for comprehensive patch support

## Maintenance

- Keep colors consistent with game/platform branding
- Document CRC sources in commit messages
- Test generated CSS after changes
- Validate JSON syntax before committing

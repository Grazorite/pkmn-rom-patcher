# Patch Filename Naming Convention

## Format

```code
{TITLE}_{SYSTEM}_{BASEROM-CRC}_{VERSION}{VARIANT}_{YEAR}.{ext}
```

## Field Definitions

- **TITLE**: Normalized hack title (ALL_CAPS, hyphens for spaces)
- **SYSTEM**: Platform abbreviation (GB, GBC, GBA, NDS, 3DS, etc.)
- **BASEROM-CRC**: Base ROM abbreviation + CRC code (e.g., EM-1961, PT-4997)
- **VERSION**: Version string (preserved as-is, including 'v' prefix)
- **VARIANT**: Optional variant suffix (e.g., VANILLA+, INVERSENORMALMODE)
- **YEAR**: Release year (YYYY)
- **ext**: Actual patch extension (bps, ips, ups, xdelta)

## Examples

```code
EMERALD-ENHANCED_GBA_EM-1961_v11.010_2025.bps
PLATINUM-REDUX_NDS_PT-4997_v2.9.9_2025.bps
BLACK-2-KAIZO_NDS_B2-6149_FULLRELEASE1.1.10_2_2022.xdelta
GOLD-97-REFORGED_GBC_CRY-0900_v6.1E_2024.ips
```

## CRC Codes

CRC codes identify specific ROM versions. Some base ROMs have multiple CRCs due to regional differences or revisions.

**Example: Platinum has 3 CRCs:**

- PT-3541 (US)
- PT-3797 (EU)
- PT-4997 (US rev1)

See `config/base-roms.json` for the complete list of supported base ROMs and their CRC variants.

## Title Normalization Rules

1. Remove "Pokemon" prefix if present
2. Convert to ALL_CAPS
3. Replace spaces with hyphens
4. Remove special characters (except hyphens and numbers)
5. Preserve version numbers and meaningful suffixes

**Examples:**

- "Pokemon Emerald Enhanced" → "EMERALD-ENHANCED"
- "Platinum Redux 2.0" → "PLATINUM-REDUX"
- "Gold '97 Reforged" → "GOLD-97-REFORGED"

## Version Handling

Versions are preserved as-is from the metadata, including:

- Standard versions: `v1.0`, `v2.9.9`, `v11.010`
- Complex versions: `FULLRELEASE1.1.10_2`, `BETA3.1`
- Variants: `v1.1VANILLA+`, `v2.0INVERSENORMALMODE`

## Tools

### Rename existing patches

```bash
# Dry run (preview changes)
python scripts/rename_patches.py

# Execute renames
python scripts/rename_patches.py --apply

# Specific base ROM only
python scripts/rename_patches.py --baserom emerald --apply
```

### Validate naming

```bash
# Validate all files
python scripts/validate_filenames.py --pr

# Validate manifest
python scripts/validate_filenames.py --manifest docs/manifest.json
```

## Configuration

The naming system uses configuration files:

- `config/systems.json` - Platform definitions and abbreviations
- `config/base-roms.json` - Base ROM mappings with CRC variants

These configs also drive the CSS badge generation and frontend dropdowns.

## Backward Compatibility

When implementing this system:

1. Existing patches are renamed using the standardization tool
2. The manifest.json is updated to reflect new filenames
3. No symlinks or redirects are needed
4. The change is atomic (all files renamed in one commit)

## Validation

- GitHub Actions automatically validate naming on PRs
- Non-compliant filenames generate informational comments
- Validation warnings don't block PR merges
- The manifest generation workflow includes validation steps

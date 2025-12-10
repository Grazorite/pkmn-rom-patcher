"""Filename standardizer for patch files."""
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Optional
import yaml

from .config_loader import get_system_abbr, get_baserom_abbr, find_matching_crc

def normalize_title(title: str) -> str:
    """Normalize title to ALL_CAPS with hyphens.
    
    - Remove 'Pokemon' prefix
    - Convert to ALL_CAPS
    - Replace spaces with hyphens
    - Remove special chars except hyphens and numbers
    - Remove accents
    """
    # Remove accents
    title = unicodedata.normalize('NFKD', title).encode('ascii', 'ignore').decode()
    
    # Remove "Pokemon" prefix (case insensitive)
    title = re.sub(r'^pokemon\s+', '', title, flags=re.IGNORECASE)
    
    # Replace spaces with hyphens
    title = title.replace(' ', '-')
    
    # Remove special chars except hyphens, numbers, and letters
    title = re.sub(r'[^A-Za-z0-9\-]', '', title)
    
    # Convert to uppercase
    return title.upper()

def parse_version(version: str) -> tuple[str, str]:
    """Parse version string into core and variant.
    
    VERSION contains only numbers and dots.
    VARIANT contains letters, numbers, and special chars.
    
    Args:
        version: Version string (e.g., "v11.010", "v1.1 VANILLA+")
        
    Returns:
        Tuple of (core_version, variant)
        
    Examples:
        "v11.010" -> ("11.010", "")
        "v1.1 VANILLA+" -> ("1.1", "VANILLA+")
        "FULLRELEASE1.1.10_2" -> ("1.1.10", "FULLRELEASE_2")
    """
    if not version or version.strip() == '-':
        return "0.0", ""
    
    version = version.strip()
    
    # Remove 'v' or 'V' prefix
    version = re.sub(r'^[vV]', '', version)
    
    # Extract numeric version (numbers and dots only)
    core_match = re.search(r'^([\d\.]+)', version)
    if core_match:
        core = core_match.group(1)
        # Everything after core is variant
        variant = version[len(core):].strip()
        # Normalize variant (remove spaces, keep alphanumeric, hyphens, underscores, plus)
        if variant:
            variant = re.sub(r'\s+', '', variant)
            variant = re.sub(r'[^\w\-\+]', '', variant)
            variant = variant.upper()
        return core, variant
    
    # If no numeric version found, treat entire string as variant
    variant = re.sub(r'\s+', '', version)
    variant = re.sub(r'[^\w\-\+]', '', variant)
    return "0.0", variant.upper()

def extract_year(date_str: str) -> str:
    """Extract year from date string.
    
    Args:
        date_str: ISO date string (YYYY-MM-DD)
        
    Returns:
        Year as string or "0000" if invalid
    """
    if not date_str:
        return "0000"
    
    try:
        dt = datetime.fromisoformat(str(date_str))
        return str(dt.year)
    except (ValueError, TypeError):
        return "0000"

def parse_metadata_file(md_path: Path) -> dict:
    """Parse YAML frontmatter from metadata file.
    
    Args:
        md_path: Path to .md metadata file
        
    Returns:
        Dictionary of metadata fields
    """
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract YAML frontmatter
    match = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not match:
        raise ValueError(f"No YAML frontmatter found in {md_path}")
    
    frontmatter = match.group(1)
    return yaml.safe_load(frontmatter)

def generate_filename(
    title: str,
    system: str,
    baserom: str,
    crc: str,
    version: str,
    variant: str,
    year: str,
    extension: str
) -> str:
    """Generate standardized filename.
    
    Format: {TITLE}_{SYSTEM}_{BASEROM-CRC}_{VERSION}{VARIANT}_{YEAR}.{ext}
    
    Args:
        title: Normalized title (ALL_CAPS)
        system: System abbreviation (GBA, NDS, etc.)
        baserom: Base ROM abbreviation (EM, PT, etc.)
        crc: CRC code (4 digits)
        version: Version string
        variant: Variant suffix (optional)
        year: Release year (YYYY)
        extension: File extension (bps, ips, xdelta, etc.)
        
    Returns:
        Standardized filename
        
    Example:
        EMERALD-ENHANCED_GBA_EM-1961_v11.010_2025.bps
    """
    # Combine version and variant
    version_full = f"{version}{variant}" if variant else version
    
    # Build filename
    parts = [
        title,
        system,
        f"{baserom}-{crc}",
        version_full,
        year
    ]
    
    filename = "_".join(parts) + f".{extension}"
    return filename

def standardize_from_metadata(md_path: Path, patch_path: Path) -> dict:
    """Generate standardized filename from metadata file.
    
    Args:
        md_path: Path to metadata .md file
        patch_path: Path to current patch file
        
    Returns:
        Dictionary with:
            - old_filename: Current filename
            - new_filename: Standardized filename
            - metadata_path: Path to metadata file
            - patch_path: Path to patch file
            - needs_rename: Boolean indicating if rename needed
            - warnings: List of warning messages
    """
    metadata = parse_metadata_file(md_path)
    warnings = []
    
    # Extract fields
    title = normalize_title(metadata.get('title', ''))
    system = get_system_abbr(metadata.get('system', ''))
    baserom_name = metadata.get('baseRom', '')
    baserom = get_baserom_abbr(baserom_name)
    
    # Get CRC (use first variant if multiple)
    crc = find_matching_crc(baserom_name)
    if crc == "XXXX":
        warnings.append(f"No CRC found for {baserom_name}")
    
    # Check for multiple CRC variants
    from .config_loader import get_baserom_variants
    variants = get_baserom_variants(baserom_name)
    if len(variants) > 1:
        regions = ", ".join([f"{v['crc']} ({v['region']})" for v in variants])
        warnings.append(f"Multiple CRC variants available: {regions}")
    
    # Parse version
    version_raw = metadata.get('version', '')
    version_core, variant = parse_version(version_raw)
    
    # Extract year
    year = extract_year(metadata.get('released', ''))
    
    # Get extension from current file
    extension = patch_path.suffix.lstrip('.')
    
    # Generate new filename
    new_filename = generate_filename(
        title, system, baserom, crc, version_core, variant, year, extension
    )
    
    old_filename = patch_path.name
    needs_rename = old_filename != new_filename
    
    return {
        'old_filename': old_filename,
        'new_filename': new_filename,
        'metadata_path': str(md_path),
        'patch_path': str(patch_path),
        'needs_rename': needs_rename,
        'warnings': warnings
    }

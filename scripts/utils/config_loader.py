"""Config loader for systems and base ROMs."""
import json
from pathlib import Path
from typing import Optional

CONFIG_DIR = Path(__file__).parent.parent.parent / "config"

def load_systems() -> dict:
    """Load systems configuration."""
    with open(CONFIG_DIR / "systems.json") as f:
        return json.load(f)

def load_base_roms() -> dict:
    """Load base ROMs configuration."""
    with open(CONFIG_DIR / "base-roms.json") as f:
        return json.load(f)

def get_system_abbr(system_name: str) -> str:
    """Get system abbreviation from full name."""
    systems = load_systems()
    for abbr, data in systems.items():
        if data["name"] == system_name or abbr == system_name:
            return abbr
    return "UNK"

def get_baserom_abbr(rom_name: str) -> str:
    """Get base ROM abbreviation."""
    base_roms = load_base_roms()
    if rom_name in base_roms:
        return base_roms[rom_name]["abbreviation"]
    return "UNK"

def get_baserom_variants(rom_name: str) -> list[dict]:
    """Get all CRC variants for a base ROM."""
    base_roms = load_base_roms()
    if rom_name in base_roms:
        return base_roms[rom_name]["variants"]
    return []

def find_matching_crc(rom_name: str, crc_hint: Optional[str] = None) -> str:
    """Find matching CRC code for a base ROM.
    
    Args:
        rom_name: Base ROM name
        crc_hint: Optional CRC hint to match against
        
    Returns:
        CRC code or "XXXX" if not found
    """
    variants = get_baserom_variants(rom_name)
    
    if not variants:
        return "XXXX"
    
    if crc_hint:
        for variant in variants:
            if variant["crc"] == crc_hint:
                return variant["crc"]
    
    # Return first variant if no hint or no match
    return variants[0]["crc"]

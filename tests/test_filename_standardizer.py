"""Tests for filename standardizer."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent / 'scripts'))

from utils.filename_standardizer import (
    normalize_title,
    parse_version,
    extract_year,
    generate_filename
)

def test_normalize_title():
    """Test title normalization."""
    assert normalize_title("Emerald Enhanced") == "EMERALD-ENHANCED"
    assert normalize_title("Pokemon Emerald Enhanced") == "EMERALD-ENHANCED"
    assert normalize_title("Black 2 Kaizo") == "BLACK-2-KAIZO"
    assert normalize_title("PMD: Explorers of Sky") == "PMD-EXPLORERS-OF-SKY"
    assert normalize_title("Gold 97: Reforged") == "GOLD-97-REFORGED"
    print("✓ test_normalize_title passed")

def test_parse_version():
    """Test version parsing."""
    # Remove 'v' prefix
    assert parse_version("v11.010") == ("11.010", "")
    assert parse_version("V1.2.3") == ("1.2.3", "")
    
    # Version with variant
    assert parse_version("v1.1 VANILLA+") == ("1.1", "VANILLA+")
    assert parse_version("1.0.5") == ("1.0.5", "")
    
    # Complex variants (FULLRELEASE has no numeric prefix, so entire string becomes variant)
    core, variant = parse_version("FULLRELEASE1.1.10_2")
    assert core == "0.0"  # No numeric prefix found
    assert "FULLRELEASE" in variant
    
    # Edge cases
    assert parse_version("") == ("0.0", "")
    assert parse_version("-") == ("0.0", "")
    
    print("✓ test_parse_version passed")

def test_extract_year():
    """Test year extraction."""
    assert extract_year("2024-05-13") == "2024"
    assert extract_year("2025-11-03") == "2025"
    assert extract_year("") == "0000"
    assert extract_year(None) == "0000"
    print("✓ test_extract_year passed")

def test_generate_filename():
    """Test filename generation."""
    filename = generate_filename(
        title="EMERALD-ENHANCED",
        system="GBA",
        baserom="EM",
        crc="1961",
        version="11.010",
        variant="",
        year="2025",
        extension="xdelta"
    )
    assert filename == "EMERALD-ENHANCED_GBA_EM-1961_11.010_2025.xdelta"
    
    # With variant
    filename = generate_filename(
        title="BLACK-2-KAIZO",
        system="NDS",
        baserom="B2",
        crc="6149",
        version="0.0",
        variant="FULLRELEASE1110_2",
        year="2022",
        extension="xdelta"
    )
    assert filename == "BLACK-2-KAIZO_NDS_B2-6149_0.0FULLRELEASE1110_2_2022.xdelta"
    
    print("✓ test_generate_filename passed")

def test_version_no_letters():
    """Test that VERSION portion contains no letters."""
    test_cases = [
        ("v11.010", "11.010", ""),
        ("v1.1VANILLA+", "1.1", "VANILLA+"),
        ("1.0.5", "1.0.5", ""),
        ("FULLRELEASE1.1.10_2", "0.0", "FULLRELEASE1110_2"),
    ]
    
    for input_ver, expected_core, expected_variant in test_cases:
        core, variant = parse_version(input_ver)
        # Check core has no letters
        assert not any(c.isalpha() for c in core), f"Core '{core}' contains letters"
        assert core == expected_core, f"Expected core '{expected_core}', got '{core}'"
        print(f"  ✓ '{input_ver}' -> core='{core}', variant='{variant}'")
    
    print("✓ test_version_no_letters passed")

if __name__ == '__main__':
    print("Running filename standardizer tests...\n")
    test_normalize_title()
    test_parse_version()
    test_extract_year()
    test_generate_filename()
    test_version_no_letters()
    print("\n✅ All tests passed!")

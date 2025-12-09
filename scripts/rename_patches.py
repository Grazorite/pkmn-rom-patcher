#!/usr/bin/env python3
"""CLI tool to rename patch files to standardized format."""
import argparse
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).parent))
from utils.filename_standardizer import standardize_from_metadata, parse_metadata_file

def scan_metadata_files(metadata_dir: Path, baserom_filter: Optional[str] = None) -> list[Path]:
    """Scan for metadata files.
    
    Args:
        metadata_dir: Path to metadata directory
        baserom_filter: Optional base ROM filter (e.g., "emerald")
        
    Returns:
        List of metadata file paths
    """
    if baserom_filter:
        pattern = f"{baserom_filter}/*.md"
    else:
        pattern = "**/*.md"
    
    return sorted(metadata_dir.glob(pattern))

def find_patch_file(metadata: dict, patches_dir: Path, md_path: Path) -> Optional[Path]:
    """Find corresponding patch file for metadata.
    
    Args:
        metadata: Parsed metadata dictionary
        patches_dir: Path to patches directory
        md_path: Path to metadata file
        
    Returns:
        Path to patch file or None if not found
    """
    # Try to find patch file using 'file' field in metadata
    if 'file' in metadata:
        file_path = metadata['file']
        # Handle relative paths
        if file_path.startswith('../patches/'):
            file_path = file_path.replace('../patches/', '')
        patch_path = patches_dir / file_path
        if patch_path.exists():
            return patch_path
    
    # Fallback: look for patch file with same base name in same subdirectory
    baserom_subdir = md_path.parent.name
    patch_subdir = patches_dir / baserom_subdir
    
    if patch_subdir.exists():
        # Look for any patch file with similar name
        md_stem = md_path.stem
        for ext in ['.bps', '.ips', '.ups', '.xdelta', '.gba', '.nds', '.gb', '.gbc']:
            patch_path = patch_subdir / f"{md_stem}{ext}"
            if patch_path.exists():
                return patch_path
    
    return None

def generate_rename_plan(metadata_dir: Path, patches_dir: Path, baserom_filter: Optional[str] = None) -> list[dict]:
    """Generate rename plan for all patches.
    
    Args:
        metadata_dir: Path to metadata directory
        patches_dir: Path to patches directory
        baserom_filter: Optional base ROM filter
        
    Returns:
        List of rename operations
    """
    md_files = scan_metadata_files(metadata_dir, baserom_filter)
    plan = []
    
    for md_path in md_files:
        try:
            metadata = parse_metadata_file(md_path)
            patch_path = find_patch_file(metadata, patches_dir, md_path)
            
            if not patch_path:
                print(f"⚠️  Warning: No patch file found for {md_path.name}", file=sys.stderr)
                continue
            
            result = standardize_from_metadata(md_path, patch_path)
            plan.append(result)
            
        except Exception as e:
            print(f"❌ Error processing {md_path.name}: {e}", file=sys.stderr)
    
    return plan

def validate_plan(plan: list[dict]) -> tuple[bool, list[str]]:
    """Validate rename plan.
    
    Args:
        plan: List of rename operations
        
    Returns:
        Tuple of (is_valid, errors)
    """
    errors = []
    new_filenames = set()
    
    for item in plan:
        new_filename = item['new_filename']
        
        # Check for collisions
        if new_filename in new_filenames:
            errors.append(f"Duplicate filename: {new_filename}")
        new_filenames.add(new_filename)
        
        # Check if new file already exists (and it's not the same file)
        patch_path = Path(item['patch_path'])
        new_path = patch_path.parent / new_filename
        if new_path.exists() and new_path != patch_path:
            errors.append(f"File already exists: {new_filename}")
    
    return len(errors) == 0, errors

def execute_renames(plan: list[dict], backup: bool = False, dry_run: bool = True) -> None:
    """Execute rename operations.
    
    Args:
        plan: List of rename operations
        backup: Whether to create backups
        dry_run: If True, only show what would be done
    """
    backup_dir: Optional[Path] = None
    if backup and not dry_run:
        backup_dir = Path('.backup') / datetime.now().strftime('%Y-%m-%d_%H%M%S')
        backup_dir.mkdir(parents=True, exist_ok=True)
        print(f"📦 Backup directory: {backup_dir}\n")
    
    for item in plan:
        if not item['needs_rename']:
            continue
        
        patch_path = Path(item['patch_path'])
        new_path = patch_path.parent / item['new_filename']
        
        if dry_run:
            continue
        
        # Create backup
        if backup and backup_dir is not None:
            backup_path = backup_dir / patch_path.name
            shutil.copy2(patch_path, backup_path)
        
        # Rename file
        patch_path.rename(new_path)
        
        # Update and rename metadata file
        new_md_path = update_metadata_file(Path(item['metadata_path']), item['new_filename'])
        print(f"  ✓ Renamed metadata: {new_md_path.name}")

def update_metadata_file(md_path: Path, new_filename: str) -> Path:
    """Update 'file' field in metadata and rename metadata file to match.
    
    Args:
        md_path: Path to metadata file
        new_filename: New patch filename
        
    Returns:
        New metadata file path
    """
    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract baserom subdirectory from metadata path
    baserom_subdir = md_path.parent.name
    new_file_path = f"../patches/{baserom_subdir}/{new_filename}"
    
    # Update 'file' field in YAML frontmatter
    content = re.sub(
        r'(file:\s*)["\']?.*?["\']?\s*\n',
        f'\\1"{new_file_path}"\n',
        content
    )
    
    # Generate new metadata filename (same as patch but .md extension)
    new_md_filename = Path(new_filename).stem + '.md'
    new_md_path = md_path.parent / new_md_filename
    
    # Write to new location
    with open(new_md_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Remove old file if different
    if new_md_path != md_path:
        md_path.unlink()
    
    return new_md_path

def print_plan(plan: list[dict]) -> None:
    """Print rename plan in formatted output."""
    print("╔" + "═" * 78 + "╗")
    print("║" + " " * 25 + "PATCH RENAME PLAN" + " " * 36 + "║")
    print("╚" + "═" * 78 + "╝")
    print()
    
    rename_count = sum(1 for item in plan if item['needs_rename'])
    
    for i, item in enumerate(plan, 1):
        if not item['needs_rename']:
            continue
        
        patch_path = Path(item['patch_path'])
        baserom_subdir = patch_path.parent.name
        
        print(f"[{i}/{len(plan)}] {baserom_subdir}/{item['old_filename']}")
        print(f"  OLD: {item['old_filename']}")
        print(f"  NEW: {item['new_filename']}")
        print(f"  📄 Metadata: {Path(item['metadata_path']).relative_to(Path.cwd())}")
        
        if item['warnings']:
            for warning in item['warnings']:
                print(f"  ⚠️  Warning: {warning}")
        
        print("  ✓ Valid")
        print()
    
    print("─" * 80)
    print(f"Summary: {rename_count} files to rename")
    print()

def main():
    parser = argparse.ArgumentParser(
        description="Rename patch files to standardized format",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry-run (default)
  python scripts/rename_patches.py
  
  # Execute renames
  python scripts/rename_patches.py --apply
  
  # Specific base ROM only
  python scripts/rename_patches.py --baserom emerald --apply
  
  # With backup
  python scripts/rename_patches.py --apply --backup
        """
    )
    
    parser.add_argument(
        '--apply',
        action='store_true',
        help='Execute renames (default is dry-run)'
    )
    parser.add_argument(
        '--backup',
        action='store_true',
        help='Create backup before renaming'
    )
    parser.add_argument(
        '--baserom',
        type=str,
        help='Filter by base ROM subdirectory (e.g., emerald)'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Verbose output'
    )
    
    args = parser.parse_args()
    
    # Paths
    root_dir = Path(__file__).parent.parent
    metadata_dir = root_dir / 'metadata'
    patches_dir = root_dir / 'patches'
    
    if not metadata_dir.exists():
        print(f"❌ Error: Metadata directory not found: {metadata_dir}", file=sys.stderr)
        sys.exit(1)
    
    if not patches_dir.exists():
        print(f"❌ Error: Patches directory not found: {patches_dir}", file=sys.stderr)
        sys.exit(1)
    
    # Generate plan
    print("🔍 Scanning metadata files...\n")
    plan = generate_rename_plan(metadata_dir, patches_dir, args.baserom)
    
    if not plan:
        print("No patches found to rename.")
        sys.exit(0)
    
    # Validate plan
    is_valid, errors = validate_plan(plan)
    if not is_valid:
        print("❌ Validation errors:", file=sys.stderr)
        for error in errors:
            print(f"  - {error}", file=sys.stderr)
        sys.exit(1)
    
    # Print plan
    print_plan(plan)
    
    # Execute
    if args.apply:
        print("✅ Executing renames...\n")
        execute_renames(plan, backup=args.backup, dry_run=False)
        print("✅ Done!")
    else:
        print("Run with --apply to execute renames")

if __name__ == '__main__':
    import re
    main()

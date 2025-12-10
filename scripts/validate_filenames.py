#!/usr/bin/env python3
"""
Validate patch filenames against standardized naming convention.
Used by GitHub Actions to validate manifest and PR submissions.
"""

import json
import sys
from pathlib import Path
from typing import List, Dict, Tuple
from utils.filename_standardizer import standardize_from_metadata, parse_metadata_file
from utils.config_loader import load_base_roms, load_systems

def validate_manifest(manifest_path: str) -> Tuple[bool, List[str]]:
    """Validate all entries in manifest.json against standardized naming."""
    errors = []
    
    try:
        with open(manifest_path, 'r') as f:
            manifest = json.load(f)
    except Exception as e:
        return False, [f"Failed to read manifest: {e}"]
    
    for entry in manifest:
        # Check if patch file exists
        patch_path = Path(manifest_path).parent / entry['file']
        if not patch_path.exists():
            errors.append(f"Missing patch file: {entry['file']}")
            continue
            
        # Find corresponding metadata file by searching for files in baseRom directory
        baserom_dir = Path(f"metadata/{entry['baseRom']}")
        if not baserom_dir.exists():
            errors.append(f"Missing metadata directory for {entry['baseRom']}")
            continue
            
        # Look for any .md file in the baseRom directory
        md_files = list(baserom_dir.glob("*.md"))
        if not md_files:
            errors.append(f"No metadata files found in {baserom_dir}")
            continue
            
        # Use the first metadata file found (assuming one per baseRom for now)
        metadata_path = md_files[0]
            
        # Validate filename format
        try:
            result = standardize_from_metadata(metadata_path, patch_path)
            if result['needs_rename']:
                errors.append(f"Non-standard filename: {result['old_filename']} → {result['new_filename']}")
        except Exception as e:
            errors.append(f"Validation error for {entry['id']}: {e}")
    
    return len(errors) == 0, errors

def validate_pr_files(patches_dir: str = "patches", metadata_dir: str = "metadata") -> Tuple[bool, List[Dict]]:
    """Validate files in a PR context."""
    issues = []
    
    # Scan all metadata files
    metadata_path = Path(metadata_dir)
    for md_file in metadata_path.rglob("*.md"):
        try:
            # Find corresponding patch file
            metadata = parse_metadata_file(md_file)
            baserom = md_file.parent.name
            
            # Look for patch file in patches/{baserom}/
            patch_dir = Path(patches_dir) / baserom
            patch_files = list(patch_dir.glob(f"{md_file.stem}.*"))
            
            if not patch_files:
                continue  # No patch file, skip validation
                
            patch_file = patch_files[0]
            
            # Validate naming
            result = standardize_from_metadata(md_file, patch_file)
            if result['needs_rename']:
                issues.append({
                    'current': result['old_filename'],
                    'expected': result['new_filename'],
                    'metadata': str(md_file.relative_to(Path.cwd()))
                })
                
        except Exception as e:
            issues.append({
                'current': str(md_file),
                'expected': 'ERROR',
                'metadata': f"Validation failed: {e}"
            })
    
    return len(issues) == 0, issues

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Validate patch filenames')
    parser.add_argument('--manifest', help='Validate manifest.json')
    parser.add_argument('--pr', action='store_true', help='Validate PR files')
    parser.add_argument('--json', action='store_true', help='Output JSON format')
    
    args = parser.parse_args()
    
    if args.manifest:
        is_valid, errors = validate_manifest(args.manifest)
        if args.json:
            print(json.dumps({'valid': is_valid, 'errors': errors}))
        else:
            if is_valid:
                print("✅ All filenames are valid")
            else:
                print("❌ Validation errors:")
                for error in errors:
                    print(f"  - {error}")
        sys.exit(0 if is_valid else 1)
        
    elif args.pr:
        is_valid, issues = validate_pr_files()
        if args.json:
            print(json.dumps({'valid': is_valid, 'issues': issues}))
        else:
            if is_valid:
                print("✅ All filenames follow naming convention")
            else:
                print(f"⚠️  Found {len(issues)} non-compliant filenames:")
                for issue in issues:
                    print(f"  {issue['current']} → {issue['expected']}")
        sys.exit(0)  # Don't fail PR for naming issues
    
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
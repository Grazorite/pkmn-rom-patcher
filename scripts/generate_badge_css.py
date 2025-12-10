#!/usr/bin/env python3
"""Generate badge CSS from config files."""

import json
from pathlib import Path

def load_config(config_path) -> dict:
    with open(config_path, 'r') as f:
        return json.load(f)

def generate_system_badges(systems: dict) -> str:
    css = []
    css.append("/* System badges */")
    css.append(".badge-system {")
    css.append("    background: linear-gradient(135deg, #667eea, #764ba2);")
    css.append("    color: #ffffff;")
    css.append("}\n")
    
    for abbr, data in systems.items():
        colors = data['colors']
        full_name = data['name']
        
        css.append(f"/* {full_name} ({data['released']}) */")
        css.append(f".badge-system[data-system=\"{full_name}\"],")
        css.append(f".badge-system[data-system=\"{abbr}\"] {{")
        css.append(f"    background: linear-gradient(135deg, {colors['primary']}, {colors['secondary']});")
        css.append(f"    color: {colors['text']};")
        css.append("}\n")
    
    return "\n".join(css)

def generate_rom_badges(base_roms: dict) -> str:
    css = []
    css.append("/* ROM badges */")
    css.append(".badge-rom {")
    css.append("    background: linear-gradient(135deg, #667eea, #764ba2);")
    css.append("    color: #ffffff;")
    css.append("}\n")
    
    for rom_name, data in sorted(base_roms.items()):
        colors = data['colors']
        full_name = data['fullName']
        
        css.append(f".badge-rom[data-rom=\"{full_name}\"] {{")
        css.append(f"    background: linear-gradient(135deg, {colors['primary']}, {colors['secondary']});")
        css.append(f"    color: {colors['text']};")
        css.append("}\n")
    
    return "\n".join(css)

def write_css_file(output_path, css_content: str) -> None:
    output_file = Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    
    header = """/* Auto-generated from config/systems.json and config/base-roms.json */
/* DO NOT EDIT MANUALLY - Run: python scripts/generate_badge_css.py */

"""
    
    with open(output_file, 'w') as f:
        f.write(header + css_content)

def main():
    project_root = Path(__file__).parent.parent
    
    systems = load_config(project_root / 'config' / 'systems.json')
    base_roms = load_config(project_root / 'config' / 'base-roms.json')
    
    system_css = generate_system_badges(systems)
    rom_css = generate_rom_badges(base_roms)
    
    css_content = f"{system_css}\n{rom_css}"
    
    output_path = project_root / 'docs' / 'assets' / 'css' / 'generated' / 'badges.css'
    write_css_file(output_path, css_content)
    
    print(f"✓ Generated {output_path}")
    print(f"  - {len(systems)} system badges")
    print(f"  - {len(base_roms)} ROM badges")

if __name__ == '__main__':
    main()

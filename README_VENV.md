# Python Virtual Environment Setup

This project uses a Python virtual environment stored on **internal storage** for better performance (since the project is on an external SSD).

## Quick Start

### First Time Setup

```bash
./setup-venv.sh
```

This creates a virtual environment at `~/venvs/pkmn-rom-patcher` and installs dependencies.

### Activate Virtual Environment

```bash
source activate.sh
```

Or manually:

```bash
source ~/venvs/pkmn-rom-patcher/bin/activate
```

**Verify activation:**

- Your terminal prompt should show: `(pkmn-rom-patcher)`
- Run: `which python` → should show `/Users/galen/venvs/pkmn-rom-patcher/bin/python`

**VSCode Terminal:**

- VSCode may not show the `(pkmn-rom-patcher)` prefix by default
- Check with: `which python` to confirm you're using the venv
- Or check `$VIRTUAL_ENV` variable: `echo $VIRTUAL_ENV`

### Deactivate

```bash
deactivate
```

## Why Internal Storage?

- **Performance**: Faster I/O operations compared to external SSD
- **Reliability**: No issues if external drive is disconnected
- **Best Practice**: Virtual environments should be on fast, reliable storage

## Location

- **Project**: `/Volumes/s_cx_g/projects/pkmn-rom-patcher` (external SSD)
- **Venv**: `~/venvs/pkmn-rom-patcher` (internal storage)

## Scripts

- `setup-venv.sh`: Create venv and install dependencies
- `activate.sh`: Activate the venv
- `.venv-path`: Stores venv location for scripts

## Adding Dependencies

1. Add to `requirements.txt`
2. Run: `source activate.sh && pip install -r requirements.txt`

#!/bin/bash
# Activate virtual environment from internal storage

VENV_PATH="$HOME/venvs/pkmn-rom-patcher"

if [ ! -d "$VENV_PATH" ]; then
    echo "❌ Virtual environment not found at $VENV_PATH"
    echo "Run ./setup-venv.sh to create it"
    return 1 2>/dev/null || exit 1
fi

source "$VENV_PATH/bin/activate"
echo "✅ Virtual environment activated: $VENV_PATH"
echo "💡 Your prompt should now show: (pkmn-rom-patcher)"
echo "   To verify: which python"

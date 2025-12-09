#!/bin/bash
# Setup virtual environment on internal storage for better performance

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$HOME/venvs/pkmn-rom-patcher"

echo "🔧 Setting up Python virtual environment..."
echo "Project: $PROJECT_DIR"
echo "Venv: $VENV_PATH"
echo ""

# Create venv directory on internal storage
mkdir -p "$HOME/venvs"

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_PATH" ]; then
    echo "📦 Creating virtual environment at $VENV_PATH..."
    python3 -m venv "$VENV_PATH"
    echo "✅ Virtual environment created"
else
    echo "✅ Virtual environment already exists"
fi

# Activate and install dependencies
echo "📥 Installing dependencies..."
source "$VENV_PATH/bin/activate"
pip install --upgrade pip > /dev/null 2>&1
pip install -r "$PROJECT_DIR/requirements.txt"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To activate the virtual environment manually:"
echo "  source ~/venvs/pkmn-rom-patcher/bin/activate"
echo ""
echo "Or use the activate script:"
echo "  source ./activate.sh"

#!/bin/bash
# TestSprite Setup Script for Mientior

echo "🔧 Setting up TestSprite testing environment..."

# Install python3-venv
echo "📦 Installing python3-venv..."
sudo apt install python3.12-venv -y

# Create virtual environment
echo "🌐 Creating virtual environment..."
python3 -m venv testsprite_venv

# Activate and install dependencies
echo "📥 Installing Playwright..."
source testsprite_venv/bin/activate
pip install playwright pytest-playwright

# Install Chromium browser
echo "🌐 Installing Chromium browser..."
playwright install chromium

echo "✅ Setup complete!"
echo ""
echo "To run tests manually:"
echo "  source testsprite_venv/bin/activate"
echo "  python testsprite_tests/TC001_Homepage_Load_and_Element_Visibility.py"
echo ""
echo "Or run all tests:"
echo "  source testsprite_venv/bin/activate"
echo "  for test in testsprite_tests/TC*.py; do python \"\$test\"; done"

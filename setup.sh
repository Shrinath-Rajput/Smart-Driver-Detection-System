#!/bin/bash
# Smart Driver Drowsiness Detection - Quick Setup Script

echo "=========================================="
echo "Smart Driver Drowsiness Detection"
echo "Quick Setup Script"
echo "=========================================="
echo ""

# Check Python
echo "✓ Checking Python..."
python --version || { echo "❌ Python not found. Please install Python 3.8+"; exit 1; }

# Check Node.js
echo "✓ Checking Node.js..."
node --version || { echo "❌ Node.js not found. Please install Node.js 14+"; exit 1; }

# Check MySQL
echo "✓ Checking MySQL..."
mysql --version || echo "⚠️  MySQL not found in PATH. Ensure MySQL Server is running."

echo ""
echo "=========================================="
echo "Installing Dependencies..."
echo "=========================================="

# Install Python packages
echo "Installing Python packages..."
pip install -r requirements.txt
echo "✓ Python packages installed"

# Install Node packages
echo "Installing Node packages..."
cd Backend
npm install
cd ..
echo "✓ Node packages installed"

echo ""
echo "=========================================="
echo "Configuration Files"
echo "=========================================="

echo "✓ Check/update Backend/.env for database credentials"
echo "✓ Check/update .env for driver and detection settings"

echo ""
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo ""
echo "1. Start MySQL Server"
echo ""
echo "2. Terminal 1 - Start Node.js Backend:"
echo "   cd Backend && npm run dev"
echo ""
echo "3. Terminal 2 - Start Python Detection:"
echo "   python -m src.Detection.detect_drowsiness"
echo ""
echo "4. Open Dashboard:"
echo "   http://localhost:5000/dashboard?driver_id=DRIVER_001"
echo ""
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="

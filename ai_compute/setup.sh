#!/bin/bash

# DIV Backend Setup Script

echo "Setting up DIV Inference Backend..."

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "Installing requirements..."
pip install -r requirements.txt

# Copy environment file
echo "Setting up environment file..."
cp .env.example .env

# Create necessary directories
echo "Creating directories..."
mkdir -p cache/models
mkdir -p logs

# Set permissions
chmod +x setup.sh

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Run 'source venv/bin/activate' to activate the virtual environment"
echo "3. Run 'cd src && python main.py' to start the server"
echo ""
echo "Or use Docker:"
echo "docker-compose up --build"
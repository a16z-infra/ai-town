#!/bin/bash

# Build and deploy script for AI Town
# Usage: ./scripts/build-and-deploy.sh [language] [ollama_host]

set -e

# Default values
LANGUAGE=${1:-en}
OLLAMA_HOST=${2:-http://100.116.253.52:7777}
OLLAMA_MODEL=${OLLAMA_MODEL:-llama3.1:latest}

echo "🏗️  Building AI Town with language: $LANGUAGE"
echo "🤖 Ollama host: $OLLAMA_HOST"

# Set environment variables
export VITE_LANGUAGE=$LANGUAGE
export OLLAMA_HOST=$OLLAMA_HOST
export OLLAMA_MODEL=$OLLAMA_MODEL

# Build the production image
echo "📦 Building production Docker image..."
docker build -f Dockerfile.prod \
  --build-arg VITE_LANGUAGE=$LANGUAGE \
  --build-arg OLLAMA_HOST=$OLLAMA_HOST \
  --build-arg OLLAMA_MODEL=$OLLAMA_MODEL \
  -t ai-town:latest .

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ AI Town deployed successfully!"
echo "🌐 Frontend: http://localhost"
echo "📊 Dashboard: http://localhost:6791"
echo "🔧 Backend: http://localhost:3210"

echo ""
echo "🎯 To change language, run:"
echo "   ./scripts/build-and-deploy.sh fr"
echo "   ./scripts/build-and-deploy.sh pt"
echo "   ./scripts/build-and-deploy.sh en"
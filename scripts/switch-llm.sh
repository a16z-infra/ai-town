#!/bin/bash

# Script pour basculer entre les providers LLM
# Usage: ./scripts/switch-llm.sh [ollama|openrouter] [api-key-for-openrouter]

set -e

PROVIDER=${1:-ollama}
API_KEY=${2:-}

echo "🔄 Switching to $PROVIDER provider..."

case $PROVIDER in
  "ollama")
    echo "🦙 Configuring for Ollama (local)..."
    # Commentez OpenRouter, décommentez Ollama
    sed -i '' 's/^LLM_PROVIDER=/#LLM_PROVIDER=/' .env
    sed -i '' 's/^OPENROUTER_/#OPENROUTER_/' .env
    sed -i '' 's/^#OLLAMA_/OLLAMA_/' .env
    
    # Redémarrer les services Docker si ils tournent
    if docker compose ps -q > /dev/null 2>&1; then
      echo "🔄 Restarting Docker services..."
      docker compose restart backend
    fi
    
    echo "✅ Switched to Ollama (local)"
    echo "📍 Make sure Ollama is running on your specified host"
    ;;
    
  "openrouter")
    if [[ -z "$API_KEY" ]]; then
      echo "❌ Error: OpenRouter API key is required"
      echo "Usage: ./scripts/switch-llm.sh openrouter sk-or-v1-your-key-here"
      exit 1
    fi
    
    echo "🌐 Configuring for OpenRouter (cloud)..."
    # Décommentez OpenRouter, commentez Ollama  
    sed -i '' 's/^#LLM_PROVIDER=/LLM_PROVIDER=/' .env
    sed -i '' 's/^#OPENROUTER_/OPENROUTER_/' .env
    sed -i '' 's/^OLLAMA_/#OLLAMA_/' .env
    
    # Set the API key
    sed -i '' "s/OPENROUTER_API_KEY=.*/OPENROUTER_API_KEY=$API_KEY/" .env
    
    # Redémarrer les services Docker si ils tournent
    if docker compose ps -q > /dev/null 2>&1; then
      echo "🔄 Restarting Docker services..."
      docker compose restart backend
    fi
    
    echo "✅ Switched to OpenRouter (cloud)"
    echo "🌐 Using API key: ${API_KEY:0:10}..."
    ;;
    
  *)
    echo "❌ Error: Unknown provider '$PROVIDER'"
    echo "Supported providers: ollama, openrouter"
    exit 1
    ;;
esac

echo ""
echo "🎯 Next steps:"
echo "   1. Restart your development server: npm run dev:backend"
echo "   2. Reset the world data: npx convex run testing:wipeAllTables && npx convex run init"
echo "   3. Check the application: http://localhost:5173"
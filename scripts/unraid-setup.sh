#!/bin/bash

# Configuration complète d'AI Town pour Unraid
# Usage: ./scripts/unraid-setup.sh [unraid-ip]

set -e

UNRAID_IP=${1:-"192.168.1.100"}
REGISTRY_PORT="5000"

echo "🏠 AI Town - Configuration Unraid complète"
echo "📍 IP Unraid: ${UNRAID_IP}"
echo ""

# Étape 1: Configuration du registre Docker privé
echo "📦 Étape 1: Configuration du registre Docker privé"
echo "================================================"
echo ""
echo "🔧 Configuration requise sur Unraid:"
echo ""
echo "1. **Installer Docker Registry**"
echo "   • Aller dans Apps → Community Applications"
echo "   • Rechercher 'Docker Registry'"
echo "   • Installer le template officiel"
echo ""
echo "2. **Configurer Docker Registry**"
echo "   • Name: docker-registry"
echo "   • Repository: registry:2"
echo "   • Port: ${REGISTRY_PORT}:5000"
echo "   • Volume: /mnt/user/appdata/docker-registry:/var/lib/registry"
echo ""
echo "3. **Démarrer Docker Registry**"
echo "   • Cliquer sur 'Apply' puis 'Done'"
echo "   • Vérifier que le container est 'Started'"
echo ""

# Vérifier la connectivité au registre
echo "🔍 Test de connectivité au registre..."
if curl -f -s "http://${UNRAID_IP}:${REGISTRY_PORT}/v2/" > /dev/null 2>&1; then
    echo "✅ Registre Docker accessible!"
    REGISTRY_READY=true
else
    echo "❌ Registre Docker non accessible"
    echo "💡 Configurez d'abord le registre Docker sur Unraid"
    REGISTRY_READY=false
fi

echo ""

# Étape 2: Build et push de l'image
if [ "$REGISTRY_READY" = true ]; then
    echo "📤 Étape 2: Build et Push de l'image"
    echo "===================================="
    echo ""
    
    # Build de l'image si nécessaire
    if ! docker image inspect "lingelo/ai-town:latest" > /dev/null 2>&1; then
        echo "🔨 Build de l'image AI Town..."
        docker build -f Dockerfile.hub \
            --build-arg VITE_LANGUAGE=fr \
            --build-arg BUILD_VERSION=unraid \
            -t lingelo/ai-town:latest .
        echo "✅ Image construite!"
    else
        echo "✅ Image AI Town déjà disponible"
    fi
    
    # Push vers le registre Unraid
    echo "📤 Push vers le registre Unraid..."
    ./scripts/unraid-registry-push.sh "${UNRAID_IP}" "${REGISTRY_PORT}" "latest"
fi

echo ""

# Étape 3: Template Unraid
echo "📋 Étape 3: Template Unraid"
echo "=========================="
echo ""
echo "🔧 Installation du template:"
echo ""
echo "**Méthode 1: Template URL (Recommandé)**"
echo "1. Docker → Add Container"
echo "2. Template: User Templates → AI-Town"
echo "3. Si pas disponible, dans 'Template repositories' ajouter:"
echo "   https://raw.githubusercontent.com/Lingelo/ai-town/main/unraid/ai-town.xml"
echo ""
echo "**Méthode 2: Installation manuelle**"
echo "1. Copier unraid/ai-town.xml vers:"
echo "   /boot/config/plugins/dockerMan/templates-user/"
echo "2. Redémarrer Docker ou Unraid"
echo ""

if [ "$REGISTRY_READY" = true ]; then
    echo "**Configuration pour registre privé:**"
    echo "• Repository: ${UNRAID_IP}:${REGISTRY_PORT}/ai-town:latest"
else
    echo "**Configuration pour Docker Hub:**"
    echo "• Repository: lingelo/ai-town:latest"
fi

echo ""

# Étape 4: Configuration recommandée
echo "⚙️  Étape 4: Configuration recommandée"
echo "====================================="
echo ""
echo "🔑 Variables d'environnement essentielles:"
echo ""
echo "| Variable | Valeur recommandée | Description |"
echo "|----------|-------------------|-------------|"
echo "| VITE_LANGUAGE | fr | Langue française |"
echo "| LLM_PROVIDER | openrouter | Fournisseur IA |"
echo "| OPENROUTER_API_KEY | sk-or-v1-... | Clé API OpenRouter |"
echo "| OPENROUTER_CHAT_MODEL | anthropic/claude-3.5-sonnet | Modèle IA |"
echo ""
echo "🌐 Ports recommandés:"
echo "• WebUI: 8080:80 (interface web)"
echo ""
echo "📁 Volumes optionnels:"
echo "• Characters: /mnt/user/appdata/ai-town/characters.json"
echo "• Translations: /mnt/user/appdata/ai-town/translations/"
echo ""

# Étape 5: Test et vérification
echo "🧪 Étape 5: Test et vérification"
echo "==============================="
echo ""
echo "Après installation, tester:"
echo ""
echo "1. **Interface web**"
echo "   http://${UNRAID_IP}:8080"
echo ""
echo "2. **Health check**"
echo "   curl -I http://${UNRAID_IP}:8080"
echo ""
echo "3. **Logs du container**"
echo "   Docker → AI-Town → Logs"
echo ""

# Résumé final
echo "📊 Résumé de la configuration"
echo "============================="
echo ""
if [ "$REGISTRY_READY" = true ]; then
    echo "✅ Registre Docker privé: Configuré"
    echo "✅ Image AI Town: Pushée"
else
    echo "⏳ Registre Docker privé: À configurer"
    echo "💡 Image AI Town: Utiliser Docker Hub"
fi
echo "✅ Template Unraid: Disponible"
echo "✅ Documentation: Créée"
echo ""
echo "🎯 Prochaines étapes:"
echo "1. Configurer le registre Docker (si pas fait)"
echo "2. Installer AI Town via template Unraid"
echo "3. Configurer les clés API"
echo "4. Profiter d'AI Town! 🎉"
echo ""
echo "📚 Support:"
echo "• README: unraid/README.md"
echo "• GitHub: https://github.com/Lingelo/ai-town"
echo "• Issues: https://github.com/Lingelo/ai-town/issues"
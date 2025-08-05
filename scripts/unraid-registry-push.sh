#!/bin/bash

# Push AI Town to Unraid Private Docker Registry
# Usage: ./scripts/unraid-registry-push.sh [unraid-ip] [registry-port] [tag]

set -e

# Configuration
UNRAID_IP=${1:-"192.168.1.100"}
REGISTRY_PORT=${2:-"5000"}
TAG=${3:-"latest"}
LOCAL_IMAGE="lingelo/ai-town:${TAG}"
REGISTRY_URL="${UNRAID_IP}:${REGISTRY_PORT}"
REGISTRY_IMAGE="${REGISTRY_URL}/ai-town:${TAG}"

echo "🏠 AI Town - Push vers registre Docker Unraid"
echo "📍 Registre Unraid: ${REGISTRY_URL}"
echo "📦 Image locale: ${LOCAL_IMAGE}"
echo "🎯 Image registre: ${REGISTRY_IMAGE}"
echo ""

# Vérifier que l'image locale existe
if ! docker image inspect "${LOCAL_IMAGE}" > /dev/null 2>&1; then
    echo "❌ Image locale '${LOCAL_IMAGE}' non trouvée!"
    echo "💡 Construire d'abord l'image avec:"
    echo "   docker build -f Dockerfile.hub -t ${LOCAL_IMAGE} ."
    exit 1
fi

# Tester la connectivité au registre Unraid
echo "🔍 Test de connectivité au registre Unraid..."
if ! curl -f -s "http://${REGISTRY_URL}/v2/" > /dev/null 2>&1; then
    echo "❌ Impossible de connecter au registre Unraid!"
    echo ""
    echo "🛠️  Configuration requise sur Unraid:"
    echo "   1. Installer 'Docker Registry' depuis Community Applications"
    echo "   2. Configurer le port ${REGISTRY_PORT}"
    echo "   3. Démarrer le container Registry"
    echo ""
    echo "🔧 Vérifications:"
    echo "   • Registre actif: http://${REGISTRY_URL}/v2/"
    echo "   • Port ${REGISTRY_PORT} ouvert sur Unraid"
    echo "   • Pas de firewall bloquant"
    exit 1
fi

echo "✅ Registre Unraid accessible!"

# Tagger l'image pour le registre Unraid
echo "🏷️  Tag de l'image pour le registre Unraid..."
docker tag "${LOCAL_IMAGE}" "${REGISTRY_IMAGE}"

# Push vers le registre Unraid
echo "📤 Push vers le registre Unraid..."
if docker push "${REGISTRY_IMAGE}"; then
    echo "✅ Image pushée avec succès!"
else
    echo "❌ Échec du push!"
    echo ""
    echo "🛠️  Solutions possibles:"
    echo "   • Vérifier que le registre Unraid accepte les pushs"
    echo "   • Configurer l'authentification si nécessaire"
    echo "   • Vérifier les permissions du registre"
    exit 1
fi

# Vérifier que l'image est disponible dans le registre
echo "🔍 Vérification de la disponibilité..."
if curl -f -s "http://${REGISTRY_URL}/v2/ai-town/tags/list" > /dev/null 2>&1; then
    echo "✅ Image disponible dans le registre!"
else
    echo "⚠️  Attention: Image pushée mais vérification échouée"
fi

echo ""
echo "🎉 Push terminé avec succès!"
echo ""
echo "📋 Informations de l'image:"
echo "   • Registre: ${REGISTRY_URL}"
echo "   • Image: ai-town:${TAG}"
echo "   • Pull: docker pull ${REGISTRY_IMAGE}"
echo ""
echo "🔧 Utilisation dans Unraid:"
echo "   1. Docker → Add Container"
echo "   2. Repository: ${REGISTRY_IMAGE}"
echo "   3. Configurer les ports et variables"
echo ""
echo "📚 Template Unraid disponible:"
echo "   • Fichier: unraid/ai-town.xml"
echo "   • Modifier Repository vers: ${REGISTRY_IMAGE}"

# Nettoyer le tag local du registre
docker rmi "${REGISTRY_IMAGE}" > /dev/null 2>&1 || true

echo "🧹 Nettoyage terminé"
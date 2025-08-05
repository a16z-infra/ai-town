# 🏠 AI Town - Docker Hub

[![Docker Pulls](https://img.shields.io/docker/pulls/lingelo/ai-town)](https://hub.docker.com/r/lingelo/ai-town)
[![Docker Image Size](https://img.shields.io/docker/image-size/lingelo/ai-town)](https://hub.docker.com/r/lingelo/ai-town)
[![GitHub](https://img.shields.io/github/license/Lingelo/ai-town)](https://github.com/Lingelo/ai-town)

Une ville virtuelle où les personnages IA vivent, discutent et socialisent. Image Docker prête à l'emploi avec support multilingue et intégration OpenRouter.

## 🚀 Démarrage rapide

### Utilisation simple (frontend seulement)
```bash
docker run -p 80:80 lingelo/ai-town:latest
```

### Déploiement complet avec backend
```bash
# Télécharger la configuration
curl -o docker-compose.yml https://raw.githubusercontent.com/Lingelo/ai-town/main/docker-compose.hub.yml

# Démarrer tous les services
docker compose up -d
```

### Avec configuration personnalisée
```bash
# Créer un fichier .env
cat > .env << EOF
VITE_LANGUAGE=fr
FRONTEND_PORT=80
PORT=3210
DASHBOARD_PORT=6791
INSTANCE_NAME=my-ai-town
EOF

# Démarrer avec la configuration
docker compose up -d
```

## 🌍 Support multilingue

### Français
```bash
docker run -p 80:80 -e VITE_LANGUAGE=fr lingelo/ai-town:latest
```

### Portugais
```bash
docker run -p 80:80 -e VITE_LANGUAGE=pt lingelo/ai-town:latest
```

### Anglais (défaut)
```bash
docker run -p 80:80 -e VITE_LANGUAGE=en lingelo/ai-town:latest
```

## 🤖 Configuration LLM

Cette image supporte plusieurs providers d'IA :

### OpenRouter (Recommandé)
```bash
# Variables d'environnement pour OpenRouter
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENROUTER_CHAT_MODEL=anthropic/claude-3.5-sonnet
```

### Ollama (Local)
```bash
# Variables d'environnement pour Ollama
OLLAMA_HOST=http://your-ollama-host:11434
OLLAMA_MODEL=llama3.1:latest
```

## 📋 Services inclus

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 80 | Interface web AI Town |
| Backend | 3210 | Serveur Convex |
| Dashboard | 6791 | Interface d'administration |

## 🔧 Configuration avancée

### Variables d'environnement complètes

```bash
# Application
VITE_LANGUAGE=fr                    # Langue (en/fr/pt)
FRONTEND_PORT=80                    # Port frontend
INSTANCE_NAME=my-ai-town           # Nom de l'instance

# Backend Convex
PORT=3210                          # Port backend
SITE_PROXY_PORT=3211              # Port proxy
DASHBOARD_PORT=6791                # Port dashboard

# LLM Provider (choisir un)
LLM_PROVIDER=openrouter            # ou ollama/openai
OPENROUTER_API_KEY=your-key        # Clé OpenRouter
OPENROUTER_CHAT_MODEL=anthropic/claude-3.5-sonnet
```

### Personnages personnalisés

L'image inclut des personnages par défaut (Angelo, Mélanie, Jenna) mais vous pouvez les personnaliser en montant votre propre configuration :

```bash
docker run -p 80:80 \
  -v ./my-characters.json:/usr/share/nginx/html/config/characters.json \
  lingelo/ai-town:latest
```

## 🐳 Docker Compose complet

Téléchargez et utilisez notre configuration prête à l'emploi :

```bash
# Télécharger
wget https://raw.githubusercontent.com/Lingelo/ai-town/main/docker-compose.hub.yml

# Configurer
cp docker-compose.hub.yml docker-compose.yml

# Créer la configuration
cat > .env << EOF
VITE_LANGUAGE=fr
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-key-here
EOF

# Démarrer
docker compose up -d
```

## 📊 Monitoring

### Health Checks
```bash
# Vérifier le statut
docker compose ps

# Logs des services
docker compose logs -f frontend
docker compose logs -f backend
```

### Surveillance des coûts
- OpenRouter : [openrouter.ai/activity](https://openrouter.ai/activity)
- Estimation : ~$0.10-0.50/heure pour 5 personnages actifs

## 🔄 Mise à jour

```bash
# Mettre à jour l'image
docker compose pull frontend

# Redémarrer avec la nouvelle version
docker compose up -d
```

## 🛠️ Dépannage

### Problèmes courants

**Frontend ne se charge pas**
```bash
docker logs ai-town-frontend-1
```

**Backend ne répond pas**
```bash
# Vérifier la santé du backend
docker compose exec backend curl http://localhost:3210/version
```

**Erreurs LLM**
```bash
# Vérifier les variables d'environnement
docker compose exec backend env | grep -E "(OPENROUTER|OLLAMA)"
```

### Reset complet
```bash
# Arrêter et nettoyer
docker compose down -v

# Redémarrer
docker compose up -d
```

## 📚 Documentation

- **Code source** : [github.com/Lingelo/ai-town](https://github.com/Lingelo/ai-town)
- **OpenRouter** : [docs/OPENROUTER.md](https://github.com/Lingelo/ai-town/blob/main/docs/OPENROUTER.md)
- **AI Town original** : [github.com/a16z-infra/ai-town](https://github.com/a16z-infra/ai-town)

## 🤝 Support

- **Issues** : [GitHub Issues](https://github.com/Lingelo/ai-town/issues)
- **Discussions** : [GitHub Discussions](https://github.com/Lingelo/ai-town/discussions)

## 📄 Licence

MIT License - Voir [LICENSE](https://github.com/Lingelo/ai-town/blob/main/LICENSE)
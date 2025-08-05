# 🏠 AI Town - Template Unraid

Template officiel pour installer AI Town sur Unraid via Community Applications.

## 🚀 Installation

### Via Community Applications (Recommandé)

1. **Installer Community Applications** (si pas déjà fait)
   - Aller dans `Apps` → `Install Community Applications`

2. **Ajouter le template personnalisé**
   - Aller dans `Docker` → `Add Container`
   - Dans `Template repositories`, ajouter :
     ```
     https://raw.githubusercontent.com/Lingelo/ai-town/main/unraid/ai-town.xml
     ```

3. **Installer AI Town**
   - Rechercher "AI Town" dans Community Applications
   - Cliquer sur `Install`

### Installation manuelle

1. **Télécharger le template**
   ```bash
   wget https://raw.githubusercontent.com/Lingelo/ai-town/main/unraid/ai-town.xml
   ```

2. **Placer le template** dans :
   ```
   /boot/config/plugins/dockerMan/templates-user/ai-town.xml
   ```

3. **Redémarrer** le service Docker ou redémarrer Unraid

## ⚙️ Configuration

### Paramètres essentiels

| Paramètre | Description | Valeur par défaut |
|-----------|-------------|-------------------|
| **Port WebUI** | Port d'accès à l'interface | `8080` |
| **Language** | Langue de l'interface | `fr` |
| **LLM Provider** | Fournisseur IA | `openrouter` |
| **OpenRouter API Key** | Clé API OpenRouter | _(vide)_ |

### Configuration OpenRouter (Recommandé)

1. **Créer un compte** sur [OpenRouter.ai](https://openrouter.ai/)
2. **Générer une clé API** dans les paramètres
3. **Configurer dans Unraid** :
   - `LLM Provider` : `openrouter`
   - `OpenRouter API Key` : `sk-or-v1-...`
   - `OpenRouter Model` : `anthropic/claude-3.5-sonnet`

### Configuration Ollama (Local)

Pour utiliser un serveur Ollama local ou distant :

1. **Configurer dans Unraid** :
   - `LLM Provider` : `ollama`
   - `Ollama Host` : `http://192.168.1.100:11434`
   - `Ollama Model` : `llama3.1:latest`

## 🌍 Support multilingue

L'application supporte 3 langues :

- **Français** : `VITE_LANGUAGE=fr`
- **Anglais** : `VITE_LANGUAGE=en`  
- **Portugais** : `VITE_LANGUAGE=pt`

## 👨‍👩‍👧 Personnages personnalisés

### Personnages par défaut

- **Angelo** - Père de famille, passionné de technologie
- **Mélanie** - Mère de famille, créative et sociale
- **Jenna** - Fille de 2 ans, curieuse et énergique

### Personnaliser les personnages

1. **Créer un fichier** `characters.json` personnalisé
2. **Mapper le fichier** dans le container :
   ```
   Chemin hôte : /mnt/user/appdata/ai-town/characters.json
   Chemin container : /usr/share/nginx/html/config/characters.json
   ```

### Format du fichier characters.json

```json
{
  "characters": {
    "fr": [
      {
        "name": "MonPersonnage",
        "character": "f1",
        "identity": "Description du personnage...",
        "plan": "Objectifs et motivations..."
      }
    ]
  }
}
```

## 🔧 Configuration avancée

### Variables d'environnement complètes

| Variable | Description | Défaut |
|----------|-------------|--------|
| `VITE_LANGUAGE` | Langue interface (en/fr/pt) | `fr` |
| `VITE_CONVEX_URL` | URL backend Convex | _(auto)_ |
| `LLM_PROVIDER` | Fournisseur LLM | `openrouter` |
| `OPENROUTER_API_KEY` | Clé API OpenRouter | _(vide)_ |
| `OPENROUTER_CHAT_MODEL` | Modèle OpenRouter | `anthropic/claude-3.5-sonnet` |
| `OLLAMA_HOST` | Serveur Ollama | _(vide)_ |
| `OLLAMA_MODEL` | Modèle Ollama | `llama3.1:latest` |
| `OPENAI_API_KEY` | Clé API OpenAI | _(vide)_ |

### Volumes optionnels

| Volume hôte | Volume container | Description |
|-------------|------------------|-------------|
| `/mnt/user/appdata/ai-town/characters.json` | `/usr/share/nginx/html/config/characters.json` | Personnages personnalisés |
| `/mnt/user/appdata/ai-town/translations/` | `/usr/share/nginx/html/config/translations/` | Traductions personnalisées |

## 🏥 Monitoring et santé

### Health Check automatique

Le container inclut un health check automatique :
- **Intervalle** : 30 secondes
- **Timeout** : 3 secondes  
- **Retries** : 3 tentatives

### Vérification manuelle

```bash
# Status du container
docker ps | grep ai-town

# Logs du container
docker logs ai-town

# Test de l'interface web
curl -I http://[IP-UNRAID]:8080
```

## 🛠️ Dépannage

### Problèmes courants

**Container ne démarre pas**
```bash
# Vérifier les logs
docker logs ai-town

# Vérifier la configuration
docker inspect ai-town
```

**Interface web inaccessible**
- Vérifier que le port n'est pas utilisé par une autre application
- Vérifier les règles de firewall d'Unraid
- Tester avec `curl -I http://localhost:8080`

**Erreurs LLM**
- Vérifier la validité de la clé API
- Contrôler la connectivité réseau
- Consulter les logs du container

**Personnages ne se chargent pas**
- Vérifier le format JSON du fichier characters.json
- Contrôler les permissions du fichier
- Vérifier que le volume est correctement monté

### Reset complet

```bash
# Arrêter le container
docker stop ai-town

# Supprimer le container
docker rm ai-town

# Supprimer l'image (optionnel)
docker rmi lingelo/ai-town:latest

# Réinstaller depuis Community Applications
```

## 📊 Estimation des coûts

### OpenRouter (usage modéré)
- **Claude 3.5 Sonnet** : ~$0.10-0.50/heure
- **GPT-4** : ~$0.20-1.00/heure
- **Llama 3.1** : ~$0.05-0.20/heure

### Ollama (local)
- **Coût** : Gratuit (utilise les ressources locales)
- **Consommation** : ~2-8GB RAM selon le modèle

## 🤝 Support et communauté

- **Documentation** : [GitHub AI Town](https://github.com/Lingelo/ai-town)
- **Issues** : [GitHub Issues](https://github.com/Lingelo/ai-town/issues)
- **Forum Unraid** : Rechercher "AI Town"
- **Docker Hub** : [lingelo/ai-town](https://hub.docker.com/r/lingelo/ai-town)

## 📄 Licence

MIT License - Voir [LICENSE](https://github.com/Lingelo/ai-town/blob/main/LICENSE)
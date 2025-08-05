# 🌐 Configuration OpenRouter pour AI Town

OpenRouter vous donne accès à de nombreux modèles d'IA via une seule API : Claude, GPT-4, Llama, Mistral, et bien d'autres !

## 🚀 Avantages d'OpenRouter

- **Accès à plusieurs modèles** : Claude 3.5, GPT-4, Llama, Mistral...
- **API unifiée** : Une seule clé pour tous les modèles
- **Tarification transparente** : Payez ce que vous utilisez
- **Pas besoin de GPU local** : Tout fonctionne dans le cloud

## 📋 Configuration rapide

### 1. Créer un compte OpenRouter
1. Allez sur [openrouter.ai](https://openrouter.ai/)
2. Créez un compte
3. Générez une clé API dans les paramètres

### 2. Configurer AI Town

**Option A : Script automatique**
```bash
./scripts/switch-llm.sh openrouter sk-or-v1-your-api-key-here
```

**Option B : Configuration manuelle**
```bash
# Dans votre fichier .env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
OPENROUTER_CHAT_MODEL=anthropic/claude-3.5-sonnet
```

### 3. Redémarrer
```bash
npm run dev:backend
npx convex run testing:wipeAllTables && npx convex run init
```

## 🤖 Modèles recommandés

### Pour des conversations naturelles excellentes
```bash
OPENROUTER_CHAT_MODEL=anthropic/claude-3.5-sonnet  # ⭐ Recommandé
```

### Pour un bon équilibre performance/coût
```bash
OPENROUTER_CHAT_MODEL=anthropic/claude-3-haiku     # Rapide et moins cher
OPENROUTER_CHAT_MODEL=openai/gpt-4o-mini           # Alternative GPT
```

### Pour les budgets serrés
```bash
OPENROUTER_CHAT_MODEL=meta-llama/llama-3.1-8b-instruct  # Open source
```

### Pour la qualité maximale
```bash
OPENROUTER_CHAT_MODEL=openai/gpt-4o                # Premium
OPENROUTER_CHAT_MODEL=anthropic/claude-3-opus      # Premium (plus lent)
```

## 💰 Estimation des coûts

Pour une famille de 3-5 personnages qui interagissent pendant 1 heure :

- **Claude 3.5 Sonnet** : ~$0.10-0.50
- **Claude 3 Haiku** : ~$0.02-0.10  
- **GPT-4o Mini** : ~$0.01-0.05
- **Llama 3.1 8B** : ~$0.01-0.02

## 🔧 Variables d'environnement complètes

```bash
# Provider
LLM_PROVIDER=openrouter

# Authentification
OPENROUTER_API_KEY=sk-or-v1-your-key

# Modèles
OPENROUTER_CHAT_MODEL=anthropic/claude-3.5-sonnet
OPENROUTER_EMBEDDING_MODEL=text-embedding-ada-002

# Métadonnées (optionnel)
OPENROUTER_REFERER=https://ai-town-family
OPENROUTER_APP_NAME=AI Town Family
```

## 🔄 Basculer entre Ollama et OpenRouter

```bash
# Passer à OpenRouter
./scripts/switch-llm.sh openrouter sk-or-v1-your-key

# Revenir à Ollama
./scripts/switch-llm.sh ollama
```

## 🐛 Dépannage

### Erreur "API key not found"
- Vérifiez que votre clé commence par `sk-or-v1-`
- Vérifiez qu'elle n'est pas expirée sur openrouter.ai

### Erreur "Model not found" 
- Vérifiez le nom du modèle sur [openrouter.ai/models](https://openrouter.ai/models)
- Certains modèles nécessitent des crédits prépayés

### Les personnages ne répondent pas
- Vérifiez les logs avec `npm run dev:backend`
- Redémarrez avec `npx convex run testing:wipeAllTables && npx convex run init`

## 📊 Surveillance

Surveillez votre usage sur [openrouter.ai/activity](https://openrouter.ai/activity) pour contrôler vos coûts.

## 🆘 Support

- [Documentation OpenRouter](https://openrouter.ai/docs)
- [Discord OpenRouter](https://discord.gg/fVyRaUDgxW)
- [Issues AI Town](https://github.com/a16z-infra/ai-town/issues)
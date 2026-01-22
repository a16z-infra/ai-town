# Ollama Setup for AI Town

## Current Status

✅ Ollama is running on `http://127.0.0.1:11434`  
✅ LLM config is already set to Ollama (default)  
⏳ Need to set up Convex backend  
⏳ Need to download models  
⏳ Need to set OLLAMA_HOST environment variable  

## Step-by-Step Setup

### Step 1: Download Required Models

In a new terminal (keep Ollama running in the current one), run:

```bash
ollama pull llama3
ollama pull mxbai-embed-large
```

This will download:
- `llama3` - The chat model for conversations
- `mxbai-embed-large` - The embedding model for memory search

**Note:** These downloads can take several minutes depending on your internet speed.

### Step 2: Set Up Convex Backend

First, initialize Convex:

```bash
cd /Users/8bit/Downloads/ai-town
npx convex dev
```

This will:
- Create a Convex account/login (if needed)
- Generate `convex.json`
- Deploy your functions
- Start the dev server

**Important:** Keep this running in a terminal. It will show you the `VITE_CONVEX_URL` to add to `.env.local`.

### Step 3: Set OLLAMA_HOST Environment Variable

Since you're running Ollama locally (not in Docker), use:

```bash
npx convex env set OLLAMA_HOST http://127.0.0.1:11434
```

**Note:** If you were using Docker, you'd use `http://host.docker.internal:11434`, but since Ollama is running directly on your Mac, use `127.0.0.1:11434`.

### Step 4: Verify Configuration

The LLM configuration is already set correctly:
- `convex/util/llm.ts` line 7: `export const EMBEDDING_DIMENSION = OLLAMA_EMBEDDING_DIMENSION;`
- Default models: `llama3` for chat, `mxbai-embed-large` for embeddings

You can optionally set custom models:

```bash
npx convex env set OLLAMA_MODEL llama3
npx convex env set OLLAMA_EMBEDDING_MODEL mxbai-embed-large
```

### Step 5: Test the Connection

After setting up Convex, you can test the Ollama connection:

```bash
# Test from your terminal
curl http://127.0.0.1:11434/api/tags

# Or test with Ollama CLI
ollama list
```

### Step 6: Initialize the World

Once everything is set up:

```bash
npx convex run init
```

This creates the initial world and agents.

## Troubleshooting

### If Ollama connection fails:

1. **Check Ollama is running:**
   ```bash
   curl http://127.0.0.1:11434
   ```
   Should return: `{"status":"Ollama is running"}`

2. **Check models are downloaded:**
   ```bash
   ollama list
   ```
   Should show `llama3` and `mxbai-embed-large`

3. **If using Docker for Convex backend:**
   - Use `http://host.docker.internal:11434` instead
   - Or use `http://127.0.0.1:11434` if Docker can access host network

### If you see embedding dimension errors:

Make sure `convex/util/llm.ts` line 7 is:
```typescript
export const EMBEDDING_DIMENSION = OLLAMA_EMBEDDING_DIMENSION; // Should be 1024
```

## Quick Reference

**Ollama running locally (your setup):**
```bash
OLLAMA_HOST=http://127.0.0.1:11434
```

**Ollama in Docker:**
```bash
OLLAMA_HOST=http://host.docker.internal:11434
```

**Default models:**
- Chat: `llama3`
- Embeddings: `mxbai-embed-large`

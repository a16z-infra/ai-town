# AI Town Setup Guide - Step by Step

This guide will help you set up AI Town from scratch.

## ✅ Current Status

- ✅ Node.js v25.2.1 installed
- ✅ npm 11.6.2 installed  
- ✅ Dependencies installed (node_modules exists)
- ✅ Convex functions restored from git
- ⏳ Need to set up Convex backend
- ⏳ Need to configure LLM provider

## Prerequisites

- Node.js 18+ (you have v25.2.1 ✓)
- npm (you have 11.6.2 ✓)
- A Convex account (free) OR Docker for self-hosted setup
- An LLM provider (Ollama for local, or OpenAI/Together.ai for cloud)

## Step 1: Verify Dependencies

Dependencies are already installed. The Convex functions have been restored.

## Step 2: Choose Your Setup Method

You have two options:

### Option A: Standard Convex Cloud Setup (Recommended)

This uses Convex's hosted backend (free tier available).

1. **Install Convex CLI globally** (if not already installed):

   ```bash
   npm install -g convex
   ```

2. **Login to Convex**:

   ```bash
   npx convex login
   ```

   This will open a browser to authenticate.

3. **Initialize Convex project**:

   ```bash
   npx convex dev
   ```

   This will:
   - Create a new Convex project (or link to existing)
   - Generate `convex.json` configuration
   - Start the Convex dev server
   - Deploy your functions

4. **Set up environment variables**:
   Create or update `.env.local`:

   ```bash
   # Get this from Convex dashboard after running 'npx convex dev'
   VITE_CONVEX_URL=https://your-deployment.convex.cloud
   ```

### Option B: Docker Compose Setup (Self-hosted)

This runs everything locally without a Convex account.

1. **Start Docker services**:

   ```bash
   docker compose up --build -d
   ```

2. **Generate admin key**:

   ```bash
   docker compose exec backend ./generate_admin_key.sh
   ```

3. **Update `.env.local`**:

   ```bash
   CONVEX_SELF_HOSTED_ADMIN_KEY="<admin-key-from-step-2>"
   CONVEX_SELF_HOSTED_URL="http://127.0.0.1:3210"
   VITE_CONVEX_URL="http://127.0.0.1:3210"
   ```

4. **Initialize Convex backend**:

   ```bash
   npm run predev
   ```

## Step 3: Configure LLM Provider

Choose one of the following:

### Option 1: Ollama (Local, Default)

1. **Install Ollama**:
   - Download from <https://ollama.com/>
   - Or install via: `curl https://ollama.ai/install.sh | sh`

2. **Start Ollama**:

   ```bash
   ollama serve
   ```

3. **Download models**:

   ```bash
   ollama pull llama3
   ollama pull mxbai-embed-large
   ```

4. **Test Ollama**:

   ```bash
   ollama run llama3
   ```

5. **Configure for Docker** (if using Docker):

   ```bash
   npx convex env set OLLAMA_HOST http://host.docker.internal:11434
   ```

### Option 2: OpenAI

1. **Get API key** from <https://platform.openai.com/account/api-keys>

2. **Set environment variable**:

   ```bash
   npx convex env set OPENAI_API_KEY 'your-key-here'
   ```

3. **Update `convex/util/llm.ts`**:
   Change this line:

   ```typescript
   export const EMBEDDING_DIMENSION = OLLAMA_EMBEDDING_DIMENSION;
   ```

   To:

   ```typescript
   export const EMBEDDING_DIMENSION = OPENAI_EMBEDDING_DIMENSION;
   ```

### Option 3: Together.ai

1. **Get API key** from <https://api.together.xyz/settings/api-keys>

2. **Set environment variable**:

   ```bash
   npx convex env set TOGETHER_API_KEY 'your-key-here'
   ```

3. **Update `convex/util/llm.ts`**:
   Change this line:

   ```typescript
   export const EMBEDDING_DIMENSION = OLLAMA_EMBEDDING_DIMENSION;
   ```

   To:

   ```typescript
   export const EMBEDDING_DIMENSION = TOGETHER_EMBEDDING_DIMENSION;
   ```

## Step 4: Initialize the World

After setting up Convex and your LLM:

```bash
npx convex run init
```

This creates the initial world and agents.

## Step 5: Run the Application

### Option A: Run everything together

```bash
npm run dev
```

### Option B: Run frontend and backend separately

Terminal 1:

```bash
npm run dev:backend
```

Terminal 2:

```bash
npm run dev:frontend
```

## Step 6: Access the Application

Open your browser to:

- **Standard setup**: <http://localhost:5173>
- **Docker setup**: <http://localhost:5173>

## Troubleshooting

### If Convex functions are missing

The project structure shows that Convex functions might be missing. You may need to:

1. Check if this is a fresh clone - you might need to pull the full repository
2. Or copy functions from a working example

### If you see "Couldn't find the Convex deployment URL"

Make sure `.env.local` has `VITE_CONVEX_URL` set correctly.

### If Ollama connection fails

- Check Ollama is running: `curl http://localhost:11434`
- For Docker: `docker compose exec backend curl http://host.docker.internal:11434`

### To wipe and start over

```bash
npx convex run testing:wipeAllTables
npx convex run init
```

## Next Steps

- Customize characters in `data/characters.ts`
- Modify the map in `data/gentle.js`
- Adjust agent behavior in `convex/agent/`
- Add background music with Replicate (optional)

## Useful Commands

- **Stop backend**: `npx convex run testing:stop`
- **Resume backend**: `npx convex run testing:resume`
- **Kick engine**: `npx convex run testing:kick`
- **Archive world**: `npx convex run testing:archive`
- **View dashboard**: `npm run dashboard` or visit Convex dashboard online

# AI Town 🏠💻💌

[Live Demo](https://www.convex.dev/ai-town)

[Join our community Discord: AI Stack Devs](https://discord.gg/PQUmTBTGmT)

<img width="1454" alt="Screen Shot 2023-08-14 at 10 01 00 AM" src="https://github.com/a16z-infra/ai-town/assets/3489963/a4c91f17-23ed-47ec-8c4e-9f9a8505057d">

AI Town is a virtual town where AI characters live, chat and socialize.

This project is a deployable starter kit for easily building and customizing your own version of AI
town. Inspired by the research paper
[_Generative Agents: Interactive Simulacra of Human Behavior_](https://arxiv.org/pdf/2304.03442.pdf).

The primary goal of this project, beyond just being a lot of fun to work on, is to provide a
platform with a strong foundation that is meant to be extended. The back-end natively supports
shared global state, transactions, and a simulation engine and should be suitable from everything
from a simple project to play around with to a scalable, multi-player game. A secondary goal is to
make a JS/TS framework available as most simulators in this space (including the original paper
above) are written in Python.

## Overview

- 💻 [Stack](#stack)
- 🧠 [Installation](#installation) (cloud, local, Docker, self-host, Fly.io, ...)
- 💻️ [Windows Pre-requisites](#windows-installation)
- 🤖 [Configure your LLM of choice](#connect-an-llm) (Ollama, OpenAI, Together.ai, ...)
- 👤 [Customize - YOUR OWN simulated world](#customize-your-own-simulation)
- 👩‍💻 [Deploying to production](#deploy-the-app-to-production)
- 🐛 [Troubleshooting](#troubleshooting)

## Stack

- Game engine, database, and vector search: [Convex](https://convex.dev/)
- Auth (Optional): [Clerk](https://clerk.com/)
- Default chat model is `llama3` and embeddings with `mxbai-embed-large`.
- Local inference: [Ollama](https://github.com/jmorganca/ollama)
- Configurable for other cloud LLMs: [Together.ai](https://together.ai/) or anything that speaks the
  [OpenAI API](https://platform.openai.com/). PRs welcome to add more cloud provider support.
- Background Music Generation: [Replicate](https://replicate.com/) using
  [MusicGen](https://huggingface.co/spaces/facebook/MusicGen)

Other credits:

- Pixel Art Generation: [Replicate](https://replicate.com/),
  [Fal.ai](https://serverless.fal.ai/lora)
- All interactions, background music and rendering on the <Game/> component in the project are
  powered by [PixiJS](https://pixijs.com/).
- Tilesheet:
  - https://opengameart.org/content/16x16-game-assets by George Bailey
  - https://opengameart.org/content/16x16-rpg-tileset by hilau
- We used https://github.com/pierpo/phaser3-simple-rpg for the original POC of this project. We have
  since re-wrote the whole app, but appreciated the easy starting point
- Original assets by [ansimuz](https://opengameart.org/content/tiny-rpg-forest)
- The UI is based on original assets by
  [Mounir Tohami](https://mounirtohami.itch.io/pixel-art-gui-elements)

# Installation

The overall steps are:

1. [Build and deploy](#build-and-deploy)
2. [Connect it to an LLM](#connect-an-llm)

## Build and Deploy

There are a few ways to run the app on top of Convex (the backend).

1. The standard Convex setup, where you develop locally or in the cloud. This requires a Convex
   account(free). This is the easiest way to depoy it to the cloud and seriously develop.
2. If you want to try it out without an account and you're okay with Docker, the Docker Compose
   setup is nice and self-contained.
3. There's a community fork of this project offering a one-click install on
   [Pinokio](https://pinokio.computer/item?uri=https://github.com/cocktailpeanutlabs/aitown) for
   anyone interested in running but not modifying it 😎.
4. You can also deploy it to [Fly.io](https://fly.io/). See [./fly](./fly) for instructions.

### Standard Setup

Note, if you're on Windows, see [below](#windows-installation).

```sh
git clone https://github.com/a16z-infra/ai-town.git
cd ai-town
npm install
```

This will require logging into your Convex account, if you haven't already.

To run it:

```sh
npm run dev
```

You can now visit http://localhost:5173.

If you'd rather run the frontend and backend separately (which syncs your backend functions as
they're saved), you can run these in two terminals:

```bash
npm run dev:frontend
npm run dev:backend
```

See [package.json](./package.json) for details.

### Using Docker Compose with self-hosted Convex

You can also run the Convex backend with the self-hosted Docker container. Here we'll set it up to
run the frontend, backend, and dashboard all via docker compose.

```sh
docker compose up --build -d
```

The container will keep running in the background if you pass `-d`. After you've done it once, you
can `stop` and `start` services.

- The frontend will be running on http://localhost:5173.
- The backend will be running on http://localhost:3210 (3211 for the http api).
- The dashboard will be running on http://localhost:6791.

To log into the dashboard and deploy from the convex CLI, you will need to generate an admin key.

```sh
docker compose exec backend ./generate_admin_key.sh
```

Add it to your `.env.local` file. Note: If you run `down` and `up`, you'll have to generate the key
again and update the `.env.local` file.

```sh
# in .env.local
CONVEX_SELF_HOSTED_ADMIN_KEY="<admin-key>" # Ensure there are quotes around it
CONVEX_SELF_HOSTED_URL="http://127.0.0.1:3210"
```

Then set up the Convex backend (one time):

```sh
npm run predev
```

To continuously deploy new code to the backend and print logs:

```sh
npm run dev:backend
```

To see the dashboard, visit `http://localhost:6791` and provide the admin key you generated earlier.

### Configuring Docker for Ollama

If you'll be using Ollama for local inference, you'll need to configure Docker to connect to it.

```sh
npx convex env set OLLAMA_HOST http://host.docker.internal:11434
```

To test the connection (after you [have it running](#ollama-default)):

```sh
docker compose exec backend /bin/bash curl http://host.docker.internal:11434
```

If it says "Ollama is running", it's good! Otherwise, check out the
[Troubleshooting](#troubleshooting) section.

## Connect an LLM

Note: If you want to run the backend in the cloud, you can either use a cloud-based LLM API, like
OpenAI or Together.ai or you can proxy the traffic from the cloud to your local Ollama. See
[below](#using-local-inference-from-a-cloud-deployment) for instructions.

### Ollama (default)

By default, the app tries to use Ollama to run it entirely locally.

1. Download and install [Ollama](https://ollama.com/).
2. Open the app or run `ollama serve` in a terminal. `ollama serve` will warn you if the app is
   already running.
3. Run `ollama pull llama3` to have it download `llama3`.
4. Test it out with `ollama run llama3`.

Ollama model options can be found [here](https://ollama.ai/library).

If you want to customize which model to use, adjust convex/util/llm.ts or set
`npx convex env set OLLAMA_MODEL # model`. If you want to edit the embedding model:

1. Change the `OLLAMA_EMBEDDING_DIMENSION` in `convex/util/llm.ts` and ensure:
   `export const EMBEDDING_DIMENSION = OLLAMA_EMBEDDING_DIMENSION;`
2. Set `npx convex env set OLLAMA_EMBEDDING_MODEL # model`.

Note: You might want to set `NUM_MEMORIES_TO_SEARCH` to `1` in constants.ts, to reduce the size of
conversation prompts, if you see slowness.

### OpenAI

To use OpenAI, you need to:

```ts
// In convex/util/llm.ts change the following line:
export const EMBEDDING_DIMENSION = OPENAI_EMBEDDING_DIMENSION;
```

Set the `OPENAI_API_KEY` environment variable. Visit https://platform.openai.com/account/api-keys if
you don't have one.

```sh
npx convex env set OPENAI_API_KEY 'your-key'
```

Optional: choose models with `OPENAI_CHAT_MODEL` and `OPENAI_EMBEDDING_MODEL`.

### Together.ai

To use Together.ai, you need to:

```ts
// In convex/util/llm.ts change the following line:
export const EMBEDDING_DIMENSION = TOGETHER_EMBEDDING_DIMENSION;
```

Set the `TOGETHER_API_KEY` environment variable. Visit https://api.together.xyz/settings/api-keys if
you don't have one.

```sh
npx convex env set TOGETHER_API_KEY 'your-key'
```

Optional: choose models via `TOGETHER_CHAT_MODEL`, `TOGETHER_EMBEDDING_MODEL`. The embedding model's
dimension must match `EMBEDDING_DIMENSION`.

### Other OpenAI-compatible API

You can use any OpenAI-compatible API, such as Anthropic, Groq, or Azure.

- Change the `EMBEDDING_DIMENSION` in `convex/util/llm.ts` to match the dimension of your embedding
  model.
- Edit `getLLMConfig` in `llm.ts` or set environment variables:

```sh
npx convex env set LLM_API_URL 'your-url'
npx convex env set LLM_API_KEY 'your-key'
npx convex env set LLM_MODEL 'your-chat-model'
npx convex env set LLM_EMBEDDING_MODEL 'your-embedding-model'
```

Note: if `LLM_API_KEY` is not required, don't set it.

### Note on changing the LLM provider or embedding model:

If you change the LLM provider or embedding model, you should delete your data and start over. The
embeddings used for memory are based on the embedding model you choose, and the dimension of the
vector database must match the embedding model's dimension. See
[below](#wiping-the-database-and-starting-over) for how to do that.

## Customize your own simulation

NOTE: every time you change character data, you should re-run `npx convex run testing:wipeAllTables`
and then `npm run dev` to re-upload everything to Convex. This is because character data is sent to
Convex on the initial load. However, beware that `npx convex run testing:wipeAllTables` WILL wipe
all of your data.

1. Create your own characters and stories: All characters and stories, as well as their spritesheet
   references are stored in [characters.ts](./data/characters.ts). You can start by changing
   character descriptions.

2. Updating spritesheets: in `data/characters.ts`, you will see this code:

   ```ts
   export const characters = [
     {
       name: 'f1',
       textureUrl: '/assets/32x32folk.png',
       spritesheetData: f1SpritesheetData,
       speed: 0.1,
     },
     ...
   ];
   ```

   You should find a sprite sheet for your character, and define sprite motion / assets in the
   corresponding file (in the above example, `f1SpritesheetData` was defined in f1.ts)

3. Update the Background (Environment): The map gets loaded in `convex/init.ts` from
   `data/gentle.js`. To update the map, follow these steps:

   - Use [Tiled](https://www.mapeditor.org/) to export tilemaps as a JSON file (2 layers named
     bgtiles and objmap)
   - Use the `convertMap.js` script to convert the JSON to a format that the engine can use.

   ```console
   node data/convertMap.js <mapDataPath> <assetPath> <tilesetpxw> <tilesetpxh>
   ```

   - `<mapDataPath>`: Path to the Tiled JSON file.
   - `<assetPath>`: Path to tileset images.
   - `<tilesetpxw>`: Tileset width in pixels.
   - `<tilesetpxh>`: Tileset height in pixels. Generates `converted-map.js` that you can use like
     `gentle.js`

4. Adding background music with Replicate (Optional)

   For Daily background music generation, create a [Replicate](https://replicate.com/) account and
   create a token in your Profile's [API Token page](https://replicate.com/account/api-tokens).
   `npx convex env set REPLICATE_API_TOKEN # token`

   This only works if you can receive the webhook from Replicate. If it's running in the normal
   Convex cloud, it will work by default. If you're self-hosting, you'll need to configure it to hit
   your app's url on `/http`. If you're using Docker Compose, it will be `http://localhost:3211`,
   but you'll need to proxy the traffic to your local machine.

   **Note**: The simulation will pause after 5 minutes if the window is idle. Loading the page will
   unpause it. You can also manually freeze & unfreeze the world with a button in the UI. If you
   want to run the world without the browser, you can comment-out the "stop inactive worlds" cron in
   `convex/crons.ts`.

   - Change the background music by modifying the prompt in `convex/music.ts`
   - Change how often to generate new music at `convex/crons.ts` by modifying the
     `generate new background music` job

## Commands to run / test / debug

**To stop the back end, in case of too much activity**

This will stop running the engine and agents. You can still run queries and run functions to debug.

```bash
npx convex run testing:stop
```

**To restart the back end after stopping it**

```bash
npx convex run testing:resume
```

**To kick the engine in case the game engine or agents aren't running**

```bash
npx convex run testing:kick
```

**To archive the world**

If you'd like to reset the world and start from scratch, you can archive the current world:

```bash
npx convex run testing:archive
```

Then, you can still look at the world's data in the dashboard, but the engine and agents will no
longer run.

You can then create a fresh world with `init`.

```bash
npx convex run init
```

**To pause your backend deployment**

You can go to the [dashboard](https://dashboard.convex.dev) to your deployment settings to pause and
un-pause your deployment. This will stop all functions, whether invoked from the client, scheduled,
or as a cron job. See this as a last resort, as there are gentler ways of stopping above.

## Windows Installation

### Prerequisites

1. **Windows 10/11 with WSL2 installed**
2. **Internet connection**

Steps:

1. Install WSL2

   First, you need to install WSL2. Follow
   [this guide](https://docs.microsoft.com/en-us/windows/wsl/install) to set up WSL2 on your Windows
   machine. We recommend using Ubuntu as your Linux distribution.

2. Update Packages

   Open your WSL terminal (Ubuntu) and update your packages:

   ```sh
   sudo apt update
   ```

3. Install NVM and Node.js

   NVM (Node Version Manager) helps manage multiple versions of Node.js. Install NVM and Node.js 18
   (the stable version):

   ```sh
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
   export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   source ~/.bashrc
   nvm install 18
   nvm use 18
   ```

4. Install Python and Pip

   Python is required for some dependencies. Install Python and Pip:

   ```sh
   sudo apt-get install python3 python3-pip sudo ln -s /usr/bin/python3 /usr/bin/python
   ```

At this point, you can follow the instructions [above](#installation).

## Deploy the app to production

### Deploy Convex functions to prod environment

Before you can run the app, you will need to make sure the Convex functions are deployed to its
production environment. Note: this is assuming you're using the default Convex cloud product.

1. Run `npx convex deploy` to deploy the convex functions to production
2. Run `npx convex run init --prod`

To transfer your local data to the cloud, you can run `npx convex export` and then import it with
`npx convex import --prod`.

If you have existing data you want to clear, you can run
`npx convex run testing:wipeAllTables --prod`

### Adding Auth (Optional)

You can add clerk auth back in with `git revert b44a436`. Or just look at that diff for what changed
to remove it.

**Make a Clerk account**

- Go to https://dashboard.clerk.com/ and click on "Add Application"
- Name your application and select the sign-in providers you would like to offer users
- Create Application
- Add `VITE_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to `.env.local`

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_***
CLERK_SECRET_KEY=sk_***
```

- Go to JWT Templates and create a new Convex Template.
- Copy the JWKS endpoint URL for use below.

```sh
npx convex env set CLERK_ISSUER_URL # e.g. https://your-issuer-url.clerk.accounts.dev/
```

### Deploy the frontend to Vercel

- Register an account on Vercel and then [install the Vercel CLI](https://vercel.com/docs/cli).
- **If you are using Github Codespaces**: You will need to
  [install the Vercel CLI](https://vercel.com/docs/cli) and authenticate from your codespaces cli by
  running `vercel login`.
- Deploy the app to Vercel with `vercel --prod`.

## Using local inference from a cloud deployment

We support using [Ollama](https://github.com/jmorganca/ollama) for conversation generations. To have
it accessible from the web, you can use Tunnelmole or Ngrok or similar so the cloud backend can send
requests to Ollama running on your local machine.

Steps:

1. Set up either Tunnelmole or Ngrok.
2. Add Ollama endpoint to Convex
   ```sh
   npx convex env set OLLAMA_HOST # your tunnelmole/ngrok unique url from the previous step
   ```
3. Update Ollama domains Ollama has a list of accepted domains. Add the ngrok domain so it won't
   reject traffic. see [ollama.ai](https://ollama.ai) for more details.

### Using Tunnelmole

[Tunnelmole](https://github.com/robbie-cahill/tunnelmole-client) is an open source tunneling tool.

You can install Tunnelmole using one of the following options:

- NPM: `npm install -g tunnelmole`
- Linux: `curl -s https://tunnelmole.com/sh/install-linux.sh | sudo bash`
- Mac:
  `curl -s https://tunnelmole.com/sh/install-mac.sh --output install-mac.sh && sudo bash install-mac.sh`
- Windows: Install with NPM, or if you don't have NodeJS installed, download the `exe` file for
  Windows [here](https://tunnelmole.com/downloads/tmole.exe) and put it somewhere in your PATH.

Once Tunnelmole is installed, run the following command:

```
tmole 11434
```

Tunnelmole should output a unique url once you run this command.

### Using Ngrok

Ngrok is a popular closed source tunneling tool.

- [Install Ngrok](https://ngrok.com/docs/getting-started/)

Once ngrok is installed and authenticated, run the following command:

```
ngrok http http://localhost:11434
```

Ngrok should output a unique url once you run this command.

## Troubleshooting

### Wiping the database and starting over

You can wipe the database by running:

```sh
npx convex run testing:wipeAllTables
```

Then reset with:

```sh
npx convex run init
```

### Incompatible Node.js versions

If you encounter a node version error on the convex server upon application startup, please use node
version 18, which is the most stable. One way to do this is by
[installing nvm](https://nodejs.org/en/download/package-manager) and running `nvm install 18` and
`nvm use 18`.

### Reaching Ollama

If you're having trouble with the backend communicating with Ollama, it depends on your setup how to
debug:

1. If you're running directly on Windows, see
   [Windows Ollama connection issues](#windows-ollama-connection-issues).
2. If you're using **Docker**, see
   [Docker to Ollama connection issues](#docker-to-ollama-connection-issues).
3. If you're running locally, you can try the following:

```sh
npx convex env set OLLAMA_HOST http://localhost:11434
```

By default, the host is set to `http://127.0.0.1:11434`. Some systems prefer `localhost`
¯\_(ツ)\_/¯.

### Windows Ollama connection issues

If the above didn't work after following the [windows](#windows-installation) and regular
[installation](#installation) instructions, you can try the following, assuming you're **not** using
Docker.

If you're using Docker, see the [next section](#docker-to-ollama-connection-issues) for Docker
troubleshooting.

For running directly on Windows, you can try the following:

1. Install `unzip` and `socat`:

   ```sh
   sudo apt install unzip socat
   ```

2. Configure `socat` to Bridge Ports for Ollama

   Run the following command to bridge ports:

   ```sh
   socat TCP-LISTEN:11434,fork TCP:$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):11434 &
   ```

3. Test if it's working:

   ```sh
   curl http://127.0.0.1:11434
   ```

   If it responds OK, the Ollama API should be accessible.

### Docker to Ollama connection issues

If you're having trouble with the backend communicating with Ollama, there's a couple things to
check:

1. Is Docker at least verion 18.03 ? That allows you to use the `host.docker.internal` hostname to
   connect to the host from inside the container.

2. Is Ollama running? You can check this by running `curl http://localhost:11434` from outside the
   container.

3. Is Ollama accessible from inside the container? You can check this by running
   `docker compose exec backend curl http://host.docker.internal:11434`.

If 1 & 2 work, but 3 does not, you can use `socat` to bridge the traffic from inside the container
to Ollama running on the host.

1. Configure `socat` with the host's IP address (not the Docker IP).

   ```sh
   docker compose exec backend /bin/bash
   HOST_IP=YOUR-HOST-IP
   socat TCP-LISTEN:11434,fork TCP:$HOST_IP:11434
   ```

   Keep this running.

2. Then from outside of the container:

   ```sh
   npx convex env set OLLAMA_HOST http://localhost:11434
   ```

3. Test if it's working:

   ```sh
   docker compose exec backend curl http://localhost:11434
   ```

   If it responds OK, the Ollama API is accessible. Otherwise, try changing the previous two to
   `http://127.0.0.1:11434`.

### Launching an Interactive Docker Terminal

If you wan to investigate inside the container, you can launch an interactive Docker terminal, for
the `frontend`, `backend` or `dashboard` service:

```bash
docker compose exec frontend /bin/bash
```

To exit the container, run `exit`.

### Updating the browser list

```bash
docker compose exec frontend npx update-browserslist-db@latest
```

# 🧑‍🏫 What is Convex?

[Convex](https://convex.dev) is a hosted backend platform with a built-in database that lets you
write your [database schema](https://docs.convex.dev/database/schemas) and
[server functions](https://docs.convex.dev/functions) in
[TypeScript](https://docs.convex.dev/typescript). Server-side database
[queries](https://docs.convex.dev/functions/query-functions) automatically
[cache](https://docs.convex.dev/functions/query-functions#caching--reactivity) and
[subscribe](https://docs.convex.dev/client/react#reactivity) to data, powering a
[realtime `useQuery` hook](https://docs.convex.dev/client/react#fetching-data) in our
[React client](https://docs.convex.dev/client/react). There are also clients for
[Python](https://docs.convex.dev/client/python), [Rust](https://docs.convex.dev/client/rust),
[ReactNative](https://docs.convex.dev/client/react-native), and
[Node](https://docs.convex.dev/client/javascript), as well as a straightforward
[HTTP API](https://docs.convex.dev/http-api/).

The database supports [NoSQL-style documents](https://docs.convex.dev/database/document-storage)
with [opt-in schema validation](https://docs.convex.dev/database/schemas),
[relationships](https://docs.convex.dev/database/document-ids) and
[custom indexes](https://docs.convex.dev/database/indexes/) (including on fields in nested objects).

The [`query`](https://docs.convex.dev/functions/query-functions) and
[`mutation`](https://docs.convex.dev/functions/mutation-functions) server functions have
transactional, low latency access to the database and leverage our
[`v8` runtime](https://docs.convex.dev/functions/runtimes) with
[determinism guardrails](https://docs.convex.dev/functions/runtimes#using-randomness-and-time-in-queries-and-mutations)
to provide the strongest ACID guarantees on the market: immediate consistency, serializable
isolation, and automatic conflict resolution via
[optimistic multi-version concurrency control](https://docs.convex.dev/database/advanced/occ) (OCC /
MVCC).

The [`action` server functions](https://docs.convex.dev/functions/actions) have access to external
APIs and enable other side-effects and non-determinism in either our
[optimized `v8` runtime](https://docs.convex.dev/functions/runtimes) or a more
[flexible `node` runtime](https://docs.convex.dev/functions/runtimes#nodejs-runtime).

Functions can run in the background via
[scheduling](https://docs.convex.dev/scheduling/scheduled-functions) and
[cron jobs](https://docs.convex.dev/scheduling/cron-jobs).

Development is cloud-first, with
[hot reloads for server function](https://docs.convex.dev/cli#run-the-convex-dev-server) editing via
the [CLI](https://docs.convex.dev/cli),
[preview deployments](https://docs.convex.dev/production/hosting/preview-deployments),
[logging and exception reporting integrations](https://docs.convex.dev/production/integrations/),
There is a [dashboard UI](https://docs.convex.dev/dashboard) to
[browse and edit data](https://docs.convex.dev/dashboard/deployments/data),
[edit environment variables](https://docs.convex.dev/production/environment-variables),
[view logs](https://docs.convex.dev/dashboard/deployments/logs),
[run server functions](https://docs.convex.dev/dashboard/deployments/functions), and more.

There are built-in features for [reactive pagination](https://docs.convex.dev/database/pagination),
[file storage](https://docs.convex.dev/file-storage),
[reactive text search](https://docs.convex.dev/text-search),
[vector search](https://docs.convex.dev/vector-search),
[https endpoints](https://docs.convex.dev/functions/http-actions) (for webhooks),
[snapshot import/export](https://docs.convex.dev/database/import-export/),
[streaming import/export](https://docs.convex.dev/production/integrations/streaming-import-export),
and [runtime validation](https://docs.convex.dev/database/schemas#validators) for
[function arguments](https://docs.convex.dev/functions/args-validation) and
[database data](https://docs.convex.dev/database/schemas#schema-validation).

Everything scales automatically, and it’s [free to start](https://www.convex.dev/plans).

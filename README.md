# AI Town 🏠💻💌

[Live Demo](https://www.convex.dev/ai-town)

[Join our community Discord: AI Stack Devs](https://discord.gg/PQUmTBTGmT)

<img width="1454" alt="Screen Shot 2023-08-14 at 10 01 00 AM" src="https://github.com/a16z-infra/ai-town/assets/3489963/a4c91f17-23ed-47ec-8c4e-9f9a8505057d">

AI Town is a virtual town where AI characters live, chat and socialize.

This project is a deployable starter kit for easily building and customizing your own version of AI town.
Inspired by the research paper [_Generative Agents: Interactive Simulacra of Human Behavior_](https://arxiv.org/pdf/2304.03442.pdf).

The primary goal of this project, beyond just being a lot of fun to work on,
is to provide a platform with a strong foundation that is meant to be extended.
The back-end natively supports shared global state, transactions, and a simulation engine
and should be suitable from everything from a simple project to play around with to a scalable, multi-player game.
A secondary goal is to make a JS/TS framework available as most simulators in this space
(including the original paper above) are written in Python.

## Overview

- 💻 [Stack](#stack)
- 🧠 [Installation](#installation)
- 🐳 [Docker Installation](#docker-installation)
- 💻️ [Windows Installation](#windows-installation)
- 👤 [Customize - run YOUR OWN simulated world](#customize-your-own-simulation)
- 👩‍💻 [Deploying](#deploy-the-app)
- 🏆 [Credits](#credits)

## Stack

- Game engine, database, and vector search: [Convex](https://convex.dev/)
- Auth (Optional): [Clerk](https://clerk.com/)
- Default chat model is `llama3` and embeddings with `mxbai-embed-large`.
- Local inference: [Ollama](https://github.com/jmorganca/ollama)
- Configurable for other cloud LLMs: [Together.ai](https://together.ai/) or anything
  that speaks the [OpenAI API](https://platform.openai.com/).
  PRs welcome to add more cloud provider support.
- Pixel Art Generation: [Replicate](https://replicate.com/), [Fal.ai](https://serverless.fal.ai/lora)
- Background Music Generation: [Replicate](https://replicate.com/) using [MusicGen](https://huggingface.co/spaces/facebook/MusicGen)

## Installation

**Note**: There is a one-click install of a fork of this project on
[Pinokio](https://pinokio.computer/item?uri=https://github.com/cocktailpeanutlabs/aitown)
for anyone interested in running but not modifying it 😎

### 1. Clone repo and Install packages

```bash
git clone https://github.com/a16z-infra/ai-town.git
cd ai-town
npm install
```

### 2. To develop locally with [Convex](https://convex.dev):

Either
[download a pre-built binary(recommended)](https://github.com/get-convex/convex-backend/releases),
or [build it from source and run it](https://stack.convex.dev/building-the-oss-backend).

```sh
# For new Macs:
curl  -L -O https://github.com/get-convex/convex-backend/releases/latest/download/convex-local-backend-aarch64-apple-darwin.zip
unzip convex-local-backend-aarch64-apple-darwin.zip

brew install just

# Runs the server
./convex-local-backend
```

This also [installs `just`](https://github.com/casey/just?tab=readme-ov-file#installation)
(e.g. `brew install just` or `cargo install just`).
We use `just` like `make` to add extra params, so you run `just convex ...`
instead of `npx convex ...` for local development.

If you're running the pre-built binary on Mac and there's an Apple warning,
go to the folder it's in and right-click it and select "Open" to bypass.
From then on you can run it from the commandline.
Or you can compile it from source and run it (see above).

### 3. To run a local LLM, download and run [Ollama](https://ollama.com/).

You can leave the app running or run `ollama serve`.
`ollama serve` will warn you if the app is already running.
Run `ollama pull llama3` to have it download `llama3`.
Test it out with `ollama run llama3`.
If you want to customize which model to use, adjust convex/util/llm.ts or set
`just convex env set LLM_MODEL # model`.
Ollama model options can be found [here](https://ollama.ai/library).

You might want to set `NUM_MEMORIES_TO_SEARCH` to `1` in constants.ts,
to reduce the size of conversation prompts, if you see slowness.

Check out `convex/config.ts` to configure which models to offer to the UI,
or to set it up to talk to a cloud-hosted LLM.

### 4. Adding background music with Replicate (Optional)

For Daily background music generation, create a
[Replicate](https://replicate.com/) account and create a token in your Profile's
[API Token page](https://replicate.com/account/api-tokens).
`just convex env set REPLICATE_API_TOKEN # token`

### 5. Run the code

To run both the front and and back end:

```bash
npm run dev
```

**Note**: If you encounter a node version error on the convex server upon application startup, please use node version 18, which is the most stable. One way to do this is by [installing nvm](https://nodejs.org/en/download/package-manager) and running `nvm install 18` or `nvm use 18`. Do this before both the `npm run dev` above and the `./convex-local-backend` in Step 2.

You can now visit http://localhost:5173.

If you'd rather run the frontend in a separate terminal from Convex (which syncs
your backend functions as they're saved), you can run these two commands:

```bash
npm run dev:frontend
npm run dev:backend
```

See package.json for details, but dev:backend runs `just convex dev`

**Note**: The simulation will pause after 5 minutes if the window is idle.
Loading the page will unpause it.
You can also manually freeze & unfreeze the world with a button in the UI.
If you want to run the world without the
browser, you can comment-out the "stop inactive worlds" cron in `convex/crons.ts`.

### Various commands to run / test / debug

**To stop the back end, in case of too much activity**

This will stop running the engine and agents. You can still run queries and
run functions to debug.

```bash
just convex run testing:stop
```

**To restart the back end after stopping it**

```bash
just convex run testing:resume
```

**To kick the engine in case the game engine or agents aren't running**

```bash
just convex run testing:kick
```

**To archive the world**

If you'd like to reset the world and start from scratch, you can archive the current world:

```bash
just convex run testing:archive
```

Then, you can still look at the world's data in the dashboard, but the engine and agents will
no longer run.

You can then create a fresh world with `init`.

```bash
just convex run init
```

**To clear all databases**

You can wipe all tables with the `wipeAllTables` testing function.

```bash
just convex run testing:wipeAllTables
```

**To pause your backend deployment**

You can go to the [dashboard](https://dashboard.convex.dev) to your deployment
settings to pause and un-pause your deployment. This will stop all functions, whether invoked
from the client, scheduled, or as a cron job. See this as a last resort, as
there are gentler ways of stopping above. Once you

## Docker Installation

### Before Launching Docker

Modify your `package.json` file to add the `--host` option to your front-end server (Vite):

```json
{
  "name": "ai-town",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "npm-run-all --parallel dev:frontend dev:backend",
    "build": "tsc && vite build",
    "lint": "eslint .",
    "predev": "just convex dev --run init --until-success",
    "dev:backend": "just convex dev --tail-logs",
    "dev:frontend": "vite --host", // <------------------------------------------ modify this line
    "test": "NODE_OPTIONS=--experimental-vm-modules jest --verbose",
    "le": "vite src/editor/"
  }
}
```

### Launching Docker Compose

Run the following command to launch Docker Compose:
```sh
docker-compose up --build
```

Once completed, you can close the terminal.

### Launching an Interactive Docker Terminal

In another terminal, still in the `aitown` directory, launch an interactive Docker terminal:
```bash
docker-compose exec ai-town /bin/bash
```

### Running Locally

1. Download and unzip the local Convex backend:
    ```bash
    curl -L -O https://github.com/get-convex/convex-backend/releases/download/precompiled-2024-06-28-91981ab/convex-local-backend-x86_64-unknown-linux-gnu.zip
    unzip convex-local-backend-x86_64-unknown-linux-gnu.zip
    ```
   
2. Verify the `convex-local-backend` file is in the directory, then remove the zip file:
    ```bash
    rm convex-local-backend-x86_64-unknown-linux-gnu.zip
    ```

3. Make the file executable:
    ```bash
    chmod +x /usr/src/app/convex-local-backend
    ```

4. Launch the Convex backend server:
    ```bash
    ./convex-local-backend
    ```

### Relaunching an Interactive Docker Terminal for aitown server

In another terminal, in the `aitown` directory, relaunch:
```sh
docker-compose exec ai-town /bin/bash
```

### Configuring Socat

Configure `socat` with the host's IP address:

```sh
HOST_IP=YOUR-HOST-IP  # Use your host's IP address (not the Docker IP)
socat TCP-LISTEN:11434,fork TCP:$HOST_IP:11434 &
```

### Testing the Connection

Test the connection:
```bash
curl http://localhost:11434/
```

If it says "Ollama is running", it's good!

### Starting Services

Make sure Convex knows where to find Ollama (to skip a random mysterious bug ...):
```bash
just convex env set OLLAMA_HOST http://localhost:11434
```

Update the browser list:
```bash
npx update-browserslist-db@latest
```

Launch AI Town:
```bash
npm run dev
```

### For relaunching
launch container then 
Simply open two terminal in your AI-town folder with docker-compose exec ai-town /bin/bash

Launch the Convex backend server:
    ```bash
    ./convex-local-backend
    ```
And in the second terminal simply Configuring Socat, Launch AI Town.

## Windows Installation

### Prerequisites

1. **Windows 10/11 with WSL2 installed**
2. **Internet connection**

### 1. Install WSL2

First, you need to install WSL2. Follow [this guide](https://docs.microsoft.com/en-us/windows/wsl/install) to set up WSL2 on your Windows machine. We recommend using Ubuntu as your Linux distribution.

### 2. Update Packages

Open your WSL terminal (Ubuntu) and update your packages:

    sudo apt update

### 3. Install NVM and Node.js

NVM (Node Version Manager) helps manage multiple versions of Node.js. Install NVM and Node.js 18 (the stable version):

    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash
    export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    source ~/.bashrc
    nvm install 18
    nvm use 18

### 4. Install Python and Pip

Python is required for some dependencies. Install Python and Pip:

    sudo apt-get install python3 python3-pip
    sudo ln -s /usr/bin/python3 /usr/bin/python

### 5. Install Additional Tools

Install `unzip` and `socat`:

    sudo apt install unzip socat

### 6. Install Rust and Cargo

Cargo is the Rust package manager. Install Rust and Cargo:

    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
    source $HOME/.cargo/env

### 7. Install `just` with Cargo

`just` is used to run commands. Install it with Cargo:

    cargo install just
    export PATH="$HOME/.cargo/bin:$PATH"
    just --version

### 8. Configure `socat` to Bridge Ports for Ollama

Run the following command to bridge ports, allowing communication between Convex and Ollama:

    socat TCP-LISTEN:11434,fork TCP:$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):11434 &

Test if it's working:

    curl http://127.0.0.1:11434

If it responds OK, the Ollama API is accessible.

### 9. Clone the AI Town Repository

Clone the AI Town repository from GitHub:

    git clone https://github.com/a16z-infra/ai-town.git
    cd ai-town

### 10. Install NPM Packages

Install the necessary npm packages:

    npm install

### 11. Install Precompiled Convex

Download and install the precompiled version of Convex:

    curl -L -O https://github.com/get-convex/convex-backend/releases/download/precompiled-2024-06-28-91981ab/convex-local-backend-x86_64-unknown-linux-gnu.zip
    unzip convex-local-backend-x86_64-unknown-linux-gnu.zip
    rm convex-local-backend-x86_64-unknown-linux-gnu.zip
    chmod +x convex-local-backend

### 12. Launch Convex

In a separate terminal, launch Convex:

    ./convex-local-backend

### 13. Configure Convex to Use Ollama

Set the Ollama host in Convex:

    just convex env set OLLAMA_HOST http://localhost:11434

### 14. Launch AI Town

Finally, launch AI Town:

    npm run dev

Visit `http://localhost:5173` in your browser to see AI Town in action.

### Relaunching AI Town on windows WSL : 

If you need to restart the services:

1. Ensure `socat` is running:

    socat TCP-LISTEN:11434,fork TCP:$(cat /etc/resolv.conf | grep nameserver | awk '{print $2}'):11434 &

2. Launch Convex:

    ./convex-local-backend

In another terminal : 
3. Launch AI Town:

    npm run dev




## Customize your own simulation

NOTE: every time you change character data, you should re-run
`just convex run testing:wipeAllTables` and then
`npm run dev` to re-upload everything to Convex.
This is because character data is sent to Convex on the initial load.
However, beware that `just convex run testing:wipeAllTables` WILL wipe all of your data.

1. Create your own characters and stories: All characters and stories, as well as their spritesheet references are stored in [characters.ts](./data/characters.ts). You can start by changing character descriptions.

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

You should find a sprite sheet for your character, and define sprite motion / assets in the corresponding file (in the above example, `f1SpritesheetData` was defined in f1.ts)

3. Update the Background (Environment): The map gets loaded in `convex/init.ts` from `data/gentle.js`. To update the map, follow these steps:

   - Use [Tiled](https://www.mapeditor.org/) to export tilemaps as a JSON file (2 layers named bgtiles and objmap)
   - Use the `convertMap.js` script to convert the JSON to a format that the engine can use.

```console
node data/convertMap.js <mapDataPath> <assetPath> <tilesetpxw> <tilesetpxh>
```

- `<mapDataPath>`: Path to the Tiled JSON file.
- `<assetPath>`: Path to tileset images.
- `<tilesetpxw>`: Tileset width in pixels.
- `<tilesetpxh>`: Tileset height in pixels.
  Generates `converted-map.js` that you can use like `gentle.js`

4. Change the background music by modifying the prompt in `convex/music.ts`
5. Change how often to generate new music at `convex/crons.ts` by modifying the `generate new background music` job

## Using a cloud AI Provider

Configure `convex/util/llm.ts` or set these env variables:

```sh
just convex env set LLM_API_HOST # url
just convex env set LLM_MODEL # model
```

The embeddings model config needs to be changed [in code](./convex/util/llm.ts),
since you need to specify the embeddings dimension.

### Keys

For Together.ai, visit https://api.together.xyz/settings/api-keys
For OpenAI, visit https://platform.openai.com/account/api-keys

## Using hosted Convex

You can run your Convex backend in the cloud by just running

```sh
npx convex dev --until-success --configure
```

And updating the `package.json` scripts to remove `just`:
change `just convex ...` to `convex ...`.

You'll then need to set any environment variables you had locally in the cloud
environment with `npx convex env set` or on the dashboard:
https://dashboard.convex.dev/deployment/settings/environment-variables

## Deploy the app

### Deploy Convex functions to prod environment

Before you can run the app, you will need to make sure the Convex functions are deployed to its production environment.

1. Run `npx convex deploy` to deploy the convex functions to production
2. Run `npx convex run init --prod`

If you have existing data you want to clear, you can run `npx convex run testing:wipeAllTables --prod`

### Adding Auth (Optional)

You can add clerk auth back in with `git revert b44a436`.
Or just look at that diff for what changed to remove it.

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
just convex env set CLERK_ISSUER_URL # e.g. https://your-issuer-url.clerk.accounts.dev/
```

### Deploy to Vercel

- Register an account on Vercel and then [install the Vercel CLI](https://vercel.com/docs/cli).
- **If you are using Github Codespaces**: You will need to [install the Vercel CLI](https://vercel.com/docs/cli) and authenticate from your codespaces cli by running `vercel login`.
- Deploy the app to Vercel with `vercel --prod`.

## Using local inference from a cloud deployment.

We support using [Ollama](https://github.com/jmorganca/ollama) for conversation generations.
To have it accessible from the web, you can use Tunnelmole or Ngrok or similar.

**Using Tunnelmole**

[Tunnelmole](https://github.com/robbie-cahill/tunnelmole-client) is an open source tunneling tool.

You can install Tunnelmole using one of the following options:

- NPM: `npm install -g tunnelmole`
- Linux: `curl -s https://tunnelmole.com/sh/install-linux.sh | sudo bash`
- Mac: `curl -s https://tunnelmole.com/sh/install-mac.sh --output install-mac.sh && sudo bash install-mac.sh`
- Windows: Install with NPM, or if you don't have NodeJS installed, download the `exe` file for Windows [here](https://tunnelmole.com/downloads/tmole.exe) and put it somewhere in your PATH.

Once Tunnelmole is installed, run the following command:

```
tmole 11434
```

Tunnelmole should output a unique url once you run this command.

**Using Ngrok**

Ngrok is a popular closed source tunneling tool.

- [Install Ngrok](https://ngrok.com/docs/getting-started/)

Once ngrok is installed and authenticated, run the following command:

```
ngrok http http://localhost:11434
```

Ngrok should output a unique url once you run this command.

**Add Ollama endpoint to Convex**

```sh
just convex env set OLLAMA_HOST # your tunnelmole/ngrok unique url from the previous step
```

**Update Ollama domains**

Ollama has a list of accepted domains. Add the ngrok domain so it won't reject
traffic. see ollama.ai for more details.

## Credits

- All interactions, background music and rendering on the <Game/> component in the project are powered by [PixiJS](https://pixijs.com/).
- Tilesheet:
  - https://opengameart.org/content/16x16-game-assets by George Bailey
  - https://opengameart.org/content/16x16-rpg-tileset by hilau
- We used https://github.com/pierpo/phaser3-simple-rpg for the original POC of this project. We have since re-wrote the whole app, but appreciated the easy starting point
- Original assets by [ansimuz](https://opengameart.org/content/tiny-rpg-forest)
- The UI is based on original assets by [Mounir Tohami](https://mounirtohami.itch.io/pixel-art-gui-elements)

# 🧑‍🏫 What is Convex?

[Convex](https://convex.dev) is a hosted backend platform with a
built-in database that lets you write your
[database schema](https://docs.convex.dev/database/schemas) and
[server functions](https://docs.convex.dev/functions) in
[TypeScript](https://docs.convex.dev/typescript). Server-side database
[queries](https://docs.convex.dev/functions/query-functions) automatically
[cache](https://docs.convex.dev/functions/query-functions#caching--reactivity) and
[subscribe](https://docs.convex.dev/client/react#reactivity) to data, powering a
[realtime `useQuery` hook](https://docs.convex.dev/client/react#fetching-data) in our
[React client](https://docs.convex.dev/client/react). There are also clients for
[Python](https://docs.convex.dev/client/python),
[Rust](https://docs.convex.dev/client/rust),
[ReactNative](https://docs.convex.dev/client/react-native), and
[Node](https://docs.convex.dev/client/javascript), as well as a straightforward
[HTTP API](https://docs.convex.dev/http-api/).

The database supports
[NoSQL-style documents](https://docs.convex.dev/database/document-storage) with
[opt-in schema validation](https://docs.convex.dev/database/schemas),
[relationships](https://docs.convex.dev/database/document-ids) and
[custom indexes](https://docs.convex.dev/database/indexes/)
(including on fields in nested objects).

The
[`query`](https://docs.convex.dev/functions/query-functions) and
[`mutation`](https://docs.convex.dev/functions/mutation-functions) server functions have transactional,
low latency access to the database and leverage our
[`v8` runtime](https://docs.convex.dev/functions/runtimes) with
[determinism guardrails](https://docs.convex.dev/functions/runtimes#using-randomness-and-time-in-queries-and-mutations)
to provide the strongest ACID guarantees on the market:
immediate consistency,
serializable isolation, and
automatic conflict resolution via
[optimistic multi-version concurrency control](https://docs.convex.dev/database/advanced/occ) (OCC / MVCC).

The [`action` server functions](https://docs.convex.dev/functions/actions) have
access to external APIs and enable other side-effects and non-determinism in
either our
[optimized `v8` runtime](https://docs.convex.dev/functions/runtimes) or a more
[flexible `node` runtime](https://docs.convex.dev/functions/runtimes#nodejs-runtime).

Functions can run in the background via
[scheduling](https://docs.convex.dev/scheduling/scheduled-functions) and
[cron jobs](https://docs.convex.dev/scheduling/cron-jobs).

Development is cloud-first, with
[hot reloads for server function](https://docs.convex.dev/cli#run-the-convex-dev-server) editing via the
[CLI](https://docs.convex.dev/cli),
[preview deployments](https://docs.convex.dev/production/hosting/preview-deployments),
[logging and exception reporting integrations](https://docs.convex.dev/production/integrations/),
There is a
[dashboard UI](https://docs.convex.dev/dashboard) to
[browse and edit data](https://docs.convex.dev/dashboard/deployments/data),
[edit environment variables](https://docs.convex.dev/production/environment-variables),
[view logs](https://docs.convex.dev/dashboard/deployments/logs),
[run server functions](https://docs.convex.dev/dashboard/deployments/functions), and more.

There are built-in features for
[reactive pagination](https://docs.convex.dev/database/pagination),
[file storage](https://docs.convex.dev/file-storage),
[reactive text search](https://docs.convex.dev/text-search),
[vector search](https://docs.convex.dev/vector-search),
[https endpoints](https://docs.convex.dev/functions/http-actions) (for webhooks),
[snapshot import/export](https://docs.convex.dev/database/import-export/),
[streaming import/export](https://docs.convex.dev/production/integrations/streaming-import-export), and
[runtime validation](https://docs.convex.dev/database/schemas#validators) for
[function arguments](https://docs.convex.dev/functions/args-validation) and
[database data](https://docs.convex.dev/database/schemas#schema-validation).

Everything scales automatically, and it’s [free to start](https://www.convex.dev/plans).

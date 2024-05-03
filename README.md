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

To develop against the cloud-hosted version, change the package.json scripts
to use `convex ...` instead of `just convex ...`.

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
`npx convex env set REPLICATE_API_TOKEN # token`
Specify `just` instead of `npx` if you're doing local development.

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
# Local Convex
just convex env set LLM_API_HOST # url
just convex env set LLM_MODEL # model
# Cloud Convex
npx convex env set LLM_API_HOST # url
npx convex env set LLM_MODEL # model
```

The embeddings model config needs to be changed [in code](./convex/util/llm.ts),
since you need to specify the embeddings dimension.

### Keys

For Together.ai, visit https://api.together.xyz/settings/api-keys
For OpenAI, visit https://platform.openai.com/account/api-keys

## Using hosted Convex

You can run your Convex backend in the cloud by just running

```sh
npx convex dev --once --configure
```

And updating the `package.json` scripts to remove `just`:
change `just convex ...` to `convex ...`.

You'll then need to set any environment variables you had locally in the cloud
environment with `npx convex env set` or on the dashboard:
https://dashboard.convex.dev/deployment/settings/environment-variables

To run commands, use `npx convex ...` where you used to run `just convex ...`.

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
npx convex env set CLERK_ISSUER_URL # e.g. https://your-issuer-url.clerk.accounts.dev/
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
npx convex env set OLLAMA_HOST # your tunnelmole/ngrok unique url from the previous step
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

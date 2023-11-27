# AI Town 🏠💻💌

[Live Demo](https://www.convex.dev/ai-town)

[Join our community Discord: AI Stack Devs](https://discord.gg/PQUmTBTGmT)

<img width="1454" alt="Screen Shot 2023-08-14 at 10 01 00 AM" src="https://github.com/a16z-infra/ai-town/assets/3489963/a4c91f17-23ed-47ec-8c4e-9f9a8505057d">

AI Town is a virtual town where AI characters live, chat and socialize.

This project is a deployable starter kit for easily building and customizing your own version of AI town. Inspired by the research paper [_Generative Agents: Interactive Simulacra of Human Behavior_](https://arxiv.org/pdf/2304.03442.pdf).

The primary goal of this project, beyond just being a lot of fun to work on, is to provide a platform with a strong foundation that is meant to be extended. The back-end natively supports shared global state, transactions, and a simulation engine and should be suitable from everything from
a simple project to play around with to a scalable, multi-player game. A secondary goal is to make a JS/TS framework available as most simulators in this space (including the original paper above) are written in Python.

## Overview

- 💻 [Stack](#stack)
- 🧠 [Installation](#installation)
- 👤 [Customize - run YOUR OWN simulated world](#customize-your-own-simulation)
- 👩‍💻 [Setting up local inference](#setting-up-local-inference)
- 🏆 [Credits](#credits)

## Stack

- Game engine, database, and vector search: [Convex](https://convex.dev/)
- Auth: [Clerk](https://clerk.com/)
- Text model: [OpenAI](https://platform.openai.com/docs/models)
- Deployment: [Vercel](https://vercel.com/)
- Pixel Art Generation: [Replicate](https://replicate.com/), [Fal.ai](https://serverless.fal.ai/lora)
- Background Music Generation: [Replicate](https://replicate.com/) using [MusicGen](https://huggingface.co/spaces/facebook/MusicGen)
- Local inference: [Ollama](https://github.com/jmorganca/ollama)

## Installation

### Clone repo and Install packages

```bash
git clone https://github.com/a16z-infra/ai-town.git
cd ai-town
npm install
npm run dev
```

`npm run dev` will fail asking for environment variables.
Enter them in the environment variables on your Convex dashboard to proceed.
You can get there via `npx convex dashboard` or https://dashboard.convex.dev
See below on how to get the various environment variables.

a. **Set up Clerk**

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

b. **OpenAI API key**

Visit https://platform.openai.com/account/api-keys to get your OpenAI API key and set the
`OPENAI_API_KEY` environment variable in your Convex deployment (see below).

c. **Replicate API key (Optional)**
For Daily background music generation, create a
[Replicate](https://replicate.com/) account and create a token in your Profile's
[API Token page](https://replicate.com/account/api-tokens).
Add the token as `REPLICATE_API_TOKEN` in your Convex environment variables.

d. **Add environment variables to the Convex backend**

Environment variables for a Convex backend is configured through the dashboard:

```bash
npx convex dashboard
```

Go to "settings" and add the following environment variables. `CLERK_ISSUER_URL` should be the URL from the JWKS endpoint.

```bash
OPENAI_API_KEY  sk-*******
CLERK_ISSUER_URL  https://****
REPLICATE_API_TOKEN **** #optional
```

### Run the code

To run both the front and and back end:

```bash
npm run dev
```

You can now visit http://localhost:5173.

If you'd rather run the frontend in a separate terminal from Convex (which syncs
your backend functions as they're saved), you can run these two commands:

```bash
npm run dev:frontend
npm run dev:backend
```

See package.json for details, but dev:backend runs `npx convex dev`

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

Then, you can still look at the world's data in the dashboard, but the engine and agents will
no longer run.

You can then create a fresh world with `init`.

```bash
npx convex run init
```

**To clear all databases**

You can wipe all tables with the `wipeAllTables` testing function.

```bash
npx convex run testing:wipeAllTables
```

**To pause your backend deployment**

You can go to the [dashboard](https://dashboard.convex.dev) to your deployment
settings to pause and un-pause your deployment. This will stop all functions, whether invoked
from the client, scheduled, or as a cron job. See this as a last resort, as
there are gentler ways of stopping above. Once you

### Deploy the app

#### Deploy to Vercel

- Register an account on Vercel and then [install the Vercel CLI](https://vercel.com/docs/cli).
- **If you are using Github Codespaces**: You will need to [install the Vercel CLI](https://vercel.com/docs/cli) and authenticate from your codespaces cli by running `vercel login`.
- Deploy the app to Vercel with `vercel --prod`.

#### Deploy Convex functions to prod environment

Before you can run the app, you will need to make sure the Convex functions are deployed to its production environment.

1. Run `npx convex deploy` to deploy the convex functions to production
2. Run `npx convex run init --prod`

If you have existing data you want to clear, you can run `npx convex run testing:debugClearAll --prod`

## Customize your own simulation

NOTE: every time you change character data, you should re-run
`npx convex run testing:debugClearAll` and then
`npm run dev` to re-upload everything to Convex.
This is because character data is sent to Convex on the initial load.
However, beware that `npx convex run testing:debugClearAll` WILL wipe all of your data.

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

3. Update the background (environment): `data/firstmap.ts` is where the map gets loaded. The easiest way to export a tilemap is by using [Tiled](https://www.mapeditor.org/) -- Tiled exports tilemaps as a CSV and you can convert CSV to a 2d array accepted by firstmap.ts
4. Change the background music by modifying the prompt in `convex/music.ts`
5. Change how often to generate new music at `convex/crons.ts` by modifying the `generate new background music` job

## Setting up local inference

We support using [Ollama](https://github.com/jmorganca/ollama) for conversation generations, but don't yet support using a local model for generating embeddings.

Steps to switch to using Ollama:

1. [Install Ollama](https://github.com/jmorganca/ollama#macos)
   When Ollama runs on your laptop, it by default uses http://localhost:11434 as an endpoint for generation. Next, we need to set up a tunnelmole or ngrok tunnel so Convex can access it:

   **Using Tunnelmole**
   
   [Tunnelmole](https://github.com/robbie-cahill/tunnelmole-client) is an open source tunneling tool.

   You can install Tunnelmole using one of the following options:
   - NPM:  `npm install -g tunnelmole`
   - Linux: `curl -s https://tunnelmole.com/sh/install-linux.sh | sudo bash`
   - Mac:  `curl -s https://tunnelmole.com/sh/install-mac.sh --output install-mac.sh && sudo bash install-mac.sh`
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

3. Add Ollama endpoint to Convex

- run `npx convex dashboard` to bring up the convex dashboard
- Go to Settings > Environment Variables
- Add `OLLAMA_HOST = [your tunnelmole/ngrok unique url from the previous step]`
- You might also want to set:
   `ACTION_TIMEOUT` to `100000` or more, to give your model more time to run.
   `NUM_MEMORIES_TO_SEARCH` to `1`, to reduce the size of conversation prompts.

By default, we use `llama2-7b` model on Ollama. If you want to customize which model to use, you can set `OLLAMA_MODEL` variable under Environment Variables. Ollama model options can be found [here](https://ollama.ai/library).
## Credits

- All interactions, background music and rendering on the <Game/> component in the project are powered by [PixiJS](https://pixijs.com/).
- Tilesheet:
  - https://opengameart.org/content/16x16-game-assets by George Bailey
  - https://opengameart.org/content/16x16-rpg-tileset by hilau
- We used https://github.com/pierpo/phaser3-simple-rpg for the original POC of this project. We have since re-wrote the whole app, but appreciated the easy starting point
- Original assets by [ansimuz](https://opengameart.org/content/tiny-rpg-forest)
- The UI is based on original assets by [Mounir Tohami](https://mounirtohami.itch.io/pixel-art-gui-elements)

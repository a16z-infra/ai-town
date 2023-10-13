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
- 🏆 [Credits](#credits)

## Stack

- Game engine & Database: [Convex](https://convex.dev/)
- VectorDB: Convex or [Pinecone](https://www.pinecone.io/)
- Auth: [Clerk](https://clerk.com/)
- Text model: [OpenAI](https://platform.openai.com/docs/models)
- Deployment: [Vercel](https://vercel.com/)
- Pixel Art Generation: [Replicate](https://replicate.com/), [Fal.ai](https://serverless.fal.ai/lora)
- Background Music Generation: [Replicate](https://replicate.com/) using [MusicGen](https://huggingface.co/spaces/facebook/MusicGen)

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

You can use the default `https://api.openai.com` or a third-party website. (such as: Azure, proxy website, etc.)

To use a custom provider, make sure that the third-party website supports and enables the corresponding model (for example: `gpt-3.5-turbo-16k`, `text-embedding-ada-002`)
In addition to the `OPENAI_API_KEY` environment variable (see below), add `OPENAI_API_BASE=<your-base-url>`

c. **Pinecone API keys (Optional)**

By default it will use the Convex vector storage.
If you plan to store more than 100k vectors, you can use Pinecone.
It will use Pinecone if you set the associated Pinecone environment variables.

d. **Add environment variables to the Convex backend**

d. **Replicate API key (Optional)**
For Daily background music generation, create a
[Replicate](https://replicate.com/) account and create a token in your Profile's
[API Token page](https://replicate.com/account/api-tokens).
Add the token as `REPLICATE_API_TOKEN` in your Convex environment variables.

e. **Add environment variables to the Convex backend**

Environment variables for a Convex backend is configured through the dashboard:

```bash
npx convex dashboard
```

Go to "settings" and add the following environment variables. `CLERK_ISSUER_URL` should be the URL from the JWKS endpoint.

```bash
OPENAI_API_KEY  sk-*******
OPENAI_API_BASE  sk-******* # optional
CLERK_ISSUER_URL  https://****
PINECONE_API_KEY  ******** # optional
PINECONE_ENVIRONMENT us**** # optional
PINECONE_INDEX_NAME  ******** # optional
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
Loading the page will unpause it. If you want to run the world without the
browser, you can comment-out the "stop inactive worlds" cron in `convex/crons.ts`.

### Various commands to run / test / debug

**Note**: you can add `--no-push` to run these commands without first syncing
the functions. If you already have `npm run dev` running, this will be faster.
If you remove it, it'll push up the latest version of code before running the
command.

**To stop the back end, in case of too much activity**

This will stop running the engine and agents. You can still run queries and
run functions to debug.

```bash
npx convex run --no-push init:stop
```

**To restart the back end after stopping it**

```bash
npx convex run init:resume
```

**To kick the engine in case the game engine or agents aren't running**

```bash
npx convex run init:kick
```

**To archive the world**

If you'd like to reset the world and start from scratch, you can archive the current world:

```bash
npx convex run init:archive
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
npx convex run --no-push testing:wipeAllTables
```

**To pause your backend deployment**

You can go to the [dashboard](https://dashboard.convex.dev) to your deployment
settings to pause and un-pause your deployment. This will stop all functions, whether invoked
from the client, scheduled, or as a cron job. See this as a last resort, as
there are gentler ways of stopping above. Once you

### Deploy the app

#### Deploy to Vercel

- Register an account on fly.io and then [install flyctl](https://fly.io/docs/hands-on/install-flyctl/)
- **If you are using Github Codespaces**: You will need to [install flyctl](https://fly.io/docs/hands-on/install-flyctl/) and authenticate from your codespaces cli by running `fly auth login`.

- Run `npx convex deploy` to deploy your dev environment to prod environment. Make sure you copy over all secrets to Convex's prod environment
- Run `fly launch` under project root. This will generate a `fly.toml` that includes all the configurations you will need
- Modify generated `fly.toml` to include `NEXT_PUBLIC_*` during build time for NextJS to access client side.
```
[build]
  [build.args]
    NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
    NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
    NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
    NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_*****"
    NEXT_PUBLIC_CONVEX_URL="https://*******.convex.cloud"
```
- Modify fly.io's generated `Dockerfile` to include new ENV variables right above `RUN npm run build`
```
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CONVEX_URL

# Build application
RUN npm run build
```
- Run `fly deploy --ha=false` to deploy the app. The --ha flag makes sure fly only spins up one instance, which is included in the free plan.
- Run `fly scale memory 512` to scale up the fly vm memory for this app.
- Create a new file `.env.prod` locally and fill in all the production-environment secrets. Remember to update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` by copying secrets from Clerk's production instance -`cat .env.prod | fly secrets import` to upload secrets. Also remember to update `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` -- both of them should now point to Convex's prod environment.

#### Deploy Convex functions to prod environment
Before you can run the app, you will need to make sure the convex functions are deployed to its production environment.

1. Run `npx convex deploy` to deploy the convex functions to production
2. Run `npx convex run init --prod --no-push`

If you have existing data you want to clear, you can run `npx convex run testing:debugClearAll --prod --no-push`

## Customize your own simulation

NOTE: every time you change character data, you should re-run
`npx convex run testing:debugClearAll` and then
`npm run dev` to re-upload everything to Convex.
This is because character data is sent to Convex on the initial load.
However, beware that `npx convex run testing:debugClearAll --no-push` WILL wipe
all of your data, including your vector store.
To edit character data on the fly, you can edit it from the convex Dashboard in
the "memories" table.
Try filtering for "identity" or "relationship" as the type.

NOTE: every time you change character data, you should re-run
`npx convex run testing:debugClearAll` and then
`npm run dev` to re-upload everything to Convex.
This is because character data is sent to Convex on the initial load.
However, beware that `npx convex run testing:debugClearAll --no-push` WILL wipe all of your data.

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

## Credits
- All interactions, background music and rendering on the <Game/> component in the project are powered by [PixiJS](https://pixijs.com/).
- Tilesheet:
  - https://opengameart.org/content/16x16-game-assets by George Bailey
  - https://opengameart.org/content/16x16-rpg-tileset by hilau
- We used https://github.com/pierpo/phaser3-simple-rpg for the original POC of this project. We have since re-wrote the whole app, but appreciated the easy starting point
- Original assets by [ansimuz](https://opengameart.org/content/tiny-rpg-forest)
- The UI is based on original assets by [Mounir Tohami](https://mounirtohami.itch.io/pixel-art-gui-elements)

# AI Town 🏠💻💌

[Live Demo](https://www.convex.dev/ai-town)

[Join our community Discord: AI Stack Devs](https://discord.gg/PQUmTBTGmT)

<img width="1454" alt="Screen Shot 2023-08-14 at 10 01 00 AM" src="https://github.com/a16z-infra/ai-town/assets/3489963/a4c91f17-23ed-47ec-8c4e-9f9a8505057d">

AI Town is a virtual town where AI characters live, chat and socialize.

This project is a deployable starter kit for easily building and customizing your own version of AI town. Inspired by the research paper [_Generative Agents: Interactive Simulacra of Human Behavior_](https://arxiv.org/pdf/2304.03442.pdf).

The primary goal of this project, beyond just being a lot of fun to work on, is to provide a platform with a strong foundation that is meant to be extended. The back-end engine natively supports shared global state, transactions, and a journal of all events so should be suitable for everything from a simple project to play around with to a scalable, multi-player game. A secondary goal is to make a JS/TS framework available as most simulators in this space (including the original paper above) are written in Python.

## Overview

- 💻 [Stack](#stack)
- 🧠 [Installation](#installation)
- 👤 [Customize - run YOUR OWN simulated world](#customize-your-own-simulation)
- 🏆 [Credits](#credits)

## Stack

- Game engine & Database: [Convex](https://convex.dev/)
- VectorDB: [Pinecone](https://www.pinecone.io/)
- Auth: [Clerk](https://clerk.com/)
- Text model: [OpenAI](https://platform.openai.com/docs/models)
- Deployment: [Fly](https://fly.io/)
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

Visit https://platform.openai.com/account/api-keys to get your OpenAI API key if you're using OpenAI for your language model.

c. **Pinecone API keys**

- Create a Pinecone index by visiting https://app.pinecone.io/ and click on "Create Index"
- Give it an index name (this will be the environment variable `PINECONE_INDEX_NAME`)
- Fill in Dimension as `1536`
- Once the index is successfully created, click on "API Keys" on the left side nav and create an API key: copy "Environment" value to `PINECONE_ENVIRONMENT` variable, and "Value" to `PINECONE_API_KEY`

d. **Replicate API key (Optional)**
For Daily background music generation, create an account at [Replicate](https://replicate.com/) and create a token in your Profile's [API Token page](https://replicate.com/account/api-tokens).
Add the token as `REPLICATE_API_TOKEN` in yout `.env.local`

e. **Add secrets to the convex dashboard**

```bash
npx convex dashboard
```

Go to "settings" and add the following environment variables. `CLERK_ISSUER_URL` should be the URL from the JWKS endpoint.

```bash
OPENAI_API_KEY  sk-*******
CLERK_ISSUER_URL  https://****
PINECONE_API_KEY  ********
PINECONE_ENVIRONMENT us****
PINECONE_INDEX_NAME  ********
REPLICATE_API_TOKEN **** #optional
```

### Run the code

To run both the front and and back end:

```bash
npm run dev
```

You can now visit http://localhost:[PORT_NUMBER]

If you'd rather run the frontend in a separate terminal from Convex (which syncs
your backend functions as they're saved), you can run these two commands:

```bash
npm run dev:frontend
npm run dev:backend
```

See package.json for details, but dev:backend runs `npx convex dev`

\*Note: The simulation will pause after 5 minutes if the window is idle.
Loading the page will unpause it. If you want to run the world without the
browser, you can comment-out the heartbeat check in `convex/engine.ts`

### Various commands to run / test / debug

**To add a new world, seed it, and start it running**

**Note**: you can add `--no-push` to run these commands without first syncing
the functions. If you already have `npm run dev` running, this will be faster.
If you remove it, it'll push up the latest version of code before running the
command.

```bash
npx convex run init:reset
```

**To go one iteration at a time, you can create a world with**

```bash
npx convex run --no-push init:resetFrozen

# for each iteration
npx convex run --no-push engine:tick '{"worldId":"<your world id>","noSchedule":true}'
```

**To freeze the back end, in case of too much activity**

```bash
npx convex run --no-push engine:freezeAll

# when ready to rerun (defaults to latest world)
npx convex run --no-push engine:unfreeze
```

**To clear all databases**

Many options:

- Go to the dashboard `npx convex dashboard` and clear tables from there.
- Adjust the variables in [`crons.ts`](./convex/crons.ts) to automatically clear
  up space from old journal and memory entries.
- Run `npx convex run --no-push testing:debugClearAll` to wipe all the tables.
- As a fallback, if things are stuck, you can check out the `origin/reset-town`
  git branch. Doing `npm run dev` from there will clear your schema, stop your
  functions, and allow you to delete your tables in the dashboard.

To delete all vectors from the Pinecone index, you can run:

```
npx convex run --no-push lib/pinecone:deleteAllVectors
```

**NOTE**: If you share this index between dev & prod, or between projects,
it will wipe them all out. You generally don't need to be deleting vectors from
Pinecone, as each query is indexed on the userId, which is unique between worlds
and backend instances.

**To Snoop on messages**

Run the following in a side terminal

```bash
npx convex run testing:listMessages --no-push --watch
```

Or to watch one player's state:

```bash
npx convex run testing:latestPlayer --no-push --watch
```

See more functions in [`testing.ts`](./convex/testing.ts).

### Deploy the app

#### Deploy to Vercel

TODO

#### Deploy Convex functions to prod environment

Before you can run the app, you will need to make sure the convex functions are deployed to its production environment.

1. Run `npx convex deploy` to deploy the convex functions to production
2. Go to convex dashboard, select prod
3. Navigate to Functions on the left side nav, click on testing -> debugClearAll, click on run function on the top right
4. Then click on init - init function, run this function.

## Customize your own simulation

NOTE: every time you change character data, you should re-run `npx convex run testing:debugClearAll --no-push` and then `npm run dev` to re-upload everything to Convex. This is because character data is sent to Convex on the initial load. However, beware that `npx convex run testing:debugClearAll --no-push` WILL wipe all of your data, including your vector store.

1. Create your own characters and stories: All characters and stories, as well as their spritesheet references are stored in [data.ts](./convex/characterdata/data.ts#L4). You can start by changing character descriptions.
2. Updating spritesheets: in `data.ts`, you will see this code:

```export const characters = [
  {
    name: 'f1',
    textureUrl: '/ai-town/assets/32x32folk.png',
    spritesheetData: f1SpritesheetData,
    speed: 0.1,
  },...]
```

You should find a sprite sheet for your character, and define sprite motion / assets in the corresponding file (in the above example, `f1SpritesheetData` was defined in f1.ts)

3. Update the background (environment): `convex/maps/firstmap.ts` is where the map gets loaded. The easiest way to export a tilemap is by using [Tiled](https://www.mapeditor.org/) -- Tiled exports tilemaps as a CSV and you can convert CSV to a 2d array accepted by firstmap.ts
4. Change the background music by modifying the prompt in `convex/lib/replicate.ts`
5. Change how often to generate new music at `convex/crons.ts` by modifying the `generate new background music` job

## Credits

- All interactions, background music and rendering on the <Game/> component in the project are powered by [PixiJS](https://pixijs.com/).
- Tilesheet:
  - https://opengameart.org/content/16x16-game-assets by George Bailey
  - https://opengameart.org/content/16x16-rpg-tileset by hilau
- We used https://github.com/pierpo/phaser3-simple-rpg for the original POC of this project. We have since re-wrote the whole app, but appreciated the easy starting point
- Original assets by [ansimuz](https://opengameart.org/content/tiny-rpg-forest)
- The UI is based on original assets by [Mounir Tohami](https://mounirtohami.itch.io/pixel-art-gui-elements)

# AI Town 🏠🙍👷‍♀️💻💌

## Installation

### Clone repo and Install packages

```bash
git clone https://github.com/a16z-infra/AI-town
cd AI-town
npm install
npx convex dev # select a new project
```

`npx convex dev` will fail asking for OPENAI_API_KEY. ^C out

a. **Set up Clerk**

Go to https://dashboard.clerk.com/ -> "Add Application" -> Fill in Application name/select how your users should sign in -> Create Application

Now you should see both `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` on the screen. Add to .env.local

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_***
CLERK_SECRET_KEY=sk_***
```

Then go to JWT Templates and create a new Convex template. You'll need to copy the JWKS end point URL for use below.

b. **OpenAI API key**

Visit https://platform.openai.com/account/api-keys to get your OpenAI API key if you're using OpenAI for your language model.

e. **Pinecone API keys**

- Create a Pinecone index by visiting https://app.pinecone.io/ and click on "Create Index"
- Give it an index name (this will be the environment variable `PINECONE_INDEX_NAME`)
- Fill in Dimension as `1536`
- Once the index is successfully created, click on "API Keys" on the left side nav and create an API key: copy "Environment" value to `PINECONE_ENVIRONMENT` variable, and "Value" to `PINECONE_API_KEY`

f. **Add secrets to the convex dashboard**

```bash
npx convex dashboard
```

Go to "settings" and add the following environment varables. CLERK_ISSUER_URL should be the URL from the JWKS end point.

```bash
OPENAI_API_KEY  sk-*******
CLERK_ISSUER_URL  https://****
PINECONE_API_KEY  ********
PINECONE_ENVIRONMENT us****
PINECONE_INDEX_NAME  ********
```

### Run the code

To run both the front and and back end:

```bash
npm run dev
```

You can now visit http://localhost:[PORT_NUMBER]

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
npx convex run --no-push engine:unfreeze  # when ready to rerun (defaults to latest world)
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

#### Deploy to fly.io

- Register an account on fly.io and then [install flyctl](https://fly.io/docs/hands-on/install-flyctl/)
- **If you are using Github Codespaces**: You will need to [install flyctl](https://fly.io/docs/hands-on/install-flyctl/) and authenticate from your codespaces cli by running `fly auth login`.

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
- For any other non-localhost environment, the existing Clerk development instance should continue to work. You can upload the secrets to Fly by running `cat .env.local | fly secrets import`
- If you are ready to deploy to production, you should create a prod environment under the [current Clerk instance](https://dashboard.clerk.com/). For more details on deploying a production app with Clerk, check out their documentation [here](https://clerk.com/docs/deployments/overview). **Note that you will likely need to manage your own domain and do domain verification as part of the process.**
- Create a new file `.env.prod` locally and fill in all the production-environment secrets. Remember to update `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` by copying secrets from Clerk's production instance -`cat .env.prod | fly secrets import` to upload secrets.


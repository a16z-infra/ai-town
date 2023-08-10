# AI Town 🏠🙍👷‍♀️💻💌


## Installation

### Clone repo and Install packages

```bash
git clone https://github.com/a16z-infra/AI-town
cd AI-town
npm install
npx convex dev --typecheck=disable # select a new project
```

nox convex dev will fail asking for OPENAI_API_KEY. ^C out

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

e.  **Pinecone API keys**
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
PINECONE_API_KEY  bb****
PINECONE_ENVIRONMENT us****
PINECONE_INDEX_NAME  ********
```

### Run the code

To run both the front and and back end:

```bash
npm run dev
```
You can now visit http://localhost:[PORT_NUMBER]/ai-town

### Various commands to run / test / debug

The following commands will add a new world, seed it, and start it running

**Note**: you can add `--no-push` to run these commands without first syncing
the functions. If you already have `npm run dev` running, this will be faster.
If you remove it, it'll push up the latest version of code before running the
command.

```bash
npx convex run init:reset
```

To go one iteration at a time, you can create a world with

```bash
npx convex run --no-push init:resetFrozen
# for each iteration
npx convex run --no-push engine:tick '{"worldId":"<your world id>","noSchedule":true}'
```

*To freeze the back end, in case of too much activity*

```bash
npx convex run --no-push engine:freezeAll
npx convex run --no-push engine:unfreeze  # when ready to rerun (defaults to latest world)
```

*To clear all databases*

- Go to the dashboard `npx convex dashboard` and clear tables from there.
- Alternatively, if you want to delete the tables, you can check out the
  `origin/reset-town` branch. Doing `npm run dev` from there will clear your
  schema, allowing you to delete your tables entirely.

*To Snoop on messages*

Run the following in a side terminal

```bash
npx convex run testing:listMessages --no-push --watch
```

Or to watch one player's state:

```bash
npx convex run testing:latestPlayer --no-push --watch
```

See more functions in [`testing.ts`](./convex/testing.ts).

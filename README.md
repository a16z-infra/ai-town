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

The following commands will clear the backend, seed it, and start it running

```bash
npx convex run init:reset
npx convex run init:seed
npx convex run engine:tick '{"worldId": "<world ID>"}'
```

*To freeze the back end*

```bash
npx convex run engine:freezeAll 
npx convex run engine:unfreezeAll  # when ready to rerun
```

*To clear all databases*

```bash
npx convex run --no-push init:debugClearAll # clear all tables
```

*To Snoop on messages*

Run the following in a side terminal 

```bash
npx convex run chat:debugListMessages --no-push --watch off on a side terminal
```


# Hosting AI Town on Fly.io

Fly.io makes it easy to deploy containers to the cloud.

## Prerequisites

- Fly.io account: Sign up at [fly.io](https://fly.io)
- Fly.io CLI: `brew install flyctl`
- Hosted LLM: See configuration options in [README.md](../README.md#connect-an-llm).

## Setup

1. Clone the repository:

```sh
git clone https://github.com/ai-town/ai-town.git
```

2. Deploy a Convex backend

   These instructions will use the Convex cloud hosting (free tier available). If you want to
   self-host the Convex backend on Fly.io as well, see [below](#self-hosting-convex-on-flyio).

   ```sh
   npm i
   npx convex deploy
   ```

3. Deploy the AI Town frontend and point it to the Convex backend.

   You can get the convex url from the output of the `npx convex deploy` command. Or you can get it
   from the [Convex dashboard](https://dashboard.convex.dev/deployment/settings) listed as
   "Deployment URL" under "URL & Deploy Key" section. You might have to click "Show deployment
   credentials" to see it.

   ```sh
   fly launch
   fly secrets set VITE_CONVEX_URL=<convex-url>
   ```

   You should now see the frontend app running at the URL provided by `fly launch`. It'll warn you
   about setting the `server.allowedHosts` in `vite.config.ts`. Update that file:

   ```ts
   ...
   plugins: [react()],
   server: {
    allowedHosts: ['your-fly-app-name.fly.dev', 'localhost', '127.0.0.1'],
   },
   ...
   ```

   Then `fly deploy` to redeploy it.

## Self-hosting Convex on Fly.io

If you want to self-host the Convex backend on Fly.io, you can follow these steps:

1. Deploy a self-hosted Convex instance:

   ```sh
   cd fly/backend
   fly launch
   # Say `y` to copy the configuration, and `n` to tweak the settings.
   ```

   Note the Fly URL of the deployed backend. Like
   `https://ai-town-convex-backend-1234567890.fly.dev`.

   Note: you can't scale the backends to more than 1 machine. It is stateful.

2. Set the environment variables `CONVEX_CLOUD_ORIGIN` and `CONVEX_SITE_ORIGIN` for your backend.

   These environment variables are used by the backend so it knows where it is hosted. Inside your
   Convex backend functions, you can access the backend's URL with `process.env.CONVEX_CLOUD_URL`
   for the Convex client API and `process.env.CONVEX_SITE_URL` for the HTTP API.

   ```sh
   fly secrets set CONVEX_CLOUD_ORIGIN="<fly-backend-url>" CONVEX_SITE_ORIGIN="<fly-backend-url>/http"
   ```

   Now your backend knows its base URL so it can generate URLs that point back to itself. This is
   especially useful for libraries registering webhooks and
   [Convex Auth](https://labs.convex.dev/auth) for generating auth callbacks.

3. Generate an admin key.

   ```sh
   fly ssh console --command "./generate_admin_key.sh"
   ```

   Unless you edited the app's `fly.toml`, the name is `ai-town-convex-backend`. If you specified a
   different name, replace `ai-town-convex-backend` with it.

   This admin key will be used to authorize the CLI and access the dashboard.

4. In the root directory of the AI Town repository (`cd ../..`), create a `.env.local` file with the
   following variables:

   ```sh
   CONVEX_SELF_HOSTED_URL="<fly-backend-url>"
   CONVEX_SELF_HOSTED_ADMIN_KEY="<your-admin-key>"
   ```

5. Deploy your Convex functions to the backend using the `convex` CLI from the project root.

   To deploy the AI Town functions to the backend and start the game engine:

   ```sh
   npx convex dev --run init --once
   ```

   To continuously deploy code for development:

   ```sh
   npx convex dev
   ```

6. Deploy the frontend app to Fly.io from the root directory. See [above](#setup) for details.

   ```sh
   fly launch -e VITE_CONVEX_URL=<fly-backend-url>
   ```

7. (Optional) Deploy the Convex dashboard to monitor the self-hosted Convex backend.

   You can either run the dashboard locally and talk to the Fly.io backend, or you can also host the
   backend on Fly.io. In either case, log in with the admin key you generated earlier.

   **Running the dashboard locally:**

   ```sh
   docker run -e 'NEXT_PUBLIC_DEPLOYMENT_URL=<fly-backend-url>' -p '6791:6791' 'ghcr.io/get-convex/convex-dashboard:latest'
   ```

   You should now see the dashboard running at `http://localhost:6791`.

   **Hosting the dashboard on Fly.io:**

   ```sh
   cd fly/dashboard
   fly launch -e NEXT_PUBLIC_DEPLOYMENT_URL=<fly-backend-url>
   fly scale count 1 # You probably don't need more than 1 machine for the dashboard
   ```

   You should now see the dashboard running at the URL provided by `fly launch`.

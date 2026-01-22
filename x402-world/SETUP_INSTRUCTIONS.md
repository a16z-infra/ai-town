# X402 World Setup Instructions

This guide will help you set up and run the X402 World application with Convex backend.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **npm** or **yarn**
3. **Convex account** (free at [convex.dev](https://convex.dev))

## Step 1: Install Dependencies

```bash
cd x402-world
npm install
```

## Step 2: Set Up Convex Backend

### 2.1 Initialize Convex

```bash
npx convex dev
```

This will:

- Create a new Convex project (if you don't have one)
- Generate the `_generated` API files
- Start the Convex development server
- Watch for changes in your `convex/` directory

**Important**: Keep this terminal running! The Convex dev server needs to stay active.

### 2.2 Get Your Convex URL

After running `npx convex dev`, you'll see output like:

```
Convex functions are running!
  Dashboard: https://dashboard.convex.dev
  Deployment: https://your-project.convex.cloud
```

Copy the deployment URL (it looks like `https://xxxxx.convex.cloud`).

### 2.3 Set Environment Variables

Create a `.env.local` file in the `x402-world` directory:

```bash
cd x402-world
touch .env.local
```

Add your Convex URL:

```env
VITE_CONVEX_URL=https://your-project.convex.cloud
```

Replace `https://your-project.convex.cloud` with your actual Convex deployment URL.

### 2.4 Set xAI API Key (Optional but Recommended)

If you want agents to use search capabilities:

```bash
npx convex env set XAI_API_KEY "your-xai-api-key"
```

Get your API key from [x.ai](https://x.ai).

## Step 3: Initialize the World

In a new terminal (keep `npx convex dev` running), run:

```bash
cd x402-world
npx convex run x402World.init:createWorld
```

This creates the default world with agents.

## Step 4: Start the Frontend

In another terminal:

```bash
cd x402-world
npm run dev
```

The app will be available at `http://localhost:5174`

## Step 5: Access the Application

1. Open your browser to `http://localhost:5174`
2. You should see the X402 World interface
3. The RalphTown component will display agents organized by zones

## Using RalphTown Component

The `RalphTown.tsx` component is already integrated. To use it in your app:

### Option 1: Use in App.tsx

Update `src/App.tsx`:

```tsx
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import RalphTown from './components/RalphTown';

export default function App() {
  const worldId = useQuery(api.x402World.publicQueries.getDefaultWorldId);
  
  if (!worldId) {
    return <div>Loading world...</div>;
  }
  
  return <RalphTown worldId={worldId} />;
}
```

### Option 2: Use X402World Component

The `X402World.jsx` component is a standalone visualization. It's already set as the default in `App.tsx`.

## Troubleshooting

### "VITE_CONVEX_URL not set"

Make sure you:

1. Created `.env.local` in the `x402-world` directory
2. Added `VITE_CONVEX_URL=https://your-project.convex.cloud`
3. Restarted the dev server (`npm run dev`)

### "Couldn't find the Convex deployment URL"

1. Check that `npx convex dev` is running
2. Verify your `.env.local` file has the correct URL
3. Make sure the URL starts with `https://` and ends with `.convex.cloud`

### "No world found"

Run the initialization:

```bash
npx convex run x402World.init:createWorld
```

### Agents not showing

1. Check Convex dashboard to see if agents were created
2. Verify the world was initialized correctly
3. Check browser console for errors

## Development Workflow

1. **Backend changes**: Edit files in `convex/` - they auto-reload
2. **Frontend changes**: Edit files in `src/` - Vite hot-reloads
3. **View logs**: Check the terminal running `npx convex dev`
4. **View data**: Use the Convex dashboard at `https://dashboard.convex.dev`

## Project Structure

```
x402-world/
├── convex/              # Backend functions (Convex)
│   ├── x402World/      # X402 World game logic
│   ├── util/           # Utility functions
│   └── _generated/     # Auto-generated API (don't edit)
├── src/                # Frontend (React)
│   ├── components/     # React components
│   │   ├── RalphTown.tsx    # Main visualization
│   │   └── X402World.jsx    # Alternative UI
│   └── App.tsx         # Main app component
├── .env.local          # Environment variables (create this)
└── package.json        # Dependencies
```

## Next Steps

- Customize agents in `convex/x402World/init.ts`
- Add new zones in `convex/constants.ts`
- Modify the UI in `src/components/`
- Add new Convex functions in `convex/x402World/`

## Need Help?

- Check Convex logs: Look at the terminal running `npx convex dev`
- Check browser console: Open DevTools (F12)
- Convex Dashboard: View data and functions at `https://dashboard.convex.dev`
- Convex Docs: <https://docs.convex.dev>

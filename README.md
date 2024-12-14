# AI Town

## Quick Start

### Local Development

```bash
# Start local Convex backend
./convex-local-backend

# In another terminal, start frontend + backend
npm run dev

# Or run them separately
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
```

### Database Commands

```bash
# Stop backend (engine + agents)
just convex run testing:stop

# Resume backend
just convex run testing:resume

# Reset database
just convex run testing:wipeAllTables  # Clear all tables
just convex run init                   # Initialize fresh world
```

### Production Deployment

1. Deploy Convex functions:

```bash
npx convex deploy
npx convex run init --prod
```

2. Deploy to Vercel:

```bash
vercel --prod
```

Optional: Clear production database

```bash
npx convex run testing:wipeAllTables --prod
```

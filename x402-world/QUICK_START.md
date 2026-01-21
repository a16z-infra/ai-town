# X402 World - Quick Start Guide

## 🚀 Quick Setup (3 Steps)

### 1. Start Convex Backend
```bash
cd x402-world
npx convex dev
```
**Keep this terminal running!** You'll see your Convex URL like:
```
Deployment: https://xxxxx.convex.cloud
```

### 2. Set Environment Variable
Create `.env.local` in `x402-world/`:
```env
VITE_CONVEX_URL=https://xxxxx.convex.cloud
```
(Replace with your actual URL from step 1)

### 3. Start Frontend
In a **new terminal**:
```bash
cd x402-world
npm run dev
```

Open `http://localhost:5174` in your browser!

## 📋 Initialize the World

In another terminal:
```bash
cd x402-world
npx convex run x402World.init:createWorld
```

## 🎮 Using the App

The app has two views (toggle buttons in top-right):
- **X402 World**: Full visualization with zones and agents
- **Ralph Town**: Agent-focused view with conversations

## 🔧 Optional: Enable xAI Search

```bash
npx convex env set XAI_API_KEY "your-xai-api-key"
```

## 📁 Project Structure

```
x402-world/
├── convex/              # Backend (Convex functions)
│   └── x402World/       # Game logic
├── src/                 # Frontend (React)
│   └── components/      # UI components
│       ├── RalphTown.tsx    # Agent visualization
│       └── X402World.jsx    # Main UI
└── .env.local          # Your Convex URL (create this)
```

## 🐛 Troubleshooting

**"VITE_CONVEX_URL not set"**
→ Create `.env.local` with your Convex URL

**"No world found"**
→ Run: `npx convex run x402World.init:createWorld`

**Agents not showing**
→ Check Convex dashboard to verify world was created

## 📚 Full Documentation

See `SETUP_INSTRUCTIONS.md` for detailed setup guide.

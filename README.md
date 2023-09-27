# AI Town 🏠💻💌 (Convex fork, Work in Progress!)

This repo is a fork of https://github.com/a16z-infra/ai-town that's undergoing some architectural
changes. We'll be upstreaming our changes in the next few days, but in the meantime, you can
follow along with our progress here.

## Instructions

1. `npx convex dev` to start up a new deployment.
2. Set `OPENAI_API_KEY` and `CLERK_ISSUER_URL` in your dev deployment's environment variables.
3. Open up the game at `http://localhost:5173/ai-town`.
4. Run `init:init` from the dashboard with `{ numAgents: 4 }` to start up the engine with the desired number of agents.

To pause all agents, run `agent/init:debugStopAllAgents` from the dashboard. You can then restart them with
`agent/init:restartAgents`.

To stop the game, first run `debug:clear` until it returns "ok!" and then cancel all scheduled functions in the "Schedules" view in the dashboard.
``


import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

async function main() {
  console.log("Starting stress test...");
  console.log("Target: " + process.env.VITE_CONVEX_URL);

  // Default world ID lookup is handled by the mutation if not provided.
  // We'll spawn 50 agents.
  const AGENT_COUNT = 50;

  console.log(`Spawning ${AGENT_COUNT} agents...`);
  await client.mutation(api.testing.spawnStressTestAgents, { count: AGENT_COUNT });
  
  console.log("Agents spawned. Verification needed via UI or Dashboard.");
}

main().catch(console.error);

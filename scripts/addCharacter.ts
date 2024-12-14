import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

async function addCharacter() {
  const name = process.argv[2] || 'NewCharacter';
  const identity = process.argv[3] || 'A mysterious character who just arrived in town...';
  const plan = process.argv[4] || 'Make new friends and explore the town.';

  // Get a random character sprite from f1-f8
  const characterId = `f${Math.floor(Math.random() * 8) + 1}`;

  console.log('Adding character:', {
    name,
    identity,
    character: characterId,
    plan,
  });

  try {
    // Get the default world status
    const worldStatus = await client.query(api.world.defaultWorldStatus);
    if (!worldStatus) {
      throw new Error('No default world found');
    }

    // Insert the createAgent input
    await client.mutation(api.world.sendWorldInput, {
      engineId: worldStatus.engineId,
      name: 'createAgent',
      args: {
        name,
        character: characterId,
        identity,
        plan,
      },
    });
    console.log('Character creation input sent to world');

    // Wait a bit for the engine to process
    console.log('Waiting for engine to process...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify character was added
    const { agentDescriptions } = await client.query(api.world.gameDescriptions, {
      worldId: worldStatus.worldId,
    });

    console.log('\nCurrent characters in world:');
    for (const agent of agentDescriptions) {
      console.log(`- ${agent.identity}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

addCharacter().catch(console.error);

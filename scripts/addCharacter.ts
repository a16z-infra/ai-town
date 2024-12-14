import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import dotenv from 'dotenv';
import path from 'path';
import { SpritesheetData } from '../data/spritesheets/types';
import fetch from 'node-fetch';

// Add type for unborn character
type UnbornCharacter = {
  id: string;
  name: string;
  identity: string;
  avatarUrl: string;
  isBeingBorn?: boolean;
};

// Add type for API response
type LeaderboardResponse = {
  items: UnbornCharacter[];
  metadata: {
    total: number;
    nextOffset: number | null;
  };
};

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
const client = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

const BACKEND_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'banana_jellybean';

// Helper to generate spritesheet data for a single image
function generateSingleImageSpritesheet(x = 0, y = 0): SpritesheetData {
  // All frames will point to the same 32x32 area
  const frame = {
    frame: { x, y, w: 32, h: 32 },
    sourceSize: { w: 32, h: 32 },
    spriteSourceSize: { x: 0, y: 0 },
  };

  return {
    frames: {
      // All directions use the same frame
      left: frame,
      left2: frame,
      left3: frame,
      right: frame,
      right2: frame,
      right3: frame,
      up: frame,
      up2: frame,
      up3: frame,
      down: frame,
      down2: frame,
      down3: frame,
    },
    meta: {
      scale: '1',
    },
    animations: {
      left: ['left', 'left2', 'left3'],
      right: ['right', 'right2', 'right3'],
      up: ['up', 'up2', 'up3'],
      down: ['down', 'down2', 'down3'],
    },
  };
}

async function verifyImageUrl(url: string): Promise<boolean> {
  console.log('\nVerifying image URL:', url);

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        Accept: 'image/*',
      },
    });

    if (!response.ok) {
      console.error(`HTTP error: ${response.status} ${response.statusText}`);
      return false;
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      console.error('Not an image content type:', contentType);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to verify image URL:', error);
    return false;
  }
}

async function processGeneration() {
  try {
    // 1. Get top unborn characters
    console.log('Fetching unborn characters...');
    const response = await fetch(`${BACKEND_URL}/api/leaderboard/top-unborn`);
    if (!response.ok) throw new Error(`Failed to fetch characters: ${response.statusText}`);
    const { items: characters } = (await response.json()) as LeaderboardResponse;

    if (characters.length === 0) {
      console.log('No characters to process');
      return;
    }

    // Log the full character data to inspect avatarUrls
    console.log('Characters to process:', JSON.stringify(characters, null, 2));

    // Get character IDs
    const characterIds = characters.map((c: UnbornCharacter) => c.id);
    console.log(`Found ${characterIds.length} characters to process`);

    // 2. Mark unborn characters as being born (skip if already being born)
    const unbornCharacters = characters.filter((c: UnbornCharacter) => !c.isBeingBorn);
    if (unbornCharacters.length > 0) {
      const unbornIds = unbornCharacters.map((c: UnbornCharacter) => c.id);
      console.log('Marking characters as being born with payload:', {
        characterIds: unbornIds,
        isBeingBorn: true,
      });

      const markResponse = await fetch(`${BACKEND_URL}/api/generations/born`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          characterIds: unbornIds,
          isBeingBorn: true,
        }),
      });

      if (!markResponse.ok) {
        const errorText = await markResponse.text();
        throw new Error(`Failed to mark as being born (${markResponse.status}): ${errorText}`);
      }

      console.log('Successfully marked characters as being born');
    } else {
      console.log('All characters are already being processed');
    }

    // 3. Process each character
    console.log('\nProcessing characters...');
    const worldStatus = await client.query(api.world.defaultWorldStatus);
    if (!worldStatus) {
      throw new Error('No default world found');
    }

    for (const character of characters) {
      console.log(`\nProcessing character: ${character.name}`);
      console.log(`Avatar URL: ${character.avatarUrl}`);

      // Default texture URL if avatarUrl is missing or invalid
      let textureUrl = '/assets/hugo.png';

      // Only try to use avatarUrl if it exists
      if (character.avatarUrl) {
        const isValid = await verifyImageUrl(character.avatarUrl);
        if (isValid) {
          textureUrl = character.avatarUrl;
          console.log(`Using avatar URL: ${textureUrl}`);
        } else {
          console.log(`Invalid avatar URL, using default texture: ${textureUrl}`);
        }
      } else {
        console.log(`No avatar URL provided, using default texture: ${textureUrl}`);
      }

      // Use the character's avatarUrl and generate a spritesheet for it
      const spritesheet = generateSingleImageSpritesheet();

      console.log('Creating agent with config:', {
        name: character.name,
        textureUrl,
        hasSpritesheetData: !!spritesheet,
      });

      await client.mutation(api.world.sendWorldInput, {
        engineId: worldStatus.engineId,
        name: 'createAgent',
        args: {
          name: character.name,
          character: {
            textureUrl, // Use validated URL
            spritesheetData: spritesheet,
          },
          identity: character.identity,
          plan: 'Make new friends and explore the town.',
        },
      });
      console.log('Character added to world');
    }

    // 4. Mark characters as fully born
    console.log('\nMarking characters as fully born...');
    const bornResponse = await fetch(`${BACKEND_URL}/api/generations/born`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        characterIds,
        isBorn: true,
        bornAt: new Date().toISOString(),
      }),
    });

    if (!bornResponse.ok) {
      const errorText = await bornResponse.text();
      throw new Error(`Failed to mark as fully born (${bornResponse.status}): ${errorText}`);
    }

    console.log('Successfully completed character processing!');
  } catch (error) {
    console.error('Error in processGeneration:', error);
    throw error;
  }
}

async function addCharacter() {
  const name = process.argv[2] || 'NewCharacter';
  const identity = process.argv[3] || 'A mysterious character who just arrived in town...';
  const plan = process.argv[4] || 'Make new friends and explore the town.';

  // Create a default character config
  const spritesheet = generateSingleImageSpritesheet();
  const character = {
    textureUrl: '/assets/hugo.png',
    spritesheetData: spritesheet,
  };

  console.log('Adding character:', {
    name,
    identity,
    character,
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
        character,
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

// Only run processGeneration if this file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args[0] === '--process') {
    processGeneration().catch(console.error);
  } else {
    // Original character creation with remaining args
    addCharacter().catch(console.error);
  }
}

export { processGeneration, addCharacter };

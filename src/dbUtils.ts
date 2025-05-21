import { db } from './db';
import {
  defaultWorldStatus,
  defaultEngines,
  defaultWorlds,
  defaultMaps,
  defaultPlayerDescriptions,
  defaultAgentDescriptions,
  defaultPlayers,       // Import new default data
  defaultAgents,        // Import new default data
  defaultConversations, // Import new default data
} from './data/defaultGameData';

export async function seedInitialDataIfNeeded() {
  try {
    const worldStatusCount = await db.worldStatus.count();
    if (worldStatusCount === 0) {
      console.log('Database is empty. Seeding initial data...');
      await db.transaction(
        'rw',
        // List all tables that will be written to
        db.worldStatus,
        db.engines,
        db.worlds,
        db.maps,
        db.playerDescriptions,
        db.agentDescriptions,
        db.players,           // Add new table to transaction
        db.agents,            // Add new table to transaction
        db.conversations,     // Add new table to transaction
        // Add other db.tableNames here if they are part of the seeding
        async () => {
          await db.worldStatus.bulkAdd(defaultWorldStatus);
          await db.engines.bulkAdd(defaultEngines);
          await db.worlds.bulkAdd(defaultWorlds);
          await db.maps.bulkAdd(defaultMaps);
          await db.playerDescriptions.bulkAdd(defaultPlayerDescriptions);
          await db.agentDescriptions.bulkAdd(defaultAgentDescriptions);
          await db.players.bulkAdd(defaultPlayers);             // Seed new table
          await db.agents.bulkAdd(defaultAgents);               // Seed new table
          await db.conversations.bulkAdd(defaultConversations); // Seed new table
          console.log('Initial data seeded successfully.');
        }
      );
    } else {
      console.log('Database already contains data. Skipping seed.');
    }
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}

import { memoryTables } from './memoryTables';
import { embeddingsCacheTables } from './embeddingsCache';

export const agentTables = {
  ...memoryTables,
  ...embeddingsCacheTables,
};

import { memoryTables } from './memory';
import { embeddingsCacheTables } from './embeddingsCache';

export const agentTables = {
  ...memoryTables,
  ...embeddingsCacheTables,
};

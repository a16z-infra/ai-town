import Redis from 'ioredis';
import { Memory } from '../agent/memory';

const DRAGONFLY_HOST = process.env.DRAGONFLY_HOST ?? 'localhost';
const DRAGONFLY_PORT = process.env.DRAGONFLY_PORT ?? '6379';

const redis = new Redis({
  host: DRAGONFLY_HOST,
  port: parseInt(DRAGONFLY_PORT),
});

const MEMORY_PREFIX = 'memory:';
const PLAYER_MEMORIES_PREFIX = 'player_memories:';

export async function getMemory(memoryId: string): Promise<Memory | null> {
  const memoryJson = await redis.get(`${MEMORY_PREFIX}${memoryId}`);
  if (!memoryJson) {
    return null;
  }
  return JSON.parse(memoryJson);
}

export async function setMemory(memoryId: string, memory: Memory) {
  await redis.set(`${MEMORY_PREFIX}${memoryId}`, JSON.stringify(memory));
  await redis.sadd(`${PLAYER_MEMORIES_PREFIX}${memory.playerId}`, memoryId);
}

export async function getPlayerMemoryIds(playerId: string): Promise<string[]> {
  return redis.smembers(`${PLAYER_MEMORIES_PREFIX}${playerId}`);
}

export async function getPlayerMemories(playerId: string): Promise<Memory[]> {
    const memoryIds = await getPlayerMemoryIds(playerId);
    const memories = await Promise.all(memoryIds.map(getMemory));
    return memories.filter((m) => m !== null) as Memory[];
}

export async function patchMemory(memoryId: string, patch: Partial<Memory>) {
    const memory = await getMemory(memoryId);
    if (memory) {
        const newMemory = { ...memory, ...patch };
        await setMemory(memoryId, newMemory);
    }
}

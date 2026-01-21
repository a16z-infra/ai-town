import { v } from 'convex/values';

const IdShortCodes = { agents: 'a', conversations: 'c', players: 'p', operations: 'o' };
export type IdTypes = keyof typeof IdShortCodes;

export type GameId<T extends IdTypes> = string & { __type: T };

export function parseGameId<T extends IdTypes>(idType: T, gameId: string): GameId<T> {
  const type = gameId[0];
  const match = Object.entries(IdShortCodes).find(([_, value]) => value === type);
  if (!match || match[0] !== idType) {
    throw new Error(`Invalid game ID type: ${type}`);
  }
  const number = parseInt(gameId.slice(2), 10);
  if (isNaN(number) || !Number.isInteger(number) || number < 0) {
    throw new Error(`Invalid game ID number: ${gameId}`);
  }
  return gameId as GameId<T>;
}

export function allocGameId<T extends IdTypes>(idType: T, idNumber: number): GameId<T> {
  const type = IdShortCodes[idType];
  if (!type) {
    throw new Error(`Invalid game ID type: ${idType}`);
  }
  return `${type}:${idNumber}` as GameId<T>;
}

export const conversationId = v.string();
export const playerId = v.string();
export const agentId = v.string();
export const operationId = v.string();

import { v } from 'convex/values';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD IDENTIFIERS
// Type-safe ID system for all entities in X402 World
// ═══════════════════════════════════════════════════════════════════════════════

export type IdTypes =
  | 'agents'
  | 'transactions'
  | 'caravans'
  | 'signals'
  | 'zones'
  | 'services'
  | 'memories';

// Branded type for compile-time safety
export type GameId<T extends IdTypes> = string & { __brand: T };

// ID Validators
export const agentId = v.string();
export const transactionId = v.string();
export const caravanId = v.string();
export const signalId = v.string();
export const zoneId = v.string();
export const serviceId = v.string();
export const memoryId = v.string();

// ID Prefixes for easy identification
const ID_PREFIXES: Record<IdTypes, string> = {
  agents: 'ag',
  transactions: 'tx',
  caravans: 'cv',
  signals: 'sg',
  zones: 'zn',
  services: 'sv',
  memories: 'mm',
};

// Allocate a new GameId
export function allocGameId<T extends IdTypes>(idType: T, nextId: number): GameId<T> {
  const prefix = ID_PREFIXES[idType];
  return `${prefix}:${nextId.toString(36).padStart(6, '0')}` as GameId<T>;
}

// Parse and validate an existing ID
export function parseGameId<T extends IdTypes>(idType: T, id: string): GameId<T> {
  const prefix = ID_PREFIXES[idType];
  if (!id.startsWith(`${prefix}:`)) {
    throw new Error(`Invalid ${idType} ID: ${id}. Expected prefix '${prefix}:'`);
  }
  return id as GameId<T>;
}

// Check if a string is a valid GameId of a given type
export function isValidGameId<T extends IdTypes>(idType: T, id: string): id is GameId<T> {
  const prefix = ID_PREFIXES[idType];
  return id.startsWith(`${prefix}:`);
}

// Extract the numeric part of an ID
export function getIdNumber(id: string): number {
  const parts = id.split(':');
  if (parts.length !== 2) {
    throw new Error(`Invalid ID format: ${id}`);
  }
  return parseInt(parts[1], 36);
}

// Solana-specific ID utilities
export const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidSolanaAddress(address: string): boolean {
  return SOLANA_ADDRESS_REGEX.test(address);
}

export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// Transaction signature utilities
export function isValidSignature(signature: string): boolean {
  // Solana signatures are base58 encoded, typically 88 characters
  return signature.length >= 80 && signature.length <= 90;
}

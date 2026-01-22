// x402-world/convex/schema.ts
import { defineSchema } from 'convex/server';
import { x402WorldTables } from './x402World/schema';
import { engineTables } from './engine/schema';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD MAIN SCHEMA
// Exports all tables for the X402 World Convex backend
// ═══════════════════════════════════════════════════════════════════════════════

export default defineSchema({
  ...x402WorldTables,
  ...engineTables,
});

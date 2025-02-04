import { defineSchema, defineTable, v } from "convex/schema";

export default defineSchema({
  agents: defineTable({
    name: v.string(),
    character: v.string(),
    identity: v.string(),
    plan: v.string(),
    createdAt: v.number(),
  }),
  selectedAgents: defineTable({
    agentIds: v.array(v.id("agents")),
    createdAt: v.number(),
  }),
});
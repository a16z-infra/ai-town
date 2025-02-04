// mutations.ts
import { mutation } from "../_generated/server";
import { MutationCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { insertInput } from "../aiTown/insertInput";

export const createAgent = mutation({
 handler: async (ctx: MutationCtx, args: { 
   name: string; 
   character: string; 
   identity: string; 
   plan: string 
 }) => {
   return await ctx.db.insert("agents", {
     name: args.name,
     character: args.character,
     identity: args.identity,
     plan: args.plan,
     createdAt: Date.now(),
   });
 },
});

export const updateAgent = mutation({
 handler: async (ctx: MutationCtx, args: {
   id: Id<"agents">;
   name: string;
   character: string;
   identity: string;
   plan: string;
 }) => {
   await ctx.db.patch(args.id, {
     name: args.name,
     character: args.character,
     identity: args.identity,
     plan: args.plan,
   });
 },
});

export const deleteAgent = mutation({
 handler: async (ctx: MutationCtx, args: { id: Id<"agents"> }) => {
   await ctx.db.delete(args.id);
 },
});

export const selectAgentForWorld = mutation({
 handler: async (ctx: MutationCtx, args: { agentIds: Id<"agents">[] }) => {
   return await ctx.db.insert("selectedAgents", {
     agentIds: args.agentIds,
     createdAt: Date.now(),
   });
 },
});

export const removeAgentFromWorld = mutation({
 handler: async (ctx: MutationCtx, args: { agentId: Id<"agents"> }) => {
   const selected = await ctx.db.query("selectedAgents").order("desc").first();
   if (!selected) return;

   const updatedAgents = selected.agentIds.filter(id => id !== args.agentId);
   await ctx.db.insert("selectedAgents", { 
     agentIds: updatedAgents, 
     createdAt: Date.now() 
   });
 },
});

// //事件逻辑

// export const createAgentInput = mutation({
//     args: {
//       //default world 么办咧？
//     //   worldId: v.id("worlds"), 以后前端传，现在不管
//       name: v.string(),
//       character: v.string(),
//       identity: v.string(),
//       plan: v.string(),
//     },

//     handler: async (ctx, args) => {
//         const { name, character, identity, plan } = args;
    
//         // 1) 在数据库里查找 "默认世界" (isDefault = true)
//         const worldStatus = await ctx.db
//           .query("worldStatus")
//           .filter((q) => q.eq(q.field("isDefault"), true))
//           .first();
    
//         if (!worldStatus) {
//           throw new Error("No default world found! Please ensure one is set as isDefault.");
//         }
    
//         const worldId = worldStatus.worldId;
    
//         // 2) 调用 insertInput，让 AI Town 引擎收到 `createAgent` 事件
//         //    directDescription 中携带前端提供的 Agent 
//         await insertInput(ctx, worldId, "createAgent", {
//           directDescription: {
//             name,
//             character,
//             identity,
//             plan,
//           },
//         });
    
//         console.log(
//           `Inserted createAgent input into default world ${worldId.id} with { name: ${name}, character: ${character}, identity: ${identity}, plan: ${plan} }`
//         );
//       },
//     });






//多世界

    // handler: async (ctx, args) => {
    // //   const { worldId, name, character, identity, plan } = args;
    // const { name, character, identity, plan } = args;

    //   await insertInput(ctx, worldId, "createAgent", {

    //     directDescription: {
    //       name,
    //       character,
    //       identity,
    //       plan,
    //     },
    //   });



  
//       console.log(
//         `Inserted "createAgent" input for world ${worldId} with directDescription = ${JSON.stringify(
//           { name, character, identity, plan }
//         )}`
//       );
//     },
//   });
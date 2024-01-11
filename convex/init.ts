import { v } from 'convex/values';
import { internal } from './_generated/api';
import { DatabaseReader, MutationCtx, mutation } from './_generated/server';
import { Descriptions } from '../data/characters';
import * as map from '../data/gentle';
import { insertInput } from './aiTown/insertInput';
import { Id } from './_generated/dataModel';
import { createEngine, stopRunningEngine } from './aiTown/main';
import { ENGINE_ACTION_DURATION } from './constants';

const REFERENCE_DOC =
  'The Supreme Court on Friday agreed to decide whether former President Donald J. Trump is ineligible for Colorado’s Republican primary ballot because he had engaged in insurrection in his efforts to overturn the 2020 election. The case, which could alter the course of this year’s presidential election, will be argued on Feb. 8. The court will probably decide it quickly, as the primary season will soon be underway. Mr. Trump asked the Supreme Court to intervene after Colorado’s top court disqualified him from the ballot last month. That decision is on hold while the justices consider the matter. The case turns on the meaning of Section 3 of the 14th Amendment, ratified after the Civil War, which bars those who had taken an oath “to support the Constitution of the United States” from holding office if they then “shall have engaged in insurrection or rebellion against the same, or given aid or comfort to the enemies thereof.” Congress can remove the prohibition, the provision says, but only by a two-thirds vote in each chamber. Though Section 3 addressed the aftermath of the Civil War, it was written in general terms and, most scholars say, continues to have force. Congress granted broad amnesties in 1872 and 1898. But those acts were retrospective, scholars say, and did not limit the provision’s prospective force. Trump at the Supreme Court Adam Liptak Adam Liptak Reporting from Washington The country’s top court will have at least three opportunities to weigh in on former President Donald J. Trump’s legal troubles. Here is an overview of the cases → Kent Nishimura for The New York Times The Supreme Court in December. Outside the Supreme Court in Washington. Item 1 of 8 A Colorado trial judge ruled that Mr. Trump had engaged in insurrection but accepted his argument that Section 3 did not apply to him, reasoning that Mr. Trump had not sworn the right kind of oath and that the provision did not apply to the office of the presidency. Tracking Efforts to Remove Trump From the 2024 Ballot See which states have challenges seeking to bar Donald J. Trump from the presidential primary ballot. The Colorado Supreme Court affirmed the first part of the ruling — that Mr. Trump had engaged in an insurrection, including by setting out to overturn the result of the 2020 presidential election; trying to alter vote counts; encouraging bogus slates of competing electors; pressuring the vice president to violate the Constitution; and calling for the march on the Capitol. But the majority reversed the part of the decision that said Section 3 did not apply to the presidency. “President Trump asks us to hold,” the majority wrote in an unsigned opinion, “that Section 3 disqualifies every oath-breaking insurrectionist except the most powerful one and that it bars oath breakers from virtually every office, both state and federal, except the highest one in the land. Both results are inconsistent with the plain language and history of Section 3.” The state Supreme Court addressed several other issues. Congress does not need to act before courts may disqualify candidates, it said. Mr. Trump’s eligibility is not the sort of political question that is outside the competence of courts. The House’s Jan. 6 report was properly admitted into evidence. Mr. Trump’s speech that day was not protected by the First Amendment. The court added that states are authorized under the Constitution to assess the qualifications of presidential candidates. “Were we to adopt President Trump’s view,” the majority wrote, “Colorado could not exclude from the ballot even candidates who plainly do not satisfy the age, residency and citizenship requirements” of the Constitution. An election official in Maine last month adopted much of the Colorado Supreme Court’s reasoning in barring Mr. Trump from the primary ballot there. He has appealed that ruling to a state court in Maine.';

const init = mutation({
  args: {
    newWorld: v.optional(v.boolean()),
    numAgents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!process.env.OPENAI_API_KEY) {
      const deploymentName = process.env.CONVEX_CLOUD_URL?.slice(8).replace('.convex.cloud', '');
      throw new Error(
        '\n  Missing OPENAI_API_KEY in environment variables.\n\n' +
          '  Get one at https://openai.com/\n\n' +
          '  Paste it on the Convex dashboard:\n' +
          '  https://dashboard.convex.dev/d/' +
          deploymentName +
          '/settings?var=OPENAI_API_KEY',
      );
    }
    // Stop running engine before creating new world
    if (args.newWorld) {
      await stopRunningEngine(ctx);
    }
    const { worldStatus, engine } = await getOrCreateDefaultWorld(ctx, args);
    if (worldStatus.status !== 'running') {
      console.warn(
        `Engine ${engine._id} is not active! Run "npx convex run testing:resume" to restart it.`,
      );
      return;
    }

    const shouldCreate = await shouldCreateAgents(
      ctx.db,
      worldStatus.worldId,
      worldStatus.engineId,
    );
    if (shouldCreate) {
      const toCreate = args.numAgents !== undefined ? args.numAgents : Descriptions.length;
      console.warn(`Init: Creating ${toCreate} agents`);
      for (let i = 0; i < toCreate; i++) {
        await insertInput(ctx, worldStatus.worldId, 'createAgent', {
          descriptionIndex: i % Descriptions.length,
        });
      }
    }
  },
});
export default init;

async function getOrCreateDefaultWorld(
  ctx: MutationCtx,
  args: {
    newWorld?: boolean;
  },
) {
  const now = Date.now();

  let worldStatus = await ctx.db
    .query('worldStatus')
    .filter((q) => q.eq(q.field('isDefault'), true))
    .unique();

  if (args.newWorld && worldStatus) {
    await ctx.db.patch(worldStatus._id, {
      isDefault: false,
    });
  } else {
    if (worldStatus) {
      const engine = (await ctx.db.get(worldStatus.engineId))!;
      return { worldStatus, engine };
    }
  }

  const engineId = await createEngine(ctx);
  const engine = (await ctx.db.get(engineId))!;
  const worldId = await ctx.db.insert('worlds', {
    nextId: 0,
    agents: [],
    conversations: [],
    players: [],
  });
  const worldStatusId = await ctx.db.insert('worldStatus', {
    engineId: engineId,
    isDefault: true,
    lastViewed: now,
    status: 'stoppedByDeveloper',
    worldId: worldId,
    scenarioInProgress: false,
  });
  worldStatus = (await ctx.db.get(worldStatusId))!;

  await ctx.db.insert('maps', {
    worldId,
    width: map.mapwidth,
    height: map.mapheight,
    tileSetUrl: map.tilesetpath,
    tileSetDimX: map.tilesetpxw,
    tileSetDimY: map.tilesetpxh,
    tileDim: map.tiledim,
    bgTiles: map.bgtiles,
    objectTiles: map.objmap,
    animatedSprites: map.animatedsprites,
  });
  await ctx.scheduler.runAfter(0, internal.aiTown.main.runStep, {
    worldId,
    generationNumber: engine.generationNumber,
    maxDuration: ENGINE_ACTION_DURATION,
  });
  return { worldStatus, engine };
}

export const createScenario = mutation({
  args: {
    type: v.optional(v.string()),
    topic: v.string(),
    source: v.string(),
    numAgents: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.warn(`CREATE SCENARIO`);
    console.log(`args: ${JSON.stringify(args)}`);
    if (!process.env.OPENAI_API_KEY) {
      const deploymentName = process.env.CONVEX_CLOUD_URL?.slice(8).replace('.convex.cloud', '');
      throw new Error(
        '\n  Missing OPENAI_API_KEY in environment variables.\n\n' +
          '  Get one at https://openai.com/\n\n' +
          '  Paste it on the Convex dashboard:\n' +
          '  https://dashboard.convex.dev/d/' +
          deploymentName +
          '/settings?var=OPENAI_API_KEY',
      );
    }
    // Stop running engine before creating new world
    await stopRunningEngine(ctx);

    const now = Date.now();

    let worldStatus = await ctx.db
      .query('worldStatus')
      .filter((q) => q.eq(q.field('isDefault'), true))
      .unique();

    if (worldStatus) {
      await ctx.db.patch(worldStatus._id, {
        isDefault: false,
      });
    }

    const engineId = await createEngine(ctx);
    const engine = (await ctx.db.get(engineId))!;
    const worldId = await ctx.db.insert('worlds', {
      nextId: 0,
      agents: [],
      conversations: [],
      players: [],
    });
    const worldStatusId = await ctx.db.insert('worldStatus', {
      engineId: engineId,
      isDefault: true,
      lastViewed: now,
      status: 'running',
      worldId: worldId,
      scenarioInProgress: true,
    });
    worldStatus = (await ctx.db.get(worldStatusId))!;
    //TODO: evaluate if this is needed
    const scenarioId = await ctx.db.insert('scenarios', {
      worldId: worldId,
      type: 'debate',
      description: 'A debate between multiple agents',
      settings: {
        rounds: 3,
        topic: args.topic,
        reference: args.source,
      },
    });
    await ctx.db.insert('maps', {
      worldId,
      width: map.mapwidth,
      height: map.mapheight,
      tileSetUrl: map.tilesetpath,
      tileSetDimX: map.tilesetpxw,
      tileSetDimY: map.tilesetpxh,
      tileDim: map.tiledim,
      bgTiles: map.bgtiles,
      objectTiles: map.objmap,
      animatedSprites: map.animatedsprites,
    });
    await ctx.scheduler.runAfter(0, internal.aiTown.main.runStep, {
      worldId,
      generationNumber: engine.generationNumber,
      maxDuration: ENGINE_ACTION_DURATION,
    });

    //const { worldStatus, engine } = await getOrCreateDefaultWorld(ctx, args);
    if (worldStatus.status !== 'running') {
      console.warn(
        `Engine ${engine._id} is not active! Run "npx convex run testing:resume" to restart it.`,
      );
      return;
    }

    const shouldCreate = await shouldCreateAgents(
      ctx.db,
      worldStatus.worldId,
      worldStatus.engineId,
    );
    if (shouldCreate) {
      const toCreate = args.numAgents !== undefined ? args.numAgents : Descriptions.length;
      console.warn(`CreateScenario: Creating ${toCreate} agents`);
      console.warn(`WORLDID: ${worldStatus.worldId}`);
      for (let i = 0; i < toCreate; i++) {
        await insertInput(ctx, worldStatus.worldId, 'createAgent', {
          descriptionIndex: i % Descriptions.length,
        });
      }
    }
  },
});

async function shouldCreateAgents(
  db: DatabaseReader,
  worldId: Id<'worlds'>,
  engineId: Id<'engines'>,
) {
  const world = await db.get(worldId);
  if (!world) {
    throw new Error(`Invalid world ID: ${worldId}`);
  }
  if (world.agents.length > 0) {
    return false;
  }
  const unactionedJoinInputs = await db
    .query('inputs')
    .withIndex('byInputNumber', (q) => q.eq('engineId', engineId))
    .order('asc')
    .filter((q) => q.eq(q.field('name'), 'createAgent'))
    .filter((q) => q.eq(q.field('returnValue'), undefined))
    .collect();
  if (unactionedJoinInputs.length > 0) {
    return false;
  }
  return true;
}

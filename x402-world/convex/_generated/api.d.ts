/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiTown_agent from "../aiTown/agent.js";
import type * as aiTown_conversation from "../aiTown/conversation.js";
import type * as aiTown_memory from "../aiTown/memory.js";
import type * as aiTown_simulation from "../aiTown/simulation.js";
import type * as constants from "../constants.js";
import type * as engine_abstractGame from "../engine/abstractGame.js";
import type * as engine_historicalObject from "../engine/historicalObject.js";
import type * as util_FastIntegerCompression from "../util/FastIntegerCompression.js";
import type * as util_compression from "../util/compression.js";
import type * as util_object from "../util/object.js";
import type * as util_x402VoiceTools from "../util/x402VoiceTools.js";
import type * as util_xaiSearch from "../util/xaiSearch.js";
import type * as util_xaiStructured from "../util/xaiStructured.js";
import type * as util_xaiVision from "../util/xaiVision.js";
import type * as util_xaiVoice from "../util/xaiVoice.js";
import type * as util_xxhash from "../util/xxhash.js";
import type * as x402World_agent from "../x402World/agent.js";
import type * as x402World_agentDescription from "../x402World/agentDescription.js";
import type * as x402World_agentOperations from "../x402World/agentOperations.js";
import type * as x402World_game from "../x402World/game.js";
import type * as x402World_ids from "../x402World/ids.js";
import type * as x402World_init from "../x402World/init.js";
import type * as x402World_publicQueries from "../x402World/publicQueries.js";
import type * as x402World_transaction from "../x402World/transaction.js";
import type * as x402World_voiceOperations from "../x402World/voiceOperations.js";
import type * as x402World_world from "../x402World/world.js";
import type * as x402World_worldMap from "../x402World/worldMap.js";
import type * as x402World_x402Protocol from "../x402World/x402Protocol.js";
import type * as x402World_xaiExamples from "../x402World/xaiExamples.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "aiTown/agent": typeof aiTown_agent;
  "aiTown/conversation": typeof aiTown_conversation;
  "aiTown/memory": typeof aiTown_memory;
  "aiTown/simulation": typeof aiTown_simulation;
  constants: typeof constants;
  "engine/abstractGame": typeof engine_abstractGame;
  "engine/historicalObject": typeof engine_historicalObject;
  "util/FastIntegerCompression": typeof util_FastIntegerCompression;
  "util/compression": typeof util_compression;
  "util/object": typeof util_object;
  "util/x402VoiceTools": typeof util_x402VoiceTools;
  "util/xaiSearch": typeof util_xaiSearch;
  "util/xaiStructured": typeof util_xaiStructured;
  "util/xaiVision": typeof util_xaiVision;
  "util/xaiVoice": typeof util_xaiVoice;
  "util/xxhash": typeof util_xxhash;
  "x402World/agent": typeof x402World_agent;
  "x402World/agentDescription": typeof x402World_agentDescription;
  "x402World/agentOperations": typeof x402World_agentOperations;
  "x402World/game": typeof x402World_game;
  "x402World/ids": typeof x402World_ids;
  "x402World/init": typeof x402World_init;
  "x402World/publicQueries": typeof x402World_publicQueries;
  "x402World/transaction": typeof x402World_transaction;
  "x402World/voiceOperations": typeof x402World_voiceOperations;
  "x402World/world": typeof x402World_world;
  "x402World/worldMap": typeof x402World_worldMap;
  "x402World/x402Protocol": typeof x402World_x402Protocol;
  "x402World/xaiExamples": typeof x402World_xaiExamples;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

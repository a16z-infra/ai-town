# Architecture

This documents dives into the high-level architecture of AI Town and its different layers. We'll
first start with a brief overview and then go in-depth on each component. The overview should
be sufficient for forking AI Town and changing game or agent behavior. Read on to the deep dives
if you're interested or running up against the engine's limitations.

This doc assumes the reader has a working knowledge of Convex. If you're new to Convex, check out
the [Convex tutorial](https://docs.convex.dev/get-started) to get started.

## Overview

AI Town is split into a few layers:

- The server-side game logic in `convex/aiTown`: This layer defines what state AI Town maintains,
  how it evolves over time, and how it reacts to user input. Both humans and agents submit inputs
  that the game engine processes.
- The client-side game UI in `src/`: AI Town uses `pixi-react` to render the game state to the
  browser for human consumption.
- The game engine in `convex/engine`: To make it easy to hack on the game rules, we've separated
  out the game engine from the AI Town-specific game rules. The game engine is responsible for
  saving and loading game state from the database, coordinating feeding inputs into the engine,
  and actually running the game engine in Convex functions.
- The agent in `convex/agent`: Agents run as part of the game loop, and can kick off asynchronous
  Convex functions to do longer processing, such as talking to LLMs. Those functions can save state
  in separate tables, or submit inputs to the game engine to modify game state. Internally, our
  agents use a combination of simple rule-based systems and talking to an LLM.

So, if you'd like to tweak agent behavior but keep the same game mechanics, check out `convex/agent`
for the async work, and `convex/aiTown/agent.ts` for the game loop logic.
If you would like to add new gameplay elements (that both humans and agents can interact with), add
the feature to `convex/aiTown`, render it in the UI in `src/`, and respond to it in `convex/aiTown/agent.ts`.

If you have parts of your game that are more latency sensitive, you can move them out of engine
into regular Convex tables, queries, and mutations, only logging key bits into game state. See
"Message data model" below for an example.

## AI Town game logic (`convex/aiTown`)

### Data model

AI Town's data model has a few concepts:

- Worlds (`convex/aiTown/world.ts`) represent a map with many players interacting together.
- Players (`convex/aiTown/player.ts`) are the core characters in the game. Players have human readable names and
  descriptions, and they may be associated with a human user. At any point in time, a player may be pathfinding
  towards some destination and has a current location.
- Conversations (`convex/aiTown/conversations.ts`) are created by a player and end at some point in time.
- Conversation memberships (`convex/aiTown/conversationMembership.ts`) indicate that a player is a member
  of a conversation. Players may only be in one conversation at any point in time, and conversations
  currently have exactly two members. Memberships may be in one of three states:
  - `invited`: The player has been invited to the conversation but hasn't accepted yet.
  - `walkingOver`: The player has accepted the invite to the conversation but is too far away to talk. The
    player will automatically join the conversation when they get close enough.
  - `participating`: The player is actively participating in the conversation.

### Schema

There are three main categories of tables:

1. Engine tables (`convex/engine/schema.ts`) for maintaining engine-internal state.
2. Game tables (`convex/aiTown/schema.ts`) for game state. To keep game state small and efficient to
   read and write, we store AI Town's data model across a few tables. See `convex/aiTown/schema.ts` for an overview.
3. Agent tables (`convex/agent/schema.ts`) for agent state. Agents can freely read and write to these tables
   within their actions.

### Inputs (`convex/aiTown/inputs.ts`)

AI Town modifies its data model by processing inputs. Inputs are submitted by players and agents and
processed by the game engine. We specify inputs in the `inputs` object in `convex/aiTown/inputs.ts`.
Use the `inputHandler` function to construct an input handler, specifying a Convex validator for
arguments for end-to-end type-safety.

- Joining (`join`) and leaving (`leave`) the game.
- Moving a player to a particular location (`moveTo`): Movement in AI Town is similar to RTS games, where
  the players specify where they want to go, and the engine figures out how to get there.
- Starting a conversation (`startConversation`), accepting an invite (`acceptInvite`), rejecting an invite
  (`rejectInvite`), and leaving a conversation (`leaveConversation`). To track typing indicators,
  you use `startTyping` and `finishSendingMessage`. These are imported from `game/conversations.ts`.
- Agent inputs are imported from `aiTown/agentInputs.ts` for things like remembering conversations,
  deciding what to do, etc.

Each of these inputs' implementation method checks invariants and updates game state as desired.
For example, the `moveTo` input checks that the player isn't participating in a conversation,
throwing an error telling them to leave the conversation first if so, and then updates their
pathfinding state with the desired destination.

### Simulation

Other than when processing player inputs, the game state can change over time in the background as the
simulation runs time forward. For example, if a player has decided to move along a path, their position
will gradually update as time moves forward. Similarly, if two players collide into each other, they'll
notice and replan their paths, trying to avoid obstacles.

### Message data model

We manage the tables for tracking chat messages in separate tables not affiliated
with the game engine. This is for a few reasons:

- The core simulation doesn't need to know about messages, so keeping them
  out keeps game state small.
- Messages are updated very frequently (when streamed out from OpenAI) and
  benefit from lower input latency, so they're not a great fit for the engine.
  See "Design goals and limitations" below.

Messages (`convex/schema.ts`) are in a conversation and indicate an author and message text.
Each conversation has a typing state in the conversations table that indicates that a player
is currently typing. Players can still send messages while another player is typing, but
having the indicator helps agents (and humans) not talk over each other.

The separate tables are queried and modified with regular Convex queries and mutations
that don't directly go through the simulation.

## Game engine (`convex/engine`)

Given the description of AI Town's game behavior in the previous section,
the `AbstractGame` class in `convex/engine/abstractGame.ts` implements actually running the simulation.
The game engine has a few responsibilities:

- Coordinating incoming player inputs, feeding them into the simulation, and sending their
  return values (or errors) to the client.
- Running the simulation forward in time.
- Saving and loading game state from the database.
- Managing executing the game behavior, efficiently using Convex resources and minimizing input latency.

AI Town's game behavior is implemented in the `Game` subclass.

### Input handling

Users submit inputs through the `insertInput` function, which inserts them into an `inputs` table, assigning a
monotonically increasing unique input number and stamping the input with the time the server received it. The
engine then processes inputs, writing their results back to the `inputs` row. Interested clients can subscribe
on an input's status with the `inputStatus` query.

`Game` provides an abstract method `handleInput` that `AiTown` implements with its specific behavior.

### Running the simulation

The `Game` class specifies how it simulates time forward with the `tick` method:

- `tick(now)` runs the simulation forward until the given timestamp
- Ticks are run at a high frequency, configurable with `tickDuration` (milliseconds). Since AI town has smooth motion
  for player movement, it runs at 60 ticks per second.
- It's generally a good idea to break up game logic into separate systems that can be ticked forward independently.
  For example, AI Town's `tick` method advances pathfinding with `Player.tickPathfinding`, player positions with
  `Player.tickPosition`, conversations with `Conversation.tick`, and `Agent.tick` for agent logic.

To avoid running a Convex mutation 60 times per second (which would be expensive and slow), the engine batches up
many ticks into a _step_. AI town runs steps at only 1 time per second. Here's how a step works:

1. Load the game state into memory.
2. Decide how long to run.
3. Execute many ticks for our time interval, alternating between feeding in inputs with `handleInput` and advancing
   the simulation with `tick`.
4. Write the updated game state back to the database.

One core invariant is that the game engine is fully "single-threaded" per world, so there are never two runs of
an engine's step overlapping in time. Not having to think about race conditions or concurrency makes writing game
engine code a lot easier.

However, preserving this invariant is a little tricky. If the engine is idle for a minute and an
input comes in, we want to run the engine immediately but then cancel its run after the minute's
up. If we're not careful, a race condition may cause us to run multiple copies of the engine if an
input comes in just as an idle timeout is expiring!

Our approach is to store a generation number with the engine that monotonically increases over time.
All scheduled runs of the engine contain their expected generation number as an argument. Then, if
we'd like to cancel a future run of the engine, we can bump the generation number by one, and then
we're guaranteed that the subsequent run will fail immediately as it'll notice that the engine's
generation number does not match its expected one.

### Engine state management

The `World`, `Player`, `Conversation`, and `Agent` classes coordinate loading data into memory from the database,
modifying it according to the game rules, and serializing it to write back out to the database. Here's the flow:

1. The Convex scheduler calls the `convex/aiTown/main.ts:runStep` action.
2. The `runStep` action calls `convex/aiTown/game.ts:loadWorld` to load the current game state. This query calls
   `Game.load`, which loads all of a world's game state from the appropriate tables, and returns a
   `GameState` object, which contains serialized versions of all of the players, agents, etc.
3. The `runStep` action passes the `GameState` to the `Game` constructor, which parses the serialized versions
   of all our game objects using their constructors. For example, `new Player(serializedPlayer)` parses the
   database representation into the in-memory `Player` class.
4. The engine runs the simulation, modifying the in-memory game objects.
5. At the end of a step, the framework calls `Game.saveStep`, which computes a diff of the game state since
   the beginning of the step and passes the diff to the `convex/aiTown/game.ts:saveWorld` mutation.
6. The `saveWorld` mutation applies the diff to the database, notices if any deleted objects need to be archived,
   updates the `participatedTogether` graph, and kicks off any scheduled jobs to run.
7. Since the engine is the only mutator of game state, it continues to run steps for some amount of time
   without repeating steps 1 to 3 again.

Just as we assume that the game engine is "single threaded", we also assume that the game engine _exclusively_
owns the tables that store game engine state. Only the game engine should programmatically modify these tables,
so components outside the engine can only mutate them by sending inputs.

### Historical tables

If we're only writing updates out to the database at the end of the step, and steps are only running at once per
second, continuous quantities like position will only update every second. This, then, defeats the whole purpose
of having high-frequency ticks: Player positions will jump around and look choppy.

To solve this, we track the historical values of quantities like position _within_ a step, storing the value
at the end of each tick. Then, the client receives both the current value _and_ the past step's worth of
history, and it can "replay" the history to make the motion smooth.

The game tracks these quantities at the end of each tick by feeding them to a `HistoricalObject`. This object
efficiently tracks its changes over time and serializes them into a buffer that clients can use for replaying
its history. There are a few limitations on `HistoricalObject`:

- Historical objects can only have numeric (floating point) values and can't have nested objects or optional fields.
- Historical objects must declare which fields they'd like to track.

We store each player's "location" (i.e. its position, orientation, and speed) in a `HistoricalObject` and
write it to the `worlds` document at the end of a step when computing a diff.

## Client-side game UI (`src/`)

One guiding principle for AI Town's architecture is to keep the usage as close to "regular Convex" usage as possible. So,
game state is stored in regular tables, and the UI just uses regular `useQuery` hooks to load that state and render
it in the UI.

The one exception is for historical tables, which feed in the latest state into a `useHistoricalValue` hook that parses
the history buffer and replays time forward for smooth motion. To keep replayed time synchronized across multiple
historical buffers, we provide a `useHistoricalTime` hook for the top of your app that keeps track of the current
time and returns it for you to pass down into components.

We also provide a `useSendInput` hook that wraps `useMutation` and automatically sends inputs to the server and
waits for the engine to process them and return their outcome.

## Agent architecture (`convex/agent`)

### The agent loop (`convex/game/agents.ts`)

Agents will execute any game state changes, and schedule operations to do anything that requires
a long-lived request or accessing non-game tables. The flow generally is:

1. Logic in `Agent.tick` can read and modify game state as time progresses, such as waiting until
   the agent is near another player to start talking.
2. When there is something that needs to talk to an LLM or read/write external data,
   it calls `startOperation` with a reference to a Convex function: generally an `internalAction`.
3. This function can read state from game tables and other tables via `internalQuery` functions.
4. It executes long-running tasks, and can write data via `internalMutation`s.
   Game state should not be written, but rather submitted via `inputs` (described in a previous section).
5. Inputs are submitted from actions with `ctx.runMutation(api.game.main.sendInput, {...})` from actions
   or via `insertInput` from mutations. They are referenced by their name as a string, like `moveTo`.
6. Inputs are defined with `inputHandler` and are given an instance of the AiTown game to modify,
   similar to the game loop. In fact, these are called as part of the game loop before `tickAgent`.
7. When an operation is done, it deletes the `inProgressOperation`. This is to ensure an agent only
   is trying to do one thing at a time.
8. `Agent.tick` then can observe the new game state and continue to make decisions.

### Conversations (`convex/agent/conversations.ts`)

The agent code calls into the conversation layer which implements the prompt engineering for
injecting personality and memories into the GPT responses. It has functions for starting a
conversation (`startConversation`), continuing after the first message (`continueConversation`), and
politely leaving a conversation (`leaveConversation`). Each function loads structured data from the
database, queries the memory layer for the agent's opinion about the player they're talking with,
and then calls into the OpenAI client (`convex/util/openai.ts`).

### Memories (`convex/agent/memory.ts`)

After each conversation, GPT summarizes its message history, and we compute an embedding of the
summary text and write it into Convex's vector database. Then, when starting a new conversation
with, Danny, we embed "What you think about Danny?", find the three most similar memories, and fetch
their summary texts to inject into the conversation prompt.

### Embeddings cache (`convex/agent/embeddingsCache.ts`)

To avoid computing the same embedding over and over again, we cache embeddings by a hash of their
text in a Convex table.

## Design goals and limitations

AI Town's game engine has a few design goals:

- Try to be as close to a regular Convex app as possible. Use regular client hooks (like `useQuery`)
  when possible, and store game state in regular tables.
- Be as similar to existing engines as possible, so it's easy to change the behavior. We chose a
  `tick()` based model for simulation since it's commonly used elsewhere and intuitive.
- Decouple agent behavior from the game engine. It's nice to allow human players and AI agents to do
  all the same things in the game.

These design goals imply some inherent limitations:

- All data is loaded into memory each step. The active game state loaded by the game should be small
  enough to fit into memory and load and save frequently. Try to keep game state to less than a few dozen
  kilobytes: Games that require tens of thousands of objects interacting together may not be a good
  fit.
- All inputs are fed through the database in the `inputs` table, so applications that require very
  large or frequent inputs may not be a good fit.
- Input latency will be around one RTT (time for the input to make it to the server and the response
  to come back) plus half the step size (for expected server input delay when the input's waiting
  for the next step). Historical values add another half step size of input latency since their
  values are viewed slightly in the past. As configured, this will roughly be around 1.5s of input
  latency, which won't be a good fit for competitive games. You can configure the step size to be
  smaller (e.g. 250ms) which will decrease input latency at the cost of adding more Convex function
  calls and database bandwidth.
- The game engine is designed to be single threaded. JavaScript operating over plain objects
  in-memory can be surprisingly fast, but if your simulation is very computationally expensive, it
  may not be a good fit on AI Town's engine today.

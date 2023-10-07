# Architecture

This documents dives into the high-level architecture of AI Town and its different layers. We'll
first start with a brief overview and then go in-depth on each component. The overview should
be sufficient for forking AI Town and changing game or agent behavior. Read on to the deep dives
if you're interested or running up against the engine's limitations.

This doc assumes the reader has a working knowledge of Convex. If you're new to Convex, check out
the [Convex tutorial](https://docs.convex.dev/get-started) to get started.

## Overview

AI Town is split into a few layers:

- The server-side game logic in `convex/game`: This layer defines what state AI Town maintains,
  how it evolves over time, and how it reacts to user input. Humans and AI agents are
  indistinguishable to this layer: Both just submit inputs that the game engine processes.
- The client-side game UI in `src/`: AI Town uses `pixi-react` to render the game state to the
  browser for human consumption.
- The game engine in `convex/engine`: To make it easy to hack on the game rules, we've separated
  out the game engine from the AI Town-specific game rules. The game engine is responsible for
  saving and loading game state from the database, coordinating feeding inputs into the engine,
  and actually running the game engine in Convex functions.
- The agent in `convex/agent`: Agents run in Convex functions that observe game state and
  submit inputs to the game engine. Agents are responsible for deciding what inputs to submit
  based on the game state. Internally, our agents use a combination of simple rule-based systems
  and talking to an LLM.

So, if you'd like to tweak agent behavior but keep the same game mechanics, check out `convex/agent`.
If you would like to add new gameplay elements (that both humans and agents can interact with), add
the feature to `convex/game`, render it in the UI in `src/`, and then add agent behavior in `convex/agent`.

If you have parts of your game that are more latency sensitive, you can move them out of engine
into regular Convex tables, queries, and mutations, only logging key bits into game state. See
"Message data model" below for an example.

## AI Town game logic (`convex/game`)

### Data model

AI Town's data model has a few concepts:

- Players (`convex/game/players.ts`) are the core characters in the game and stored in the `players` table.
  Players have human readable names and descriptions, and they may be associated with a human user.
  At any point in time, a player may be pathfinding towards some destination and has a current location.
- Locations (`convex/game/locations.ts`) keep track of a player's position, orientation, and velocity
  in the `locations` table. We store the orientation as a normalized vector.
- Conversations (`convex/game/conversations.ts`) are created by a player and end at some point in time.
- Conversation memberships (`convex/game/conversationMembers.ts`) indicate that a player is a member
  of a conversation. Players may only be in one active conversation at any point in time, and conversations
  currently have exactly two members. Memberships may be in one of four states:
  - `invited`: The player has been invited to the conversation but hasn't accepted yet.
  - `walkingOver`: The player has accepted the invite to the conversation but is too far away to talk. The
    player will automatically join the conversation when they get close enough.
  - `participating`: The player is actively participating in the conversation.
  - `left`: The player has left the conversation, and we keep the row around for historical queries.

### Inputs (`convex/game/inputs.ts`)

AI Town modifies its data model by processing inputs. Inputs are submitted by players and agents and
processed by the game engine. We specify inputs in the `inputs` object in `convex/game/inputs.ts`, specifying
the expected arguments and return value types with a Convex validator. With these validators, we can ensure
end-to-end type-safety both in the client and in agents.

- Joining (`join`) and leaving (`leave`) the game.
- Moving a player to a particular location (`moveTo`): Movement in AI Town is similar to RTS games, where
  the players specify where they want to go, and the engine figures out how to get there.
- Starting a conversation (`startConversation`), accepting an invite (`acceptInvite`), rejecting an invite
  (`rejectInvite`), and leaving a conversation (`leaveConversation`).

Each of these inputs' implementations is in the `AiTown.handleInput` method in `convex/game/aiTown.ts`. Each
implementation method checks invariants and updates game state as desired. For example, the `moveTo` input
checks that the player isn't participating in a conversation, throwing an error telling them to leave
the conversation first if so, and then updates their pathfinding state with the desired destination.

### Simulation

Other than when processing player inputs, the game state can change over time in the background as the
simulation runs time forward. For example, if a player has decided to move along a path, their position
will gradually update as time moves forward. Similarly, if two players collide into each other, they'll
notice and replan their paths, trying to avoid obstacles.

### Message data model

We manage the tables for tracking chat messages in separate tables not affiliated with the game engine. This is for a few reasons:

- The core simulation doesn't need to know about messages, so keeping them
  out keeps game state small.
- Messages are updated very frequently (when streamed out from OpenAI) and
  benefit from lower input latency, so they're not a great fit for the engine. See "Design goals and limitations" below.
- It's convenient to be able to directly mutate the typing indicator from
  other mutations without having to go through the game engine.

There are two tables for messages:

- Messages (`convex/schema.ts`) are in a conversation and indicate an author and message text.
- Each conversation has a typing indicator (`convex/schema.ts`) that indicates that a player
  is currently typing. Players can still send messages while another player is typing, but
  having the indicator helps agents (and humans) not talk over each other.

These tables are queried and modified with regular Convex queries and mutations that don't directly
go through the simulation.

## Game engine (`convex/engine`)

Given the description of AI Town's game behavior in the previous section, the `Game` class in `convex/engine/game.ts`
implements actually running the simulation. The game engine has a few responsibilities:

- Coordinating incoming player inputs, feeding them into the simulation, and sending their return values (or errors) to the client.
- Running the simulation forward in time.
- Saving and loading game state from the database.
- Managing executing the game behavior, efficiently using Convex resources and minimizing input latency.

AI Town's game behavior is implemented in the `AiTown` class, which subclasses the engine's `Game` class.

### Input handling

Users submit inputs through the `insertInput` function, which inserts them into an `inputs` table, assigning a
monotonically increasing unique input number and stamping the input with the time the server received it. The
engine then processes inputs, writing their results back to the `inputs` row. Interested clients can subscribe
on an input's status with the `inputStatus` query.

`Game` provides an abstract method `handleInput` that `AiTown` implements with its specific behavior.

### Running the simulation

`AiTown` specifies how it simulates time forward with the `tick` method:

- `tick(now)` runs the simulation forward until the given timestamp
- Ticks are run at a high frequency, configurable with `tickDuration` (milliseconds). Since AI town has smooth motion
  for player movement, it runs at 60 ticks per second.
- It's generally a good idea to break up game logic into separate systems that can be ticked forward independently.
  For example, AI Town's `tick` method advances pathfinding with `tickPathfinding`, player positions with
  `tickPosition`, and conversations with `tickConversation`.

To avoid running a Convex mutation 60 times per second (which would be expensive and slow), the engine batches up
many ticks into a _step_. AI town runs steps at only 1 time per second. Here's how a step works:

1. Load the game state into memory.
2. Decide how long to run.
3. Execute many ticks for our time interval, alternating between feeding in inputs with `handleInput` and advancing
   the simulation with `tick`.
4. Write the updated game state back to the database.

The engine then schedules steps to run periodically. To avoid running steps when the game is idle, games can optionally
declare if the game is currently idle and for how long with the `idleUntil` method. If the game is idle, the engine
will automatically schedule the next step past the idleness period but also wake it up if an input comes in.

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

### Managing game state

The engine assumes that all game state is in Convex tables, so it's easy to look at (and even modify!) game state
directly on the dashboard. Try it out: run AI town, update a player's name, and see it immediately change in the UI.

However, it's a lot more convenient to write `handleInput` and `tick` as if we're working purely in-memory state.
So, we provide `GameTable`, a class that provides a lightweight ORM for reading data from the database, accessing
it in-memory, and then writing out the rows that have changed at the end of a step.

We want to keep game state relatively small, since it's fully loaded at the beginning of each step. And, the game
engine often only cares about a small "active" subset of game state in the tables. So, subclasses of `GameTable`
can implement an `isActive` method that tells the system when a row is no longer active should be excluded from
game processing. For example, AI Town's `Conversations` class only keeps conversations that are currently active.

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

We assume that most quantities do not need this high-frequency tracking, so developers have to opt into this
by subclassing `HistoricalTable` instead of `GameTable`. There are a few limitations on `HistoricalTable`:

- Historical tables can only have numeric (floating point) values and can't have nested objects or optional fields.
- Historical tables must declare which fields they'd like to track.
- Historical tables must define a `history: v.optional(v.bytes())` field in their schema that the engine uses for packing
  in a buffer of the historical values.

AI Town uses a historical table for `locations`, storing the position, orientation, and velocity as fields.

```ts
export const locations = defineTable({
  // Position.
  x: v.number(),
  y: v.number(),

  // Normalized orientation vector.
  dx: v.number(),
  dy: v.number(),

  // Velocity (in tiles/sec).
  velocity: v.number(),

  // History buffer filled out by `HistoricalTable`.
  history: v.optional(v.bytes()),
});
```

By specializing to just continuous numeric quantities, we can compress these buffers. It's important to keep
these history buffers small since they're sent to to every observing client on every step for every moving character.

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

### The agent loop (`convex/agent/main.ts`)

The LLM-powered agents (the `Agent` class in `convex/agent/main.ts`) control a player and have the following behaviors:

1. Wander around the map
2. Invite nearby players to conversations.
3. Decide if they want to accept an invite.
4. Call into OpenAI to generate message text for conversations, using previous memories from talking with that player.
5. Decide when to leave a conversation.
6. Call into OpenAI to summarize conversations and form a memory in Convex's vector database.

Each agent runs in a mutation (`convex/agent/main.ts:agentRun`) that's scheduled periodically. Each run, it looks at
the current game state, sends some inputs to the engine, and then decides what to do next. If the agent decides to
send a message in a conversation, it calls into an action (e.g. `convex/agent/main.ts:agentStartConversation`) that
coordinates calling into OpenAI, sending the message, and then rescheduling the agent to run again.

This scheduled mutation loop uses the same pattern as the engine to handle safely preempting it and retrying on action
errors without potentially having multiple instances of `agentRun` running at the same time.

### Conversations (`convex/agent/conversations.ts`)

The agent layer calls into the conversation layer which implements the prompt engineering for
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

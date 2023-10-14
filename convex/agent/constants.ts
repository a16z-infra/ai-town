// Don't talk to anyone for 15s after having a conversation.
export const CONVERSATION_COOLDOWN = 15000;

// Don't talk to a player within 60s of talking to them.
export const PLAYER_CONVERSATION_COOLDOWN = 60000;

// Invite 80% of invites that come from other agents.
export const INVITE_ACCEPT_PROBABILITY = 0.8;

// Wait for 1m for invites to be accepted.
export const INVITE_TIMEOUT = 60000;

// Wait for 20s for another player to say something before jumping in.
export const AWKWARD_CONVERSATION_TIMEOUT = 20000;

// Leave a conversation after 2m of participating.
export const MAX_CONVERSATION_DURATION = 120 * 1000;

// Leave a conversation if it has more than 8 messages;
export const MAX_CONVERSATION_MESSAGES = 8;

// Wait for 1s after sending an input to the engine. We can remove this
// once we can await on an input being processed.
export const INPUT_DELAY = 1000;

// Timeout a request to the conversation layer after a minute.
export const ACTION_TIMEOUT = 60 * 1000;

// Wait for at least two seconds before sending another message.
export const MESSAGE_COOLDOWN = 2000;

// Above this distance, agents will walk towards their conversation
// partner by choosing the midpoint between them. Under this distance,
// they'll go directly to their partner. This slightly helps with
// agents going directly to each other over long distances and choosing
// different paths.
export const MIDPOINT_THRESHOLD = 4;

// How long should an agent wait on an input before giving up?
export const INPUT_TIMEOUT = 60000;

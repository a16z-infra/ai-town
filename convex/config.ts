import { Pose } from './schema.js';

export const NEARBY_DISTANCE = 3;
// Close enough to stop and observe something.
export const CLOSE_DISTANCE = 1;
export const TIME_PER_STEP = 2_000;
// After this many ms, give up on the agent and start thinking again.
export const AGENT_THINKING_TOO_LONG = 60_000;
// If you don't set a start position, you'll start at 0,0.
export const DEFAULT_START_POSE: Pose = { position: { x: 0, y: 0 }, orientation: 0 };
export const CONVERSATION_DEAD_THRESHOLD = 600_000; // In ms

export const HEARTBEAT_PERIOD = 30_000; // In ms

export const WORLD_IDLE_THRESHOLD = 300_000; // In ms

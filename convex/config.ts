// How close a player can be to have a conversation.
export const NEARBY_DISTANCE = 3;
// Close enough to stop and observe something.
export const CLOSE_DISTANCE = 1;
// How long it takes a player to walk one tile.
export const TIME_PER_STEP = 2_000;
// After this many ms, give up on the agent and start thinking again.
export const AGENT_THINKING_TOO_LONG = 600_000;
// How long to hang out if there was no path to your destination.
export const STUCK_CHILL_TIME = 30_000;
// How long to let a conversation go on for with agents
export const CONVERSATION_TIME_LIMIT = 20_000;
// If you don't set a start position, you'll start at 0,0.
export const DEFAULT_START_POSE = { position: { x: 0, y: 0 }, orientation: 0 };
// How often to send up heartbeats
export const HEARTBEAT_PERIOD = 30_000; // In ms
// How long to wait after heartbeats before considering a world idle.
export const WORLD_IDLE_THRESHOLD = 300_000; // In ms
// How long to wait before update a memory's last access time.
export const MEMORY_ACCESS_THROTTLE = 300_000; // In ms
// We round tick times to debounce events. They'll get rounded up to the nearest multiple of this.
export const TICK_DEBOUNCE = 10; // In ms
// This is a balance of how busy to make the DB at once.
export const VACUUM_BATCH_SIZE = 50;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
export const VACUUM_JOURNAL_AGE = 7 * DAY;
export const VACUUM_MEMORIES_AGE = 14 * DAY;

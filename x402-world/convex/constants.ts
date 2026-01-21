// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD CONSTANTS
// Configuration values for the simulation and protocol
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// ENGINE TIMING
// ═══════════════════════════════════════════════════════════════════════════════

// Engine step duration in milliseconds
export const ENGINE_ACTION_DURATION = 60000; // 1 minute

// Time between heartbeat checks (TICK agent)
export const HEARTBEAT_INTERVAL = 300000; // 5 minutes

// Maximum time an agent can be inactive before recycling (for ephemeral agents)
export const AGENT_IDLE_TIMEOUT = 3600000; // 1 hour

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION TIMING
// ═══════════════════════════════════════════════════════════════════════════════

// Default transaction timeout
export const TRANSACTION_TIMEOUT = 300000; // 5 minutes

// Time to wait for Solana confirmation
export const CONFIRMATION_TIMEOUT = 60000; // 1 minute

// Cooldown between transactions for same agent pair
export const TRANSACTION_COOLDOWN = 5000; // 5 seconds

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL TIMING
// ═══════════════════════════════════════════════════════════════════════════════

// Default signal lifetime
export const SIGNAL_LIFETIME = 60000; // 1 minute

// Minimum time between signals from same source
export const SIGNAL_COOLDOWN = 1000; // 1 second

// ═══════════════════════════════════════════════════════════════════════════════
// CARAVAN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Maximum agents per caravan
export const MAX_CARAVAN_SIZE = 10;

// Maximum transactions per caravan
export const MAX_CARAVAN_TRANSACTIONS = 20;

// Caravan formation timeout
export const CARAVAN_FORMATION_TIMEOUT = 120000; // 2 minutes

// ═══════════════════════════════════════════════════════════════════════════════
// RECURSION (RALPH) CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Maximum recursion depth for RALPH processing
export const MAX_RECURSION_DEPTH = 7;

// Confidence threshold to execute without deeper recursion
export const CONFIDENCE_THRESHOLD = 85;

// Time per recursion level (ms)
export const RECURSION_TIME_PER_LEVEL = 2000;

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Maximum agents per world
export const MAX_AGENTS = 1000;

// Maximum human-operated agents per world
export const MAX_HUMAN_AGENTS = 100;

// Starting reputation for new agents
export const STARTING_REPUTATION = 50;

// Minimum reputation to operate
export const MIN_REPUTATION = 10;

// ═══════════════════════════════════════════════════════════════════════════════
// MOVEMENT & PATHFINDING
// ═══════════════════════════════════════════════════════════════════════════════

// Collision detection threshold
export const COLLISION_THRESHOLD = 0.5;

// Pathfinding timeout
export const PATHFINDING_TIMEOUT = 60000; // 1 minute

// Backoff time when path is blocked
export const PATHFINDING_BACKOFF = 2000; // 2 seconds

// Maximum pathfinds per tick (performance limit)
export const MAX_PATHFINDS_PER_STEP = 50;

// ═══════════════════════════════════════════════════════════════════════════════
// ZONE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Zone types and their properties
export const ZONE_CONFIG = {
  nexus: {
    baseFee: 1.0,
    capacity: 50,
    allowedRoles: ['oracle', 'watcher', 'recursion', 'node', 'diamond'],
  },
  exchange: {
    baseFee: 1.2,
    capacity: 30,
    allowedRoles: ['mixer', 'node', 'diamond', 'specialist'],
  },
  forge: {
    baseFee: 1.5,
    capacity: 20,
    allowedRoles: ['oracle', 'node', 'specialist'],
  },
  archive: {
    baseFee: 0.8,
    capacity: 15,
    allowedRoles: ['watcher', 'recursion', 'node'],
  },
  gateway: {
    baseFee: 1.0,
    capacity: 25,
    allowedRoles: ['sentinel', 'node', 'diamond'],
  },
  vault: {
    baseFee: 0.5,
    capacity: 10,
    allowedRoles: ['oracle', 'sentinel', 'diamond'],
  },
  lab: {
    baseFee: 1.3,
    capacity: 15,
    allowedRoles: ['specialist', 'recursion', 'node'],
  },
  commons: {
    baseFee: 0.9,
    capacity: 40,
    allowedRoles: ['*'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITIES (for idle agents)
// ═══════════════════════════════════════════════════════════════════════════════

export const ACTIVITIES = [
  { description: 'Scanning for signals', emoji: '📡', duration: 30000 },
  { description: 'Analyzing market data', emoji: '📊', duration: 45000 },
  { description: 'Optimizing strategies', emoji: '🧠', duration: 60000 },
  { description: 'Synchronizing state', emoji: '🔄', duration: 20000 },
  { description: 'Running diagnostics', emoji: '🔧', duration: 40000 },
  { description: 'Processing memories', emoji: '💭', duration: 35000 },
  { description: 'Monitoring network', emoji: '🌐', duration: 25000 },
  { description: 'Calibrating recursion', emoji: '🌀', duration: 50000 },
];

// Activity cooldown
export const ACTIVITY_COOLDOWN = 10000; // 10 seconds

// ═══════════════════════════════════════════════════════════════════════════════
// VISUAL CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

// Agent movement speed (tiles per second)
export const MOVEMENT_SPEED = 2;

// Animation frame duration
export const ANIMATION_FRAME_MS = 100;

// Typing timeout for messages
export const TYPING_TIMEOUT = 15000;

// ═══════════════════════════════════════════════════════════════════════════════
// THEME COLORS (Solana Cyberpunk)
// ═══════════════════════════════════════════════════════════════════════════════

export const THEME = {
  // Backgrounds
  void: '#000000',
  abyss: '#030305',
  deep: '#050508',
  dark: '#0a0a12',
  surface: '#0d0d18',
  elevated: '#12121f',

  // Solana brand
  purple: '#9945FF',
  purpleDeep: '#7B35D9',
  purpleLight: '#B06AFF',
  purpleMist: 'rgba(153, 69, 255, 0.15)',
  purpleGlow: 'rgba(153, 69, 255, 0.6)',

  green: '#14F195',
  greenDeep: '#0FC07A',
  greenLight: '#4DFFC0',
  greenMist: 'rgba(20, 241, 149, 0.15)',
  greenGlow: 'rgba(20, 241, 149, 0.6)',

  // Accent colors
  cyan: '#00D4FF',
  cyanGlow: 'rgba(0, 212, 255, 0.5)',
  gold: '#FFD700',
  goldGlow: 'rgba(255, 215, 0, 0.4)',
  orange: '#FF6B35',
  orangeGlow: 'rgba(255, 107, 53, 0.4)',

  // Status colors
  success: '#14F195',
  danger: '#FF3B5C',
  warning: '#FFB020',
  info: '#00D4FF',

  // Borders
  border: '#1a1a3f',
  borderLight: '#2a2a5f',
  borderPurple: 'rgba(153, 69, 255, 0.4)',
  borderGreen: 'rgba(20, 241, 149, 0.4)',

  // Text
  text: '#E8E8F0',
  textBright: '#FFFFFF',
  textDim: '#8888AA',
  textMuted: '#555577',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
  gradientPurple: 'linear-gradient(180deg, #9945FF 0%, #6B2FCC 100%)',
  gradientGreen: 'linear-gradient(180deg, #14F195 0%, #0FC07A 100%)',
  gradientVoid: 'linear-gradient(180deg, #0a0a12 0%, #000000 100%)',
  gradientRadial: 'radial-gradient(ellipse at center, #0d0d18 0%, #000000 70%)',
  gradient402: 'linear-gradient(135deg, #FF6B35 0%, #FFD700 100%)',
};

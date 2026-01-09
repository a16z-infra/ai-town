
// FSM States
export const AGENT_STATES = {
    IDLE: 'IDLE',
    MOVING: 'MOVING', // Usually sub-state of other states or transient
    CONVERSING: 'CONVERSING',
    PLANNING: 'PLANNING',
    COOLDOWN: 'COOLDOWN',
} as const;

export type AgentState = keyof typeof AGENT_STATES;

// Helper to transition state
export function transition(current: AgentState, event: string): AgentState {
    // Simple state machine logic
    switch(current) {
        case 'IDLE':
            if (event === 'PLAN') return 'PLANNING';
            if (event === 'CONVERSE') return 'CONVERSING';
            break;
        case 'PLANNING':
            if (event === 'MOVE') return 'MOVING';
            if (event === 'DONE') return 'IDLE';
            break;
        case 'MOVING':
             if (event === 'ARRIVED') return 'IDLE';
             break;
        case 'CONVERSING':
             if (event === 'ENDED') return 'COOLDOWN';
             break;
        case 'COOLDOWN':
             if (event === 'READY') return 'IDLE';
             break;
    }
    return current;
}

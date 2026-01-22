/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * RALPH TOWN - AI TOWN VISUALIZATION COMPONENT
 * React component for rendering the X402 World agent simulation
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type React from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Agent {
  id: string;
  name: string;
  role: string;
  zone: string;
  state: string;
  balance: { sol: number; usdc: number; x402: number };
  reputation: number;
  confidence: number;
  totalTransactions: number;
  lastActive: number;
}

interface Conversation {
  _id: string;
  participants: string[];
  topic: string;
  zone: string;
  messages: { agentId: string; content: string; timestamp: number }[];
  status: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ZONE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const ZONES = {
  nexus: { name: 'NEXUS', color: '#9945FF', icon: '🔮', description: 'Central Hub' },
  exchange: { name: 'EXCHANGE', color: '#14F195', icon: '💱', description: 'Trading Floor' },
  forge: { name: 'FORGE', color: '#FF6B35', icon: '⚒️', description: 'Protocol Factory' },
  archive: { name: 'ARCHIVE', color: '#00D9FF', icon: '📚', description: 'Data Repository' },
  gateway: { name: 'GATEWAY', color: '#FFD700', icon: '🚪', description: 'Access Control' },
  vault: { name: 'VAULT', color: '#D4AF37', icon: '🏛️', description: 'Secure Storage' },
  lab: { name: 'LAB', color: '#CC66FF', icon: '🔬', description: 'Recursive Depths' },
  commons: { name: 'COMMONS', color: '#888899', icon: '🏘️', description: 'Public Space' },
};

const ROLE_AVATARS: Record<string, string> = {
  oracle: '🔮',
  mixer: '🔀',
  watcher: '👁️',
  recursion: '🌀',
  node: '⬡',
  sentinel: '🛡️',
  diamond: '💎',
  specialist: '🎯',
};

// ═══════════════════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════════════════

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a12 0%, #1a1a2e 50%, #0a0a12 100%)',
    color: '#e0e0e0',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    padding: '20px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
    borderBottom: '2px solid #9945FF',
    paddingBottom: '20px',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 'bold',
    background: 'linear-gradient(90deg, #9945FF, #14F195)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '10px',
  },
  subtitle: {
    color: '#888',
    fontSize: '1.1rem',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  zoneCard: {
    background: 'rgba(20, 20, 35, 0.8)',
    border: '1px solid',
    borderRadius: '12px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
  },
  zoneHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '15px',
  },
  zoneName: {
    fontSize: '1.3rem',
    fontWeight: 'bold',
  },
  agentPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(40, 40, 60, 0.8)',
    padding: '8px 12px',
    borderRadius: '20px',
    margin: '4px',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    animation: 'pulse 2s infinite',
  },
  conversationPanel: {
    background: 'rgba(20, 20, 35, 0.9)',
    border: '1px solid #14F195',
    borderRadius: '12px',
    padding: '20px',
    marginTop: '30px',
  },
  message: {
    background: 'rgba(40, 40, 60, 0.6)',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '10px',
    borderLeft: '3px solid',
  },
  statsPanel: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '15px',
    marginBottom: '30px',
  },
  statCard: {
    background: 'rgba(30, 30, 50, 0.8)',
    padding: '20px',
    borderRadius: '10px',
    textAlign: 'center' as const,
    border: '1px solid rgba(153, 69, 255, 0.3)',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    background: 'linear-gradient(90deg, #9945FF, #14F195)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  statLabel: {
    color: '#888',
    fontSize: '0.85rem',
    marginTop: '5px',
  },
  controlPanel: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    marginBottom: '30px',
  },
  button: {
    background: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
    color: '#fff',
    border: 'none',
    padding: '12px 30px',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  },
  buttonSecondary: {
    background: 'rgba(40, 40, 60, 0.8)',
    color: '#9945FF',
    border: '1px solid #9945FF',
    padding: '12px 30px',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Agent Badge Component
function AgentBadge({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const statusColors: Record<string, string> = {
    idle: '#888',
    talking: '#14F195',
    working: '#9945FF',
    walking: '#FFD700',
    thinking: '#00D9FF',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      style={{
        ...styles.agentPill,
        borderColor: statusColors[agent.state] || '#888',
        border: `1px solid ${statusColors[agent.state] || '#888'}`,
        background: 'transparent',
      }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <span style={{ fontSize: '1.2rem' }}>
        {ROLE_AVATARS[agent.role] || '⬡'}
      </span>
      <span>{agent.name}</span>
      <span
        style={{
          ...styles.statusDot,
          backgroundColor: statusColors[agent.state] || '#888',
        }}
      />
    </button>
  );
}

// Zone Card Component
function ZoneCard({
  zoneId,
  agents,
  onAgentClick,
}: {
  zoneId: string;
  agents: Agent[];
  onAgentClick: (agent: Agent) => void;
}) {
  const zone = ZONES[zoneId as keyof typeof ZONES] || {
    name: zoneId.toUpperCase(),
    color: '#888',
    icon: '📍',
    description: 'Unknown Zone',
  };

  return (
    <div
      style={{
        ...styles.zoneCard,
        borderColor: zone.color,
        boxShadow: `0 0 20px ${zone.color}20`,
      }}
    >
      <div style={styles.zoneHeader}>
        <div>
          <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>{zone.icon}</span>
          <span style={{ ...styles.zoneName, color: zone.color }}>{zone.name}</span>
        </div>
        <span style={{ color: '#666' }}>{agents.length} agents</span>
      </div>
      <p style={{ color: '#666', marginBottom: '15px', fontSize: '0.85rem' }}>
        {zone.description}
      </p>
      <div>
        {agents.map((agent) => (
          <AgentBadge
            key={agent.id}
            agent={agent}
            onClick={() => onAgentClick(agent)}
          />
        ))}
        {agents.length === 0 && (
          <p style={{ color: '#555', fontStyle: 'italic' }}>No agents present</p>
        )}
      </div>
    </div>
  );
};

// Conversation Panel Component
function ConversationPanel({
  conversations,
  agents,
}: {
  conversations: Conversation[];
  agents: Agent[];
}) {
  const getAgentName = (id: string) =>
    agents.find((a) => a.id === id)?.name || 'Unknown';

  const getAgentColor = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (!agent) return '#888';
    const zone = ZONES[agent.zone as keyof typeof ZONES];
    return zone?.color || '#888';
  };

  if (conversations.length === 0) {
    return (
      <div style={styles.conversationPanel}>
        <h3 style={{ color: '#14F195', marginBottom: '15px' }}>
          💬 Active Conversations
        </h3>
        <p style={{ color: '#666', fontStyle: 'italic' }}>
          No active conversations. Agents are processing silently...
        </p>
      </div>
    );
  }

  return (
    <div style={styles.conversationPanel}>
      <h3 style={{ color: '#14F195', marginBottom: '15px' }}>
        💬 Active Conversations ({conversations.length})
      </h3>
      {conversations.map((conv) => (
        <div key={conv._id} style={{ marginBottom: '20px' }}>
          <div style={{ color: '#9945FF', marginBottom: '10px' }}>
            Topic: <strong>{conv.topic}</strong> | Zone: {conv.zone}
          </div>
          {conv.messages.slice(-5).map((msg) => (
            <div
              key={`${msg.agentId}-${msg.timestamp}`}
              style={{
                ...styles.message,
                borderLeftColor: getAgentColor(msg.agentId),
              }}
            >
              <strong style={{ color: getAgentColor(msg.agentId) }}>
                {getAgentName(msg.agentId)}:
              </strong>{' '}
              {msg.content}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// Agent Details Modal
function AgentModal({ agent, onClose }: { agent: Agent | null; onClose: () => void }) {
  if (!agent) return null;

  const zone = ZONES[agent.zone as keyof typeof ZONES];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Agent details"
    >
        <div
          style={{
            background: 'rgba(20, 20, 35, 0.95)',
            border: `2px solid ${zone?.color || '#9945FF'}`,
            borderRadius: '16px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
            }
          }}
        >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '3rem', marginRight: '15px' }}>
            {ROLE_AVATARS[agent.role] || '⬡'}
          </span>
          <div>
            <h2 style={{ margin: 0, color: zone?.color || '#fff' }}>{agent.name}</h2>
            <p style={{ margin: 0, color: '#888' }}>{agent.role}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <p style={{ color: '#666', margin: '5px 0' }}>Zone</p>
            <p style={{ color: zone?.color || '#fff', margin: 0 }}>
              {zone?.icon} {zone?.name || agent.zone}
            </p>
          </div>
          <div>
            <p style={{ color: '#666', margin: '5px 0' }}>Status</p>
            <p style={{ color: '#14F195', margin: 0 }}>{agent.state}</p>
          </div>
          <div>
            <p style={{ color: '#666', margin: '5px 0' }}>Reputation</p>
            <p style={{ color: '#9945FF', margin: 0 }}>{agent.reputation}%</p>
          </div>
          <div>
            <p style={{ color: '#666', margin: '5px 0' }}>Confidence</p>
            <p style={{ color: '#00D9FF', margin: 0 }}>{agent.confidence}%</p>
          </div>
          <div>
            <p style={{ color: '#666', margin: '5px 0' }}>SOL Balance</p>
            <p style={{ color: '#FFD700', margin: 0 }}>{agent.balance?.sol?.toFixed(4) || 0}</p>
          </div>
          <div>
            <p style={{ color: '#666', margin: '5px 0' }}>Transactions</p>
            <p style={{ color: '#14F195', margin: 0 }}>{agent.totalTransactions || 0}</p>
          </div>
        </div>

        <button
          type="button"
          style={{ ...styles.buttonSecondary, width: '100%', marginTop: '20px' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function RalphTown({ worldId }: { worldId: string }) {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Queries
  const worldState = useQuery(api.x402World.publicQueries.getWorldState, 
    worldId ? { worldId: worldId as any } : 'skip'
  );
  const simStatus = useQuery(api.x402World.publicQueries.getSimulationStatus, 
    worldId ? { worldId: worldId as any } : 'skip'
  );

  // Mutations
  const runTick = useMutation(api.x402World.publicQueries.runSimulationTick);
  const startSim = useMutation(api.x402World.publicQueries.startSimulation);
  const pauseSim = useMutation(api.x402World.publicQueries.pauseSimulation);

  // Auto-tick when running
  useEffect(() => {
    if (isRunning && worldId) {
      const interval = setInterval(() => {
        runTick({ worldId: worldId as any });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isRunning, worldId, runTick]);

  const agents = worldState?.world?.agents || [];
  const conversations = worldState?.conversations || [];

  // Group agents by zone
  const agentsByZone = agents.reduce((acc: Record<string, Agent[]>, agent: Agent) => {
    if (!acc[agent.zone]) acc[agent.zone] = [];
    acc[agent.zone].push(agent);
    return acc;
  }, {});

  const handleToggleSimulation = async () => {
    if (isRunning) {
      await pauseSim({ worldId: worldId as any });
    } else {
      await startSim({ worldId: worldId as any });
    }
    setIsRunning(!isRunning);
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.title}>RALPH TOWN</h1>
        <p style={styles.subtitle}>
          X402 Protocol • Autonomous Agent Ecosystem • Powered by Solana
        </p>
      </header>

      {/* Stats Panel */}
      <div style={styles.statsPanel}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{agents.length}</div>
          <div style={styles.statLabel}>AGENTS ONLINE</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{conversations.length}</div>
          <div style={styles.statLabel}>ACTIVE CONVERSATIONS</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {agents.filter((a: Agent) => a.state === 'talking').length}
          </div>
          <div style={styles.statLabel}>AGENTS TALKING</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statValue}>
            {simStatus?.status === 'running' ? '🟢' : '⏸️'}
          </div>
          <div style={styles.statLabel}>SIMULATION STATUS</div>
        </div>
      </div>

      {/* Control Panel */}
      <div style={styles.controlPanel}>
        <button
          type="button"
          style={isRunning ? styles.buttonSecondary : styles.button}
          onClick={handleToggleSimulation}
        >
          {isRunning ? '⏸️ Pause Simulation' : '▶️ Start Simulation'}
        </button>
        <button
          type="button"
          style={styles.buttonSecondary}
          onClick={() => {
            if (worldId) {
              runTick({ worldId: worldId as any });
            }
          }}
        >
          ⏭️ Step Forward
        </button>
      </div>

      {/* Zone Grid */}
      <div style={styles.grid}>
        {Object.keys(ZONES).map((zoneId) => (
          <ZoneCard
            key={zoneId}
            zoneId={zoneId}
            agents={agentsByZone[zoneId] || []}
            onAgentClick={setSelectedAgent}
          />
        ))}
      </div>

      {/* Conversations */}
      <ConversationPanel conversations={conversations} agents={agents} />

      {/* Agent Modal */}
      <AgentModal agent={selectedAgent} onClose={() => setSelectedAgent(null)} />

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

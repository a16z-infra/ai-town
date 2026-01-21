import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD - SOLANA SENTIENT AGENT ECOSYSTEM
// A living simulation of autonomous AI agents transacting via X402 Protocol
// ═══════════════════════════════════════════════════════════════════════════════

// Theme Configuration - Solana Cyberpunk
const THEME = {
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

  // Text
  text: '#E8E8F0',
  textBright: '#FFFFFF',
  textDim: '#8888AA',
  textMuted: '#555577',

  // Gradients
  gradientPrimary: 'linear-gradient(135deg, #9945FF 0%, #14F195 100%)',
  gradient402: 'linear-gradient(135deg, #FF6B35 0%, #FFD700 100%)',
};

// Zone Configuration
const ZONES = [
  { id: 'nexus', name: 'THE NEXUS', type: 'nexus', x: 50, y: 50, radius: 15, color: '#9945FF', icon: '🔮', capacity: 50 },
  { id: 'exchange', name: 'THE EXCHANGE', type: 'exchange', x: 25, y: 50, radius: 12, color: '#14F195', icon: '📊', capacity: 30 },
  { id: 'forge', name: 'THE FORGE', type: 'forge', x: 75, y: 50, radius: 10, color: '#FF6B35', icon: '⚒️', capacity: 20 },
  { id: 'archive', name: 'THE ARCHIVE', type: 'archive', x: 50, y: 25, radius: 10, color: '#00D4FF', icon: '📚', capacity: 15 },
  { id: 'gateway', name: 'THE GATEWAY', type: 'gateway', x: 50, y: 75, radius: 8, color: '#FFD700', icon: '🚪', capacity: 25 },
  { id: 'vault', name: 'THE VAULT', type: 'vault', x: 25, y: 25, radius: 8, color: '#FFB020', icon: '🏦', capacity: 10 },
  { id: 'lab', name: 'THE LAB', type: 'lab', x: 75, y: 25, radius: 10, color: '#FF3B5C', icon: '🧪', capacity: 15 },
  { id: 'commons', name: 'THE COMMONS', type: 'commons', x: 75, y: 75, radius: 12, color: '#8888AA', icon: '🏛️', capacity: 40 },
];

// Agent Role Configuration
const AGENT_ROLES = {
  oracle: { icon: '🔮', color: '#9945FF', title: 'Oracle', desc: 'Chief Orchestrator' },
  mixer: { icon: '🔀', color: '#14F195', title: 'Mixer', desc: 'Liquidity Provider' },
  watcher: { icon: '👁️', color: '#00D4FF', title: 'Watcher', desc: 'Signal Monitor' },
  recursion: { icon: '🌀', color: '#B06AFF', title: 'Recursion', desc: 'RALPH Processor' },
  node: { icon: '⬡', color: '#8888AA', title: 'Node', desc: 'General Worker' },
  sentinel: { icon: '🛡️', color: '#FFD700', title: 'Sentinel', desc: 'Security Guard' },
  diamond: { icon: '💎', color: '#FFB020', title: 'Diamond', desc: 'Premium Operator' },
  specialist: { icon: '🎯', color: '#FF6B35', title: 'Specialist', desc: 'Domain Expert' },
};

// Initial Agents
const INITIAL_AGENTS = [
  { id: 'ag:000001', name: 'THE ORACLE', role: 'oracle', zone: 'nexus', reputation: 100, balance: 10000 },
  { id: 'ag:000002', name: 'FLUX', role: 'mixer', zone: 'exchange', reputation: 85, balance: 5000 },
  { id: 'ag:000003', name: 'SENTINEL-7', role: 'watcher', zone: 'archive', reputation: 78, balance: 2500 },
  { id: 'ag:000004', name: 'RALPH-PRIME', role: 'recursion', zone: 'lab', reputation: 92, balance: 7500 },
  { id: 'ag:000005', name: 'GUARDIAN', role: 'sentinel', zone: 'gateway', reputation: 88, balance: 3500 },
  { id: 'ag:000006', name: 'NODE-42', role: 'node', zone: 'commons', reputation: 65, balance: 1000 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function X402World() {
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [transactions, setTransactions] = useState([]);
  const [signals, setSignals] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [worldStats, setWorldStats] = useState({
    totalVolume: 0,
    activeTransactions: 0,
    signalCount: 0,
    networkStatus: 'connected',
  });
  const [time, setTime] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);

  // Simulation tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(t => t + 1);
      simulateTick();
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulation logic
  const simulateTick = useCallback(() => {
    // Random agent activity
    if (Math.random() < 0.3) {
      const fromAgent = agents[Math.floor(Math.random() * agents.length)];
      const toAgent = agents[Math.floor(Math.random() * agents.length)];

      if (fromAgent.id !== toAgent.id && fromAgent.balance > 10) {
        const amount = Math.floor(Math.random() * 50) + 1;
        createTransaction(fromAgent, toAgent, amount);
      }
    }

    // Random signal broadcast
    if (Math.random() < 0.2) {
      const sourceAgent = agents[Math.floor(Math.random() * agents.length)];
      broadcastSignal(sourceAgent);
    }

    // Clean up old transactions and signals
    setTransactions(txs => txs.filter(tx => Date.now() - tx.created < 10000));
    setSignals(sigs => sigs.filter(s => Date.now() - s.created < 5000));
  }, [agents]);

  const createTransaction = (from, to, amount) => {
    const tx = {
      id: `tx:${Date.now()}`,
      from: from.id,
      to: to.id,
      amount,
      state: 'pending',
      created: Date.now(),
    };

    setTransactions(txs => [...txs, tx]);
    setWorldStats(s => ({
      ...s,
      totalVolume: s.totalVolume + amount,
      activeTransactions: s.activeTransactions + 1,
    }));

    addLog(`[X402] Transaction: ${from.name} → ${to.name} (${amount} USDC)`);

    // Complete after delay
    setTimeout(() => {
      setTransactions(txs => txs.map(t =>
        t.id === tx.id ? { ...t, state: 'completed' } : t
      ));
      setAgents(ags => ags.map(a => {
        if (a.id === from.id) return { ...a, balance: a.balance - amount };
        if (a.id === to.id) return { ...a, balance: a.balance + amount };
        return a;
      }));
    }, 2000);
  };

  const broadcastSignal = (source) => {
    const signalTypes = ['price_alert', 'opportunity', 'risk_warning', 'caravan_forming'];
    const signalType = signalTypes[Math.floor(Math.random() * signalTypes.length)];

    const signal = {
      id: `sg:${Date.now()}`,
      source: source.id,
      sourceName: source.name,
      type: signalType,
      created: Date.now(),
    };

    setSignals(sigs => [...sigs, signal]);
    setWorldStats(s => ({ ...s, signalCount: s.signalCount + 1 }));
    addLog(`[SIGNAL] ${source.name} broadcast: ${signalType}`);
  };

  const addLog = (message) => {
    setTerminalLogs(logs => [...logs.slice(-50), { time: new Date().toISOString(), message }]);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: THEME.void,
      color: THEME.text,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    }}>
      {/* Header */}
      <Header worldStats={worldStats} time={time} onToggleTerminal={() => setShowTerminal(!showTerminal)} />

      <div style={{ display: 'flex', padding: '20px', gap: '20px' }}>
        {/* Main World View */}
        <div style={{ flex: 1 }}>
          <WorldMap
            zones={ZONES}
            agents={agents}
            transactions={transactions}
            signals={signals}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            onSelectAgent={setSelectedAgent}
          />
        </div>

        {/* Side Panel */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <AgentList
            agents={agents}
            selectedAgent={selectedAgent}
            onSelectAgent={setSelectedAgent}
          />

          {selectedAgent && (
            <AgentDetail
              agent={agents.find(a => a.id === selectedAgent)}
              onClose={() => setSelectedAgent(null)}
            />
          )}

          {selectedZone && (
            <ZoneDetail
              zone={ZONES.find(z => z.id === selectedZone)}
              agents={agents.filter(a => a.zone === selectedZone)}
              onClose={() => setSelectedZone(null)}
            />
          )}

          <TransactionFeed transactions={transactions} agents={agents} />
        </div>
      </div>

      {/* Terminal Overlay */}
      {showTerminal && (
        <Terminal logs={terminalLogs} onClose={() => setShowTerminal(false)} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function Header({ worldStats, time, onToggleTerminal }) {
  return (
    <div style={{
      background: `linear-gradient(180deg, ${THEME.surface} 0%, ${THEME.dark} 100%)`,
      borderBottom: `1px solid ${THEME.purpleMist}`,
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          background: THEME.gradientPrimary,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          X402 WORLD
        </div>
        <div style={{
          padding: '4px 12px',
          background: THEME.greenMist,
          border: `1px solid ${THEME.green}`,
          borderRadius: '4px',
          fontSize: '12px',
          color: THEME.green,
        }}>
          {worldStats.networkStatus.toUpperCase()}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
        <Stat label="VOLUME" value={`$${worldStats.totalVolume.toLocaleString()}`} color={THEME.green} />
        <Stat label="ACTIVE TXS" value={worldStats.activeTransactions} color={THEME.purple} />
        <Stat label="SIGNALS" value={worldStats.signalCount} color={THEME.cyan} />
        <Stat label="UPTIME" value={formatTime(time)} color={THEME.gold} />

        <button
          onClick={onToggleTerminal}
          style={{
            background: THEME.purpleMist,
            border: `1px solid ${THEME.purple}`,
            color: THEME.purple,
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ⌘ TERMINAL
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: THEME.textMuted, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 'bold', color }}>{value}</div>
    </div>
  );
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD MAP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function WorldMap({ zones, agents, transactions, signals, selectedZone, onSelectZone, onSelectAgent }) {
  const canvasRef = React.useRef(null);

  // Draw the world
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear
    ctx.fillStyle = THEME.void;
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = THEME.purpleMist;
    ctx.lineWidth = 0.5;
    for (let x = 0; x < width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw zone connections
    ctx.strokeStyle = THEME.textMuted;
    ctx.lineWidth = 1;
    const connections = [
      ['nexus', 'exchange'], ['nexus', 'forge'], ['nexus', 'archive'], ['nexus', 'gateway'],
      ['exchange', 'vault'], ['forge', 'lab'], ['archive', 'vault'], ['archive', 'lab'],
      ['gateway', 'commons'], ['forge', 'commons'],
    ];

    connections.forEach(([fromId, toId]) => {
      const from = zones.find(z => z.id === fromId);
      const to = zones.find(z => z.id === toId);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x * width / 100, from.y * height / 100);
        ctx.lineTo(to.x * width / 100, to.y * height / 100);
        ctx.stroke();
      }
    });

    // Draw zones
    zones.forEach(zone => {
      const x = zone.x * width / 100;
      const y = zone.y * height / 100;
      const r = zone.radius * width / 100;

      // Glow effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 1.5);
      gradient.addColorStop(0, zone.color + '40');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(x - r * 1.5, y - r * 1.5, r * 3, r * 3);

      // Zone circle
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = zone.color + '20';
      ctx.fill();
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = selectedZone === zone.id ? 3 : 1;
      ctx.stroke();

      // Zone label
      ctx.fillStyle = zone.color;
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(zone.name, x, y + r + 15);
    });

    // Draw transaction lines
    transactions.forEach(tx => {
      const fromAgent = agents.find(a => a.id === tx.from);
      const toAgent = agents.find(a => a.id === tx.to);
      if (!fromAgent || !toAgent) return;

      const fromZone = zones.find(z => z.id === fromAgent.zone);
      const toZone = zones.find(z => z.id === toAgent.zone);
      if (!fromZone || !toZone) return;

      const x1 = fromZone.x * width / 100;
      const y1 = fromZone.y * height / 100;
      const x2 = toZone.x * width / 100;
      const y2 = toZone.y * height / 100;

      // Animated line
      const progress = (Date.now() - tx.created) / 2000;
      const cx = x1 + (x2 - x1) * Math.min(progress, 1);
      const cy = y1 + (y2 - y1) * Math.min(progress, 1);

      ctx.strokeStyle = tx.state === 'completed' ? THEME.green : THEME.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Transaction indicator
      ctx.fillStyle = tx.state === 'completed' ? THEME.green : THEME.gold;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw signal pulses
    signals.forEach(signal => {
      const sourceAgent = agents.find(a => a.id === signal.source);
      if (!sourceAgent) return;

      const zone = zones.find(z => z.id === sourceAgent.zone);
      if (!zone) return;

      const x = zone.x * width / 100;
      const y = zone.y * height / 100;
      const age = (Date.now() - signal.created) / 5000;
      const radius = age * 50;
      const alpha = 1 - age;

      ctx.strokeStyle = THEME.cyan + Math.floor(alpha * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw agents
    agents.forEach(agent => {
      const zone = zones.find(z => z.id === agent.zone);
      if (!zone) return;

      const role = AGENT_ROLES[agent.role];
      const offset = agents.filter(a => a.zone === agent.zone).indexOf(agent);
      const angle = (offset / 6) * Math.PI * 2;
      const x = zone.x * width / 100 + Math.cos(angle) * zone.radius * width / 200;
      const y = zone.y * height / 100 + Math.sin(angle) * zone.radius * width / 200;

      // Agent dot
      ctx.fillStyle = role.color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Selection ring
      if (agent.id === selectedZone) {
        ctx.strokeStyle = THEME.textBright;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

  }, [zones, agents, transactions, signals, selectedZone]);

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * 100;
    const y = (e.clientY - rect.top) / rect.height * 100;

    // Check if clicked on a zone
    for (const zone of zones) {
      const dx = x - zone.x;
      const dy = y - zone.y;
      if (Math.sqrt(dx * dx + dy * dy) <= zone.radius) {
        onSelectZone(zone.id);
        return;
      }
    }
    onSelectZone(null);
  };

  return (
    <div style={{
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${THEME.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ color: THEME.textBright, fontWeight: 'bold' }}>🌐 WORLD MAP</span>
        <span style={{ color: THEME.textDim, fontSize: '12px' }}>
          {agents.length} agents • {zones.length} zones
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={700}
        height={500}
        onClick={handleClick}
        style={{ display: 'block', cursor: 'pointer' }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function AgentList({ agents, selectedAgent, onSelectAgent }) {
  return (
    <div style={{
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      borderRadius: '8px',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${THEME.border}`,
        color: THEME.textBright,
        fontWeight: 'bold',
      }}>
        🤖 ACTIVE AGENTS
      </div>
      <div style={{ maxHeight: '300px', overflow: 'auto' }}>
        {agents.map(agent => {
          const role = AGENT_ROLES[agent.role];
          return (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              style={{
                padding: '10px 16px',
                borderBottom: `1px solid ${THEME.border}`,
                cursor: 'pointer',
                background: selectedAgent === agent.id ? THEME.purpleMist : 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'background 0.2s',
              }}
            >
              <span style={{ fontSize: '20px' }}>{role.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: role.color, fontWeight: 'bold', fontSize: '12px' }}>{agent.name}</div>
                <div style={{ color: THEME.textDim, fontSize: '10px' }}>{role.title}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: THEME.green, fontSize: '12px' }}>${agent.balance}</div>
                <div style={{ color: THEME.textMuted, fontSize: '10px' }}>REP: {agent.reputation}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AGENT DETAIL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function AgentDetail({ agent, onClose }) {
  if (!agent) return null;
  const role = AGENT_ROLES[agent.role];

  return (
    <div style={{
      background: THEME.surface,
      border: `1px solid ${role.color}`,
      borderRadius: '8px',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${THEME.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>{role.icon}</span>
          <div>
            <div style={{ color: role.color, fontWeight: 'bold' }}>{agent.name}</div>
            <div style={{ color: THEME.textDim, fontSize: '11px' }}>{role.desc}</div>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: THEME.textDim,
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <DetailItem label="ID" value={agent.id} />
          <DetailItem label="ZONE" value={agent.zone.toUpperCase()} />
          <DetailItem label="BALANCE" value={`$${agent.balance.toLocaleString()}`} color={THEME.green} />
          <DetailItem label="REPUTATION" value={`${agent.reputation}/100`} color={THEME.gold} />
        </div>
        <div style={{ marginTop: '16px' }}>
          <div style={{ color: THEME.textMuted, fontSize: '10px', marginBottom: '8px' }}>CAPABILITIES</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['analysis', 'trading', 'signals'].map(cap => (
              <span key={cap} style={{
                padding: '2px 8px',
                background: THEME.purpleMist,
                border: `1px solid ${THEME.purple}`,
                borderRadius: '4px',
                fontSize: '10px',
                color: THEME.purple,
              }}>
                {cap}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ label, value, color = THEME.text }) {
  return (
    <div>
      <div style={{ color: THEME.textMuted, fontSize: '10px', marginBottom: '2px' }}>{label}</div>
      <div style={{ color, fontSize: '12px', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ZONE DETAIL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function ZoneDetail({ zone, agents, onClose }) {
  if (!zone) return null;

  return (
    <div style={{
      background: THEME.surface,
      border: `1px solid ${zone.color}`,
      borderRadius: '8px',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${THEME.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>{zone.icon}</span>
          <span style={{ color: zone.color, fontWeight: 'bold' }}>{zone.name}</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: THEME.textDim,
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <DetailItem label="TYPE" value={zone.type.toUpperCase()} />
          <DetailItem label="CAPACITY" value={`${agents.length}/${zone.capacity}`} />
        </div>
        <div style={{ marginTop: '16px' }}>
          <div style={{ color: THEME.textMuted, fontSize: '10px', marginBottom: '8px' }}>
            AGENTS IN ZONE ({agents.length})
          </div>
          {agents.map(agent => (
            <div key={agent.id} style={{
              padding: '6px 0',
              borderBottom: `1px solid ${THEME.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
            }}>
              <span style={{ color: AGENT_ROLES[agent.role].color }}>
                {AGENT_ROLES[agent.role].icon} {agent.name}
              </span>
              <span style={{ color: THEME.textDim }}>{agent.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION FEED COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function TransactionFeed({ transactions, agents }) {
  const recentTxs = transactions.slice(-10).reverse();

  return (
    <div style={{
      background: THEME.surface,
      border: `1px solid ${THEME.border}`,
      borderRadius: '8px',
      flex: 1,
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: `1px solid ${THEME.border}`,
        color: THEME.textBright,
        fontWeight: 'bold',
      }}>
        📡 TRANSACTION FEED
      </div>
      <div style={{ maxHeight: '200px', overflow: 'auto' }}>
        {recentTxs.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: THEME.textMuted }}>
            Waiting for transactions...
          </div>
        ) : (
          recentTxs.map(tx => {
            const from = agents.find(a => a.id === tx.from);
            const to = agents.find(a => a.id === tx.to);
            return (
              <div key={tx.id} style={{
                padding: '8px 16px',
                borderBottom: `1px solid ${THEME.border}`,
                fontSize: '11px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: THEME.textDim }}>
                    {from?.name || 'Unknown'} → {to?.name || 'Unknown'}
                  </span>
                  <span style={{ color: tx.state === 'completed' ? THEME.green : THEME.gold }}>
                    {tx.state === 'completed' ? '✓' : '◌'} ${tx.amount}
                  </span>
                </div>
                <div style={{ color: THEME.textMuted, fontSize: '9px' }}>
                  {tx.id}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TERMINAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

function Terminal({ logs, onClose }) {
  const logsEndRef = React.useRef(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '300px',
      background: THEME.abyss,
      borderTop: `1px solid ${THEME.purple}`,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '8px 16px',
        borderBottom: `1px solid ${THEME.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ color: THEME.purple, fontWeight: 'bold' }}>⌘ X402 TERMINAL</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: THEME.textDim,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 16px', fontFamily: 'monospace', fontSize: '11px' }}>
        {logs.map((log, i) => (
          <div key={i} style={{ marginBottom: '4px' }}>
            <span style={{ color: THEME.textMuted }}>[{log.time.split('T')[1].split('.')[0]}]</span>
            <span style={{ color: THEME.text, marginLeft: '8px' }}>{log.message}</span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}

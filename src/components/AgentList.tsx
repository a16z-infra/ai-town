import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useState } from 'react';
import { useServerGame } from '../hooks/serverGame';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat';

export default function AgentList() {
  useWorldHeartbeat();
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const game = useServerGame(worldId);
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'gold' | 'energy'>('name');

  if (!game || !worldId) return <div style={{ padding: '20px', color: '#8B9BB4' }}>Loading...</div>;

  const players = [...game.world.players.values()].filter((p) => !p.human);
  const agents = [...game.world.agents.values()];

  const rows = players.map((player) => {
    const desc = game.playerDescriptions.get(player.id);
    const agent = agents.find((a) => a.playerId === player.id);
    const agentDesc = agent ? game.agentDescriptions.get(agent.id) : undefined;
    const needs = player.needs ?? { hunger: 100, energy: 100 };
    const gold = player.gold ?? 0;
    return { player, desc, agentDesc, needs, gold };
  }).filter((r) => {
    if (!filter) return true;
    const f = filter.toUpperCase();
    return (r.desc?.name ?? '').toUpperCase().includes(f) ||
      (r.agentDesc?.mbti ?? '').includes(f);
  }).sort((a, b) => {
    if (sortBy === 'gold') return b.gold - a.gold;
    if (sortBy === 'energy') return (b.needs.energy) - (a.needs.energy);
    return (a.desc?.name ?? '').localeCompare(b.desc?.name ?? '');
  });

  return (
    <div style={{ padding: '16px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 className="font-display" style={{ fontSize: '28px', textAlign: 'center', marginBottom: '16px', color: '#EAD4AA' }}>
        Agent Directory
      </h1>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          type="text" placeholder="Filter by name or MBTI..."
          value={filter} onChange={(e) => setFilter(e.target.value)}
          style={{
            flex: 1, backgroundColor: '#181425', border: '1px solid #3A4466',
            borderRadius: '6px', padding: '8px 12px', color: '#C0CBDC', fontSize: '14px',
          }}
        />
        {(['name', 'gold', 'energy'] as const).map((s) => (
          <button key={s} onClick={() => setSortBy(s)} style={{
            backgroundColor: sortBy === s ? '#1d4ed8' : '#262040',
            color: sortBy === s ? 'white' : '#8B9BB4',
            border: '1px solid #3A4466', borderRadius: '6px', padding: '6px 12px',
            cursor: 'pointer', fontSize: '12px', textTransform: 'capitalize',
          }}>{s}</button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
        {rows.map(({ player, desc, agentDesc, needs, gold }) => (
          <div key={player.id} style={{
            backgroundColor: '#181425', borderRadius: '8px', padding: '14px',
            border: '1px solid #3A4466',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: 'white', fontSize: '15px' }}>{desc?.name ?? '???'}</span>
              <span style={{
                fontSize: '11px', padding: '2px 8px', borderRadius: '4px',
                backgroundColor: '#262040', color: '#C0CBDC', fontWeight: 'bold',
                border: `2px solid ${agentDesc?.archetype === 'villain' ? '#b91c1c' : agentDesc?.archetype === 'guardian' ? '#1d4ed8' : '#5A6988'}`,
              }}>{agentDesc?.mbti || '????'}</span>
            </div>
            <p style={{ fontSize: '11px', color: '#8B9BB4', marginBottom: '8px', lineHeight: '1.3' }}>
              {agentDesc?.personality?.background ?? ''}
            </p>
            <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
              <span style={{ color: gold > 50 ? '#22c55e' : gold > 15 ? '#eab308' : '#ef4444' }}>💰 {gold}g</span>
              <span style={{ color: needs.hunger > 50 ? '#22c55e' : '#ef4444' }}>🍖 {Math.round(needs.hunger)}</span>
              <span style={{ color: needs.energy > 50 ? '#3b82f6' : '#ef4444' }}>⚡ {Math.round(needs.energy)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

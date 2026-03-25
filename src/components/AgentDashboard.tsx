import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useServerGame } from '../hooks/serverGame';
import { GameId } from '../../convex/aiTown/ids';

const NEED_COLORS: Record<string, string> = {
  hunger: '#22c55e', energy: '#3b82f6', security: '#8b5cf6',
  social: '#ec4899', esteem: '#f59e0b', fulfillment: '#06b6d4',
};

const STAT_COLORS: Record<string, string> = {
  sociability: '#ec4899', diligence: '#22c55e', cunning: '#ef4444',
  justice: '#3b82f6', creativity: '#f59e0b', resilience: '#8b5cf6',
};

function NeedBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const barColor = pct > 50 ? color : pct > 30 ? '#eab308' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '2px' }}>
      <span style={{ width: '64px', textAlign: 'right', color: '#E4A672' }}>{label}</span>
      <div style={{ flex: 1, height: '8px', backgroundColor: '#3F2832', borderRadius: '4px', overflow: 'hidden', border: '1px solid #5A6988' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: barColor, borderRadius: '4px', transition: 'width 1s' }} />
      </div>
      <span style={{ width: '24px', textAlign: 'right', fontFamily: 'monospace', color: '#C0CBDC', fontSize: '10px' }}>{Math.round(pct)}</span>
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '2px' }}>
      <span style={{ width: '72px', textAlign: 'right', color: '#E4A672' }}>{label}</span>
      <div style={{ flex: 1, height: '6px', backgroundColor: '#3F2832', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value * 10}%`, backgroundColor: color, borderRadius: '3px' }} />
      </div>
      <span style={{ width: '16px', textAlign: 'right', fontFamily: 'monospace', color: '#C0CBDC', fontSize: '10px' }}>{value}</span>
    </div>
  );
}

function AgentCard({ worldId, game, playerId }: { worldId: any; game: any; playerId: GameId<'players'> }) {
  const [expanded, setExpanded] = useState(false);
  const player = game.world.players.get(playerId);
  if (!player || player.human) return null;

  const desc = game.playerDescriptions.get(playerId);
  const agent = [...game.world.agents.values()].find((a: any) => a.playerId === playerId);
  const agentDesc = agent ? game.agentDescriptions.get(agent.id) : undefined;
  const needs = player.needs ?? { hunger: 100, energy: 100, security: 80, social: 70, esteem: 60, fulfillment: 50 };
  const gold = player.gold ?? 0;
  const stats = agentDesc?.stats;
  const inv = player.inventory ?? { wood: 0, ore: 0, herbs: 0, food: 0 };
  const totalRes = [inv.wood, inv.ore, inv.herbs, inv.food].reduce((a, b) => a + (b ?? 0), 0);

  const plans = useQuery(api.townNews.getAgentPlans, { worldId, playerId });
  const memories = useQuery(api.townNews.getShortTermMemoriesPublic, { playerId });

  const conversation = game.world.playerConversation(player);
  let status = 'Idle';
  let statusEmoji = '⏸️';
  if (conversation) {
    const otherPlayerId = [...conversation.participants.keys()].find((id: any) => id !== playerId);
    const otherDesc = otherPlayerId ? game.playerDescriptions.get(otherPlayerId) : undefined;
    status = `Talking to ${otherDesc?.name ?? 'someone'}`;
    statusEmoji = '💬';
  } else if (player.activity && player.activity.until > Date.now()) {
    status = player.activity.description;
    statusEmoji = player.activity.emoji || '🔄';
  } else if (player.pathfinding) {
    status = 'Walking';
    statusEmoji = '🚶';
  }

  return (
    <div style={{
      backgroundColor: '#181425', borderRadius: '8px', padding: '12px',
      border: `1px solid ${expanded ? '#8B9BB4' : '#3A4466'}`, cursor: 'pointer',
      transition: 'border-color 0.2s',
    }} onClick={() => setExpanded(!expanded)}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontWeight: 'bold', color: 'white', fontSize: '15px' }}>{desc?.name ?? '???'}</span>
        {agentDesc?.mbti && (
          <span style={{
            fontSize: '10px', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#262040',
            color: '#C0CBDC', fontWeight: 'bold', border: `2px solid ${agentDesc.archetype === 'villain' ? '#b91c1c' : agentDesc.archetype === 'guardian' ? '#1d4ed8' : '#5A6988'}`,
          }}>{agentDesc.mbti}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#E4A672' }}>{statusEmoji} {status}</span>
      </div>

      {/* Gold + Resources */}
      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#C0CBDC', marginBottom: '6px' }}>
        <span style={{ color: gold > 50 ? '#22c55e' : gold > 15 ? '#eab308' : '#ef4444' }}>💰 {gold}g</span>
        {totalRes > 0 && <span>📦 {totalRes} items</span>}
        {(player.influence ?? 0) > 0 && <span style={{ color: '#f59e0b' }}>⭐ {player.influence}</span>}
      </div>

      {/* Maslow Needs */}
      <div style={{ marginBottom: '4px' }}>
        <NeedBar label="Hunger" value={needs.hunger} color={NEED_COLORS.hunger} />
        <NeedBar label="Energy" value={needs.energy} color={NEED_COLORS.energy} />
        <NeedBar label="Security" value={needs.security ?? 80} color={NEED_COLORS.security} />
        <NeedBar label="Social" value={needs.social ?? 70} color={NEED_COLORS.social} />
        <NeedBar label="Esteem" value={needs.esteem ?? 60} color={NEED_COLORS.esteem} />
        <NeedBar label="Purpose" value={needs.fulfillment ?? 50} color={NEED_COLORS.fulfillment} />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ marginTop: '8px', borderTop: '1px solid #3A4466', paddingTop: '8px' }}>
          {/* Six-dim stats */}
          {stats && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#E4A672', marginBottom: '4px', fontWeight: 'bold' }}>Attributes</div>
              {Object.entries(STAT_COLORS).map(([key, color]) => (
                <StatBar key={key} label={key} value={(stats as any)[key] ?? 5} color={color} />
              ))}
            </div>
          )}

          {/* Inventory */}
          {totalRes > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#E4A672', marginBottom: '4px', fontWeight: 'bold' }}>Inventory</div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: '#C0CBDC' }}>
                {inv.wood > 0 && <span>🪵 {inv.wood}</span>}
                {inv.ore > 0 && <span>⛏️ {inv.ore}</span>}
                {inv.herbs > 0 && <span>🌿 {inv.herbs}</span>}
                {inv.food > 0 && <span>🍎 {inv.food}</span>}
              </div>
            </div>
          )}

          {/* Future plans */}
          {plans && plans.plans.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#E4A672', marginBottom: '4px', fontWeight: 'bold' }}>Plans</div>
              {plans.plans.map((p: string, i: number) => (
                <div key={i} style={{ fontSize: '11px', color: '#C0CBDC', marginBottom: '2px' }}>
                  <span style={{ color: '#f59e0b' }}>{i + 1}.</span> {p}
                </div>
              ))}
            </div>
          )}

          {/* Recent memories */}
          {memories && memories.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', color: '#E4A672', marginBottom: '4px', fontWeight: 'bold' }}>Recent Memory</div>
              {memories.slice(0, 5).map((m: any, i: number) => (
                <div key={i} style={{ fontSize: '10px', color: '#8B9BB4', marginBottom: '2px' }}>
                  [{m.type}] {m.content.slice(0, 80)}{m.content.length > 80 ? '...' : ''}
                </div>
              ))}
            </div>
          )}

          {/* Identity */}
          {agentDesc?.identity && (
            <div style={{ marginTop: '6px', fontSize: '10px', color: '#5A6988', fontStyle: 'italic' }}>
              {agentDesc.identity.slice(0, 150)}...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentDashboard() {
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const game = useServerGame(worldId);
  const latestVote = useQuery(api.townNews.getLatestVote, worldId ? { worldId } : 'skip');

  if (!worldId || !game) {
    return <div style={{ padding: '20px', color: '#C0CBDC', textAlign: 'center' }}>Loading...</div>;
  }

  const players = [...game.world.players.values()].filter((p) => !p.human);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 100px)' }}>
      {/* Town Vote Banner */}
      {latestVote && (
        <div style={{
          backgroundColor: '#181425', borderRadius: '8px', padding: '12px 16px',
          marginBottom: '16px', border: `1px solid ${latestVote.status === 'active' ? '#1d4ed8' : '#3A4466'}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🗳️</span>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>Town Vote</span>
            <span style={{
              fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
              backgroundColor: latestVote.status === 'active' ? '#1d4ed8' : '#22c55e',
              color: 'white', fontWeight: 'bold',
            }}>{latestVote.status === 'active' ? 'VOTING' : 'CLOSED'}</span>
          </div>
          <div style={{ color: '#C0CBDC', fontSize: '13px', marginTop: '4px' }}>{latestVote.topic}</div>
          {latestVote.status === 'closed' && latestVote.result && (
            <div style={{ color: '#22c55e', fontSize: '12px', marginTop: '4px' }}>Result: {latestVote.result} ({latestVote.votes.length} votes)</div>
          )}
          {latestVote.status === 'active' && (
            <div style={{ color: '#eab308', fontSize: '11px', marginTop: '4px' }}>{latestVote.votes.length} votes so far</div>
          )}
        </div>
      )}

      {/* POI Mini Map */}
      <div style={{
        backgroundColor: '#181425', borderRadius: '8px', padding: '12px 16px',
        marginBottom: '16px', border: '1px solid #3A4466',
      }}>
        <div style={{ fontSize: '14px', color: 'white', fontWeight: 'bold', marginBottom: '8px' }}>Town Map - Points of Interest</div>
        <div style={{ position: 'relative', width: '100%', height: '120px', backgroundColor: '#262040', borderRadius: '6px', overflow: 'hidden' }}>
          {/* POI markers */}
          {[
            { name: '🏠 House A', x: 5, y: 5, w: 10, h: 10 },
            { name: '🏠 House B', x: 5, y: 75, w: 10, h: 10 },
            { name: '🏠 House C', x: 63, y: 2, w: 8, h: 8 },
            { name: '🍜 Restaurant', x: 50, y: 4, w: 8, h: 12 },
            { name: '🏛️ Square', x: 38, y: 44, w: 12, h: 12 },
            { name: '🆓 Welfare', x: 70, y: 69, w: 5, h: 8 },
            { name: '🌳 Park', x: 23, y: 73, w: 16, h: 12 },
            { name: '🌲 Forest', x: 2, y: 31, w: 11, h: 17 },
            { name: '🌿 Herbs', x: 78, y: 79, w: 13, h: 10 },
          ].map((poi) => (
            <div key={poi.name} style={{
              position: 'absolute', left: `${poi.x}%`, top: `${poi.y}%`, width: `${poi.w}%`, height: `${poi.h}%`,
              backgroundColor: '#3A446640', border: '1px solid #5A6988', borderRadius: '3px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', color: '#C0CBDC', whiteSpace: 'nowrap', overflow: 'hidden',
            }}>{poi.name}</div>
          ))}
          {/* Agent positions */}
          {players.map((p) => {
            const desc = game.playerDescriptions.get(p.id);
            const pctX = (p.position.x / 64) * 100;
            const pctY = (p.position.y / 48) * 100;
            return (
              <div key={p.id} title={desc?.name} style={{
                position: 'absolute', left: `${pctX}%`, top: `${pctY}%`,
                width: '6px', height: '6px', borderRadius: '50%',
                backgroundColor: '#ef4444', border: '1px solid white',
                transform: 'translate(-50%, -50%)', zIndex: 10,
              }} />
            );
          })}
        </div>
      </div>

      {/* Agent Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: '12px',
      }}>
        {players.map((player) => (
          <AgentCard key={player.id} worldId={worldId} game={game} playerId={player.id} />
        ))}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { ServerGame } from '../hooks/serverGame';
import { GameId } from '../../convex/aiTown/ids';

function NeedsBar({ label, value, barColor: customColor }: { label: string; value: number; barColor?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  const barColor = customColor ?? (pct > 50 ? '#22c55e' : pct > 30 ? '#eab308' : '#ef4444');

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '2px' }}>
      <span style={{ width: '48px', textAlign: 'right', color: '#E4A672' }}>{label}</span>
      <div style={{
        flex: 1,
        height: '8px',
        backgroundColor: '#3F2832',
        borderRadius: '4px',
        overflow: 'hidden',
        border: '1px solid #5A6988',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: barColor,
          transition: 'width 2s ease, background-color 0.5s ease',
          borderRadius: '4px',
        }} />
      </div>
      <span style={{ width: '28px', textAlign: 'right', fontFamily: 'monospace', color: '#C0CBDC' }}>
        {Math.round(pct)}
      </span>
    </div>
  );
}

function MbtiBadge({ mbti, archetype }: { mbti?: string; archetype: string }) {
  const archetypeColors: Record<string, string> = {
    normal: '#5A6988',
    villain: '#b91c1c',
    guardian: '#1d4ed8',
  };
  const borderColor = archetypeColors[archetype] || archetypeColors.normal;
  return (
    <span style={{
      fontSize: '10px',
      padding: '1px 6px',
      borderRadius: '4px',
      backgroundColor: '#262040',
      color: '#C0CBDC',
      fontWeight: 'bold',
      letterSpacing: '0.5px',
      border: `2px solid ${borderColor}`,
    }}>
      {mbti || archetype}
    </span>
  );
}

export default function AgentStatusPanel({
  game,
  onSelectPlayer,
}: {
  game: ServerGame;
  onSelectPlayer?: (id: GameId<'players'>) => void;
}) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const players = [...game.world.players.values()].filter((p) => !p.human);
  const agents = [...game.world.agents.values()];

  if (players.length === 0) return null;

  return (
    <div style={{ marginBottom: '16px' }}>
      <h3
        className="bg-brown-700 font-display shadow-solid"
        style={{
          padding: '6px 8px',
          fontSize: '18px',
          letterSpacing: '1px',
          textAlign: 'center',
          marginBottom: '8px',
        }}
      >
        Agent Status
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {players.map((player) => {
          const desc = game.playerDescriptions.get(player.id);
          const agent = agents.find((a) => a.playerId === player.id);
          const agentDesc = agent ? game.agentDescriptions.get(agent.id) : undefined;
          const needs = player.needs ?? { hunger: 100, energy: 100, security: 80, social: 70, esteem: 60, fulfillment: 50 };
          const gold = player.gold ?? 0;
          const conversation = game.world.playerConversation(player);
          const isInConversation = !!conversation;

          let statusText = '';
          let statusEmoji = '';
          if (isInConversation) {
            const otherPlayerId = [...conversation.participants.keys()].find((id) => id !== player.id);
            const otherDesc = otherPlayerId ? game.playerDescriptions.get(otherPlayerId) : undefined;
            statusText = `Talking to ${otherDesc?.name ?? 'someone'}`;
            statusEmoji = '💬';
          } else if (player.activity && player.activity.until > Date.now()) {
            statusText = player.activity.description;
            statusEmoji = player.activity.emoji || '';
          } else if (player.pathfinding) {
            statusText = 'Walking...';
            statusEmoji = '🚶';
          } else {
            statusText = 'Idle';
            statusEmoji = '⏸️';
          }

          return (
            <div
              key={player.id}
              onClick={() => onSelectPlayer?.(player.id)}
              style={{
                backgroundColor: '#181425',
                borderRadius: '6px',
                padding: '8px 10px',
                cursor: onSelectPlayer ? 'pointer' : 'default',
                border: `1px solid ${hoveredId === player.id ? '#8B9BB4' : '#3A4466'}`,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={() => setHoveredId(player.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontWeight: 'bold', color: 'white', fontSize: '13px' }}>
                  {desc?.name ?? '???'}
                </span>
                {agentDesc && <MbtiBadge mbti={agentDesc.mbti} archetype={agentDesc.archetype} />}
                <span style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  color: '#E4A672',
                  maxWidth: '140px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {statusEmoji} {statusText}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '2px' }}>
                <span style={{ width: '48px', textAlign: 'right', color: '#E4A672' }}>Gold</span>
                <span style={{ flex: 1, fontFamily: 'monospace', color: gold > 50 ? '#22c55e' : gold > 15 ? '#eab308' : '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
                  {gold}g
                </span>
              </div>
              <NeedsBar label="Hunger" value={needs.hunger} barColor={needs.hunger > 50 ? '#22c55e' : needs.hunger > 30 ? '#eab308' : '#ef4444'} />
              <NeedsBar label="Energy" value={needs.energy} barColor={needs.energy > 50 ? '#3b82f6' : needs.energy > 20 ? '#eab308' : '#ef4444'} />
              <NeedsBar label="Security" value={needs.security ?? 80} barColor={needs.security > 50 ? '#8b5cf6' : needs.security > 30 ? '#eab308' : '#ef4444'} />
              <NeedsBar label="Social" value={needs.social ?? 70} barColor={needs.social > 50 ? '#ec4899' : needs.social > 30 ? '#eab308' : '#ef4444'} />
              <NeedsBar label="Esteem" value={needs.esteem ?? 60} barColor={needs.esteem > 50 ? '#f59e0b' : needs.esteem > 30 ? '#eab308' : '#ef4444'} />
              <NeedsBar label="Purpose" value={needs.fulfillment ?? 50} barColor={needs.fulfillment > 50 ? '#06b6d4' : needs.fulfillment > 30 ? '#eab308' : '#ef4444'} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

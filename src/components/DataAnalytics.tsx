import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useServerGame } from '../hooks/serverGame';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat';

export default function DataAnalytics() {
  useWorldHeartbeat();
  const worldStatus = useQuery(api.world.defaultWorldStatus);
  const worldId = worldStatus?.worldId;
  const game = useServerGame(worldId);
  const relationships = useQuery(api.townNews.getRelationships, worldId ? { worldId } : 'skip');
  const news = useQuery(api.townNews.latestTownNews, worldId ? { worldId } : 'skip');

  if (!game || !worldId) return <div style={{ padding: '20px', color: '#8B9BB4' }}>Loading...</div>;

  const players = [...game.world.players.values()].filter((p) => !p.human);
  const agents = [...game.world.agents.values()];

  // Compute stats
  const playerData = players.map((p) => {
    const agent = agents.find((a) => a.playerId === p.id);
    const desc = agent ? game.agentDescriptions.get(agent.id) : undefined;
    return { id: p.id, name: game.playerDescriptions.get(p.id)?.name ?? '?', gold: p.gold ?? 0, mbti: desc?.mbti ?? '?', needs: p.needs ?? { hunger: 100, energy: 100 } };
  });
  const avgGold = playerData.reduce((s, p) => s + p.gold, 0) / (playerData.length || 1);
  const totalRelationships = relationships?.length ?? 0;

  // MBTI distribution
  const mbtiCounts: Record<string, number> = {};
  const mbtiGold: Record<string, number[]> = {};
  for (const p of playerData) {
    mbtiCounts[p.mbti] = (mbtiCounts[p.mbti] ?? 0) + 1;
    if (!mbtiGold[p.mbti]) mbtiGold[p.mbti] = [];
    mbtiGold[p.mbti].push(p.gold);
  }

  // Wealth distribution
  const wealthBuckets = [
    { label: '0-20', min: 0, max: 20, count: 0 },
    { label: '21-50', min: 21, max: 50, count: 0 },
    { label: '51-100', min: 51, max: 100, count: 0 },
    { label: '101+', min: 101, max: Infinity, count: 0 },
  ];
  for (const p of playerData) {
    const b = wealthBuckets.find((b) => p.gold >= b.min && p.gold <= b.max);
    if (b) b.count++;
  }
  const maxBucket = Math.max(...wealthBuckets.map((b) => b.count), 1);

  return (
    <div style={{ padding: '16px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 className="font-display" style={{ fontSize: '28px', textAlign: 'center', marginBottom: '16px', color: '#EAD4AA' }}>
        Town Analytics
      </h1>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Agents', value: playerData.length, color: '#3b82f6' },
          { label: 'Avg Gold', value: Math.round(avgGold), color: '#eab308' },
          { label: 'Relationships', value: totalRelationships, color: '#22c55e' },
          { label: 'News Reports', value: news?.length ?? 0, color: '#a855f7' },
        ].map((card) => (
          <div key={card.label} style={{
            backgroundColor: '#181425', borderRadius: '8px', padding: '14px',
            border: '1px solid #3A4466', textAlign: 'center',
          }}>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: card.color }}>{card.value}</div>
            <div style={{ fontSize: '12px', color: '#8B9BB4' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Wealth Distribution */}
      <div style={{ backgroundColor: '#181425', borderRadius: '8px', padding: '16px', border: '1px solid #3A4466', marginBottom: '16px' }}>
        <h3 style={{ color: '#EAD4AA', fontSize: '16px', marginBottom: '12px' }}>Wealth Distribution</h3>
        <div style={{ display: 'flex', alignItems: 'end', gap: '8px', height: '120px' }}>
          {wealthBuckets.map((b) => (
            <div key={b.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#C0CBDC', marginBottom: '4px' }}>{b.count}</span>
              <div style={{
                width: '100%', backgroundColor: '#eab308', borderRadius: '4px 4px 0 0',
                height: `${(b.count / maxBucket) * 100}px`, minHeight: b.count > 0 ? '8px' : '0',
                transition: 'height 0.5s',
              }} />
              <span style={{ fontSize: '10px', color: '#8B9BB4', marginTop: '4px' }}>{b.label}g</span>
            </div>
          ))}
        </div>
      </div>

      {/* MBTI Analysis */}
      <div style={{ backgroundColor: '#181425', borderRadius: '8px', padding: '16px', border: '1px solid #3A4466', marginBottom: '16px' }}>
        <h3 style={{ color: '#EAD4AA', fontSize: '16px', marginBottom: '12px' }}>MBTI Analysis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
          {Object.entries(mbtiCounts).map(([type, count]) => {
            const avg = Math.round((mbtiGold[type]?.reduce((s, v) => s + v, 0) ?? 0) / count);
            return (
              <div key={type} style={{
                backgroundColor: '#262040', borderRadius: '6px', padding: '8px', textAlign: 'center',
              }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#C0CBDC' }}>{type}</div>
                <div style={{ fontSize: '11px', color: '#8B9BB4' }}>{count} agent{count > 1 ? 's' : ''}</div>
                <div style={{ fontSize: '12px', color: '#eab308', marginTop: '4px' }}>Avg: {avg}g</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Social Network */}
      <div style={{ backgroundColor: '#181425', borderRadius: '8px', padding: '16px', border: '1px solid #3A4466' }}>
        <h3 style={{ color: '#EAD4AA', fontSize: '16px', marginBottom: '12px' }}>Social Network</h3>
        {!relationships || relationships.length === 0 ? (
          <p style={{ color: '#8B9BB4', fontSize: '13px' }}>No relationships formed yet. Wait for agents to interact.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {relationships.map((rel: any) => {
              const p1Name = playerData.find((p) => p.id === rel.player1)?.name ?? rel.player1;
              const p2Name = playerData.find((p) => p.id === rel.player2)?.name ?? rel.player2;
              const trustColor = rel.trustValue > 20 ? '#22c55e' : rel.trustValue < -10 ? '#ef4444' : '#eab308';
              return (
                <div key={rel._id} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  backgroundColor: '#262040', borderRadius: '6px', padding: '6px 10px',
                }}>
                  <span style={{ color: '#C0CBDC', fontSize: '12px', flex: 1 }}>{p1Name}</span>
                  <span style={{ color: trustColor, fontSize: '14px', fontWeight: 'bold', width: '60px', textAlign: 'center' }}>
                    {rel.trustValue > 0 ? '+' : ''}{rel.trustValue}
                  </span>
                  <span style={{ color: '#C0CBDC', fontSize: '12px', flex: 1, textAlign: 'right' }}>{p2Name}</span>
                  <span style={{ color: '#8B9BB4', fontSize: '10px' }}>({rel.interactionCount}x)</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

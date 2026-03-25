import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useState } from 'react';

export default function TownNewsPanel({ worldId }: { worldId: Id<'worlds'> }) {
  const news = useQuery(api.townNews.latestTownNews, { worldId });
  const [expanded, setExpanded] = useState(true);

  return (
    <div style={{ marginTop: '16px' }}>
      <h3
        className="bg-brown-700 font-display shadow-solid"
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '6px 8px',
          fontSize: '18px',
          letterSpacing: '1px',
          textAlign: 'center',
          marginBottom: '8px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        Town News {expanded ? '▾' : '▸'}
      </h3>
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {!news || news.length === 0 ? (
            <p style={{
              fontSize: '13px',
              color: '#8B9BB4',
              textAlign: 'center',
              padding: '12px',
              backgroundColor: '#181425',
              borderRadius: '6px',
              border: '1px solid #3A4466',
            }}>
              Welcome to Stanford Town! 6 AI agents with unique MBTI personalities live here. Watch them work, eat, socialize, and form relationships. Set life goals for your favorite agent!
            </p>
          ) : (
            news.map((item: any) => (
              <div
                key={item._id}
                style={{
                  backgroundColor: '#181425',
                  borderRadius: '6px',
                  padding: '10px',
                  border: '1px solid #3A4466',
                }}
              >
                <div style={{
                  fontWeight: 'bold',
                  color: '#EAD4AA',
                  fontSize: '13px',
                  marginBottom: '4px',
                }}>
                  {item.title}
                </div>
                <p style={{
                  color: '#C0CBDC',
                  fontSize: '12px',
                  lineHeight: '1.4',
                  margin: 0,
                }}>
                  {item.summary}
                </p>
                <div style={{
                  fontSize: '10px',
                  color: '#5A6988',
                  marginTop: '6px',
                }}>
                  {new Date(item.generatedAt).toLocaleTimeString()} · {item.rawEventCount} events
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useState } from 'react';

const EVENT_EMOJI: Record<string, string> = {
  eat: '\u{1F35C}',
  sleep: '\u{1F634}',
  work: '\u{1F4BC}',
  patrol: '\u{1F6E1}\uFE0F',
  wander: '\u{1F6B6}',
  invite: '\u{1F4AC}',
  welfare: '\u{1F195}',
  user_prompt: '\u{1F3AF}',
  visit: '\u{1F3E0}',
};

function getEventEmoji(type: string): string {
  return EVENT_EMOJI[type] || '\u{2728}';
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function LiveFeed({ worldId }: { worldId: Id<'worlds'> }) {
  const events = useQuery(api.townNews.latestEvents, { worldId });
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
        Live Feed {expanded ? '\u25BE' : '\u25B8'}
      </h3>
      {expanded && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          maxHeight: '280px',
          overflowY: 'auto',
        }}>
          {!events || events.length === 0 ? (
            <p style={{
              fontSize: '13px',
              color: '#8B9BB4',
              textAlign: 'center',
              padding: '12px',
              backgroundColor: '#181425',
              borderRadius: '6px',
              border: '1px solid #3A4466',
            }}>
              No events yet. Activity will appear here in real time.
            </p>
          ) : (
            events.map((event: { _id: string; type: string; detail: string; createdAt: number }) => (
              <div
                key={event._id}
                style={{
                  backgroundColor: '#181425',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  border: '1px solid #3A4466',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '16px', lineHeight: '1.4', flexShrink: 0 }}>
                  {getEventEmoji(event.type)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: '#C0CBDC',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {event.detail}
                  </p>
                  <span style={{
                    fontSize: '10px',
                    color: '#5A6988',
                    marginTop: '2px',
                    display: 'inline-block',
                  }}>
                    {formatTimeAgo(event.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

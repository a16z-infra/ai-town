import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import X402World from './components/X402World.jsx';
import RalphTown from './components/RalphTown';

export default function App() {
  const worldId = useQuery(api.x402World.publicQueries.getDefaultWorldId);
  const [view, setView] = useState<'x402' | 'ralph'>('x402');

  // Show loading while getting world ID
  if (worldId === undefined) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: '#E8E8F0',
        fontFamily: 'monospace'
      }}>
        Loading X402 World...
      </div>
    );
  }

  // If no world exists, show message
  if (worldId === null) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        color: '#E8E8F0',
        fontFamily: 'monospace',
        gap: '20px'
      }}>
        <h1>No World Found</h1>
        <p>Run: npx convex run x402World.init:createWorld</p>
      </div>
    );
  }

  return (
    <div>
      {/* View Toggle */}
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <button
          type="button"
          onClick={() => setView('x402')}
          style={{
            padding: '8px 16px',
            background: view === 'x402' ? '#9945FF' : 'rgba(40, 40, 60, 0.8)',
            color: '#fff',
            border: '1px solid #9945FF',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace'
          }}
        >
          X402 World
        </button>
        <button
          type="button"
          onClick={() => setView('ralph')}
          style={{
            padding: '8px 16px',
            background: view === 'ralph' ? '#9945FF' : 'rgba(40, 40, 60, 0.8)',
            color: '#fff',
            border: '1px solid #9945FF',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'monospace'
          }}
        >
          Ralph Town
        </button>
      </div>

      {/* Render selected view */}
      {view === 'x402' ? (
        <X402World />
      ) : (
        <RalphTown worldId={worldId} />
      )}
    </div>
  );
}

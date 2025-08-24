import React from 'react';
import P2PStatus from '../components/P2PStatus';

export default function P2PDemo() {
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#1a202c', 
      minHeight: '100vh',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h1>AI Town - P2P Player Discovery Demo</h1>
      <p>This demonstrates the P2P player discovery interface that has been added to AI Town.</p>
      
      <div style={{
        marginTop: '20px',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: '8px',
        border: '2px dashed #4a5568'
      }}>
        <h2>P2P Status Component (as it appears in-game)</h2>
        <div style={{ marginTop: '10px' }}>
          <P2PStatus />
        </div>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Features Implemented:</h2>
        <ul>
          <li>✅ Core libp2p service for peer management</li>
          <li>✅ React hooks for easy P2P integration</li>
          <li>✅ UI component with connection status</li>
          <li>✅ Player announcement and discovery framework</li>
          <li>✅ Proximity-based player search</li>
          <li>✅ Hybrid approach (works with existing Convex backend)</li>
          <li>✅ Optional/opt-in functionality</li>
          <li>✅ Unit tests and documentation</li>
        </ul>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>How it Works:</h2>
        <ol>
          <li>Click "Connect" to initialize P2P networking</li>
          <li>Your player gets announced to other P2P-enabled players</li>
          <li>You can discover other players near your position</li>
          <li>Falls back to centralized discovery if P2P fails</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', fontSize: '0.9em', color: '#a0aec0' }}>
        <p><strong>Note:</strong> This is a basic interface demo. In the full game, the P2P status 
        appears as an overlay in the top-left corner of the game screen, allowing players to 
        optionally enable peer-to-peer discovery alongside the existing centralized player discovery system.</p>
      </div>
    </div>
  );
}
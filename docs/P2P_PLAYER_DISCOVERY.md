# P2P Player Discovery in AI Town

This document describes the peer-to-peer (P2P) player discovery implementation in AI Town, which enables players to find each other through decentralized networking using libp2p.

## Overview

The P2P system provides an additional layer of player discovery that complements the existing centralized Convex backend. Players can discover and connect to each other directly, reducing server load and providing more resilient networking capabilities.

## Architecture

### Core Components

1. **P2PService** (`src/services/p2pService.ts`): The main service that handles libp2p node creation, peer discovery, and player announcements.

2. **React Hooks** (`src/hooks/useP2P.ts`): React hooks that provide easy integration with the P2P service for React components.

3. **P2PStatus Component** (`src/components/P2PStatus.tsx`): A UI component that shows the P2P connection status and allows users to connect/disconnect.

### Key Features

- **Hybrid Approach**: The P2P system works alongside the existing Convex backend, not as a replacement
- **Optional**: P2P functionality is opt-in and the game works perfectly without it
- **Browser Compatible**: Uses libp2p in a browser-friendly configuration
- **Proximity-based Discovery**: Players can find others near their position in the game world

## How It Works

1. **Initialization**: When a player enables P2P, a libp2p node is created with a unique peer ID
2. **Player Announcement**: Players broadcast their game information (position, name, etc.) to the P2P network
3. **Discovery**: Other players can query for nearby players through the P2P network
4. **Fallback**: If P2P discovery fails or is disabled, the system falls back to centralized discovery

## Usage

### For Users

1. Click the "Connect" button in the P2P status indicator (top-left of game screen)
2. Once connected, your player will be announced to other P2P-enabled players
3. You can discover other players who are also using P2P

### For Developers

```typescript
import { useP2P } from '../hooks/useP2P';

function MyComponent() {
  const { status, initializeP2P, announcePlayer, findPlayersNearby } = useP2P();
  
  // Initialize P2P
  useEffect(() => {
    initializeP2P();
  }, []);
  
  // Announce current player
  const handleAnnounce = () => {
    announcePlayer(playerId, playerName, { x: 10, y: 20 });
  };
  
  // Find nearby players
  const handleSearch = async () => {
    const nearby = await findPlayersNearby({ x: 10, y: 20 }, 50);
    console.log('Found players:', nearby);
  };
}
```

## Configuration

The P2P service can be configured when creating an instance:

```typescript
const p2pService = new P2PService({
  enableDiscovery: true,      // Enable automatic discovery
  maxConnections: 50,         // Maximum peer connections
  announceInterval: 30000,    // How often to announce presence (ms)
});
```

## Limitations

- **Browser Environment Only**: The current implementation is designed for browsers
- **Basic Discovery**: The initial implementation provides basic peer discovery without advanced DHT features
- **No Direct Messaging**: This implementation focuses on discovery; direct P2P messaging can be added later
- **Network Dependent**: P2P connections depend on NAT traversal and firewall configurations

## Future Enhancements

1. **Enhanced Transport**: Add WebRTC support for better peer-to-peer connectivity
2. **DHT Integration**: Implement distributed hash table for better peer discovery
3. **Direct Messaging**: Enable direct P2P communication between players
4. **Persistent Connections**: Maintain stable connections between frequent collaborators
5. **Network Health**: Add network quality monitoring and connection optimization

## Troubleshooting

### P2P Won't Connect
- Check browser console for WebRTC/network errors
- Ensure browser supports libp2p requirements
- Try refreshing the page and reconnecting

### No Players Discovered
- Ensure other players also have P2P enabled
- Check that players are within the search radius
- Network connectivity issues may prevent discovery

### Performance Issues
- Reduce `maxConnections` in P2P configuration
- Increase `announceInterval` to reduce network chatter
- Disable P2P if not needed

## Testing

Run P2P-specific tests:
```bash
npm test -- --testPathPattern="p2pService.test.ts"
```

The test suite includes basic functionality tests. Note that full libp2p integration testing requires a browser environment.
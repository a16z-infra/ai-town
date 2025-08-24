import React from 'react';
import { useP2P } from '../hooks/useP2P';

interface P2PStatusProps {
  className?: string;
}

export function P2PStatus({ className = '' }: P2PStatusProps) {
  const { status, initializeP2P, shutdownP2P } = useP2P();

  const handleToggleP2P = async () => {
    if (status.isConnected) {
      await shutdownP2P();
    } else {
      await initializeP2P();
    }
  };

  return (
    <div className={`p2p-status ${className}`}>
      <div className="flex items-center space-x-3">
        {/* Status indicator */}
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              status.isConnected ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <span className="text-sm font-medium">
            P2P: {status.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Toggle button */}
        <button
          onClick={handleToggleP2P}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            status.isConnected
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {status.isConnected ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {/* Peer ID display */}
      {status.peerId && (
        <div className="mt-2 text-xs text-gray-600">
          Peer ID: {status.peerId.substring(0, 16)}...
        </div>
      )}

      {/* Error display */}
      {status.error && (
        <div className="mt-2 text-xs text-red-600">
          Error: {status.error}
        </div>
      )}

      {/* Discovered players count */}
      {status.isConnected && (
        <div className="mt-2 text-xs text-gray-600">
          Discovered players: {status.discoveredPlayers.length}
        </div>
      )}
    </div>
  );
}

export default P2PStatus;
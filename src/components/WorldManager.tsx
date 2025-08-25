import React, { useState, useEffect } from 'react';
import { worldPersistence, WorldState } from '../lib/worldPersistence';
import { agentSimulation, Agent, Conversation } from '../lib/staticAgentSimulation';

interface WorldManagerProps {
  agents: Agent[];
  conversations: Conversation[];
  onWorldLoaded: () => void;
}

export default function WorldManager({ agents, conversations, onWorldLoaded }: WorldManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [worldStates, setWorldStates] = useState<Array<{ id: string; name: string; timestamp: number; agentCount: number }>>([]);
  const [selectedWorldId, setSelectedWorldId] = useState<string>('');
  const [saveWorldName, setSaveWorldName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadWorldList();
    }
  }, [isOpen]);

  const loadWorldList = async () => {
    try {
      const states = await worldPersistence.listWorldStates();
      setWorldStates(states);
    } catch (error) {
      console.error('Failed to load world states:', error);
    }
  };

  const handleSaveWorld = async () => {
    if (!saveWorldName.trim()) return;

    setIsLoading(true);
    try {
      await worldPersistence.saveWorldState(
        saveWorldName.trim(),
        agents,
        conversations,
        {
          totalTimeElapsed: Date.now(),
          totalConversations: conversations.length,
          userCharacters: agents.filter(a => a.isUserControlled).map(a => a.id)
        }
      );
      
      setSaveWorldName('');
      await loadWorldList();
      alert('World saved successfully!');
    } catch (error) {
      console.error('Failed to save world:', error);
      alert('Failed to save world. Please try again.');
    }
    setIsLoading(false);
  };

  const handleLoadWorld = async () => {
    if (!selectedWorldId) return;

    setIsLoading(true);
    try {
      const worldState = await worldPersistence.loadWorldState(selectedWorldId);
      if (worldState) {
        // Clear current simulation
        agentSimulation.stop();
        
        // Load agents and conversations from saved state
        agentSimulation.clearWorld(); // Clear and reset to default agents
        
        worldState.agents.forEach(agent => {
          if (agent.isUserControlled) {
            // Don't restore user characters automatically
            return;
          }
          agentSimulation.getAgentsMap().set(agent.id, agent);
        });

        worldState.conversations.forEach(conversation => {
          agentSimulation.getConversationsMap().set(conversation.id, conversation);
        });

        onWorldLoaded();
        alert(`World "${worldState.name}" loaded successfully!`);
        setIsOpen(false);
      }
    } catch (error) {
      console.error('Failed to load world:', error);
      alert('Failed to load world. Please try again.');
    }
    setIsLoading(false);
  };

  const handleDeleteWorld = async (worldId: string) => {
    if (!confirm('Are you sure you want to delete this world? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      await worldPersistence.deleteWorldState(worldId);
      await loadWorldList();
      alert('World deleted successfully!');
    } catch (error) {
      console.error('Failed to delete world:', error);
      alert('Failed to delete world. Please try again.');
    }
    setIsLoading(false);
  };

  const handleExportWorlds = async () => {
    try {
      const blob = await worldPersistence.exportWorldData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `aitown-worlds-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export worlds:', error);
      alert('Failed to export worlds. Please try again.');
    }
  };

  const handleImportWorlds = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const imported = await worldPersistence.importWorldData(file);
      await loadWorldList();
      alert(`Successfully imported ${imported} world states!`);
    } catch (error) {
      console.error('Failed to import worlds:', error);
      alert('Failed to import worlds. Please check the file format.');
    }
    setIsLoading(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
      >
        🌍 Manage Worlds
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">World Manager</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Save Current World */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-green-800 mb-2">Save Current World</h3>
          <p className="text-sm text-green-600 mb-3">
            Save the current state with {agents.length} characters and {conversations.length} conversations
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter world name..."
              value={saveWorldName}
              onChange={(e) => setSaveWorldName(e.target.value)}
              className="flex-1 border border-gray-300 rounded px-3 py-2"
              disabled={isLoading}
            />
            <button
              onClick={handleSaveWorld}
              disabled={!saveWorldName.trim() || isLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              {isLoading ? '...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Load World */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-blue-800 mb-2">Load Saved World</h3>
          <div className="space-y-2">
            {worldStates.length === 0 ? (
              <p className="text-gray-500 text-sm">No saved worlds found</p>
            ) : (
              worldStates.map(world => (
                <div key={world.id} className="flex items-center justify-between bg-white border rounded p-3">
                  <div className="flex-1">
                    <div className="font-medium">{world.name}</div>
                    <div className="text-sm text-gray-500">
                      {world.agentCount} characters • {new Date(world.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedWorldId(world.id);
                        handleLoadWorld();
                      }}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => handleDeleteWorld(world.id)}
                      disabled={isLoading}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Import/Export */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-bold text-gray-800 mb-2">Import/Export</h3>
          <div className="flex gap-2">
            <button
              onClick={handleExportWorlds}
              disabled={isLoading || worldStates.length === 0}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded"
            >
              Export All Worlds
            </button>
            <label className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded cursor-pointer">
              Import Worlds
              <input
                type="file"
                accept=".json"
                onChange={handleImportWorlds}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Export your worlds as JSON files for backup or sharing. Import previously exported world data.
          </p>
        </div>

        {/* Information */}
        <div className="mt-4 text-xs text-gray-500">
          <p>
            World persistence uses DuckDB-WASM for efficient local storage. 
            Data is stored in your browser and can be exported for backup.
          </p>
        </div>
      </div>
    </div>
  );
}
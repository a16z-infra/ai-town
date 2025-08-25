import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Stage, Container, Sprite } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { agentSimulation, Agent, Conversation } from '../lib/staticAgentSimulation';
import { clientLLM } from '../lib/clientLLM';
import { MapLoader } from '../lib/mapLoader';
import { PixiStaticMap } from './PixiStaticMap';
import { WorldMap } from '../lib/staticTypes';
import { characters } from '../../data/characters';
import UserControls from './UserControls';
import WorldManager from './WorldManager';

export default function PixiAgentWorld() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [llmReady, setLLMReady] = useState(false);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [userCharacterId, setUserCharacterId] = useState<string>();
  const [worldMap, setWorldMap] = useState<WorldMap | null>(null);
  const [showConversationLog, setShowConversationLog] = useState(false);
  const stageRef = useRef<any>(null);

  // Load world map
  useEffect(() => {
    const loadMap = async () => {
      try {
        const map = await MapLoader.loadWorldMap();
        setWorldMap(map);
        console.log('World map loaded successfully:', map);
      } catch (error) {
        console.error('Failed to load world map:', error);
      }
    };
    loadMap();
  }, []);

  useEffect(() => {
    // Initialize LLM
    const initLLM = async () => {
      try {
        await clientLLM.initialize();
        setLLMReady(true);
      } catch (error) {
        console.error('Failed to initialize LLM:', error);
      }
    };
    initLLM();

    // Set up simulation update callback
    agentSimulation.setOnUpdate(() => {
      setAgents([...agentSimulation.getAgents()]);
      setConversations([...agentSimulation.getActiveConversations()]);
    });

    return () => {
      agentSimulation.stop();
    };
  }, []);

  const startSimulation = () => {
    agentSimulation.start();
    setIsSimulationRunning(true);
  };

  const stopSimulation = () => {
    agentSimulation.stop();
    setIsSimulationRunning(false);
  };

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    if (!stageRef.current || !worldMap) return { x: screenX, y: screenY };
    
    // Simple conversion for now - could be enhanced with proper viewport handling
    return {
      x: screenX,
      y: screenY
    };
  }, [worldMap]);

  const handleMapClick = useCallback((event: any) => {
    if (!userCharacterId) return;

    const worldPos = screenToWorld(event.data.global.x, event.data.global.y);
    agentSimulation.moveUserCharacter(userCharacterId, worldPos);
  }, [userCharacterId, screenToWorld]);

  const handleUserCharacterCreated = (userId: string) => {
    setUserCharacterId(userId);
  };

  const handleUserCharacterRemoved = () => {
    setUserCharacterId(undefined);
  };

  const handleWorldLoaded = () => {
    setAgents([...agentSimulation.getAgents()]);
    setConversations([...agentSimulation.getActiveConversations()]);
  };

  // Render an agent sprite
  const renderAgent = (agent: Agent) => {
    const character = characters.find(c => c.name === agent.character);
    if (!character) return null;

    return (
      <Container
        key={agent.id}
        x={agent.position.x}
        y={agent.position.y}
        interactive
        click={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
        cursor="pointer"
      >
        {/* Character sprite */}
        <Sprite
          texture={PIXI.Texture.from(character.textureUrl)}
          anchor={0.5}
          width={32}
          height={32}
          tint={agent.isUserControlled ? 0xFFD700 : 0xFFFFFF}
        />
        
        {/* Status indicators */}
        {agent.currentConversation && (
          <Sprite
            texture={PIXI.Texture.from('data:image/svg+xml;base64,' + btoa('<svg width="16" height="16" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="6" fill="#3B82F6"/><text x="8" y="12" text-anchor="middle" fill="white" font-size="10">💬</text></svg>'))}
            x={16}
            y={-16}
            anchor={0.5}
          />
        )}
        
        {/* Movement target indicator */}
        {agent.targetPosition && (
          <Container x={agent.targetPosition.x - agent.position.x} y={agent.targetPosition.y - agent.position.y}>
            <Sprite
              texture={PIXI.Texture.from('data:image/svg+xml;base64,' + btoa('<svg width="12" height="12" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="4" fill="#FCD34D" opacity="0.7"/></svg>'))}
              anchor={0.5}
            />
          </Container>
        )}
      </Container>
    );
  };

  if (!worldMap) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading AI Town world...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-brown-800 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI Town - Enhanced with Sprites</h2>
          <p className="text-sm opacity-80">
            World: {worldMap.width}x{worldMap.height} tiles • 
            Agents using {clientLLM.isReady() ? '✅ Client-side LLM (DistilGPT-2)' : '🤖 Fallback AI'}
          </p>
        </div>
        <div className="flex gap-2">
          <WorldManager 
            agents={agents}
            conversations={conversations}
            onWorldLoaded={handleWorldLoaded}
          />
          {!isSimulationRunning ? (
            <button
              onClick={startSimulation}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Start Simulation
            </button>
          ) : (
            <button
              onClick={stopSimulation}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Stop Simulation
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* PIXI World Map */}
        <div className="lg:col-span-2 bg-black rounded-lg overflow-hidden" style={{ minHeight: '600px' }}>
          <Stage
            ref={stageRef}
            width={800}
            height={600}
            options={{ backgroundColor: 0x1099bb, resolution: 1 }}
          >
            <Container interactive click={handleMapClick}>
              {/* Render the tiled map */}
              <PixiStaticMap map={worldMap} />
              
              {/* Render all agents */}
              {agents.map(renderAgent)}
              
              {/* Draw conversation connections */}
              <Container>
                {conversations.map(conv => {
                  const agent1 = agents.find(a => a.id === conv.participants[0]);
                  const agent2 = agents.find(a => a.id === conv.participants[1]);
                  if (!agent1 || !agent2) return null;

                  return (
                    <React.Fragment key={conv.id}>
                      {/* This would need a custom PIXI Graphics component for lines */}
                    </React.Fragment>
                  );
                })}
              </Container>
            </Container>
          </Stage>
        </div>

        {/* Side Panel */}
        <div className="space-y-4">
          {/* User Controls */}
          <UserControls 
            userCharacterId={userCharacterId}
            agents={agents}
            onUserCharacterCreated={handleUserCharacterCreated}
            onUserCharacterRemoved={handleUserCharacterRemoved}
          />

          {/* Agent Info Panel */}
          <div className="bg-brown-800 text-white rounded-lg p-4">
            {selectedAgent ? (
              <div>
                <h3 className="text-xl font-bold mb-3">
                  {selectedAgent.name} {selectedAgent.isUserControlled ? '(You)' : ''}
                </h3>
                <p className="text-sm opacity-80 mb-4">{selectedAgent.identity}</p>
                
                <div className="space-y-2">
                  <div>
                    <strong>Status:</strong> {
                      selectedAgent.currentConversation ? 'In conversation' :
                      selectedAgent.isMoving ? 'Moving' : 'Idle'
                    }
                  </div>
                  <div>
                    <strong>Character:</strong> {selectedAgent.character || 'Unknown'}
                  </div>
                  <div>
                    <strong>Position:</strong> ({Math.round(selectedAgent.position.x)}, {Math.round(selectedAgent.position.y)})
                  </div>
                  {selectedAgent.plan && (
                    <div>
                      <strong>Goals:</strong>
                      <div className="text-sm text-gray-300">{selectedAgent.plan}</div>
                    </div>
                  )}
                  {selectedAgent.memories && selectedAgent.memories.length > 0 && (
                    <div>
                      <strong>Memories:</strong>
                      <div className="text-sm text-gray-300">
                        {selectedAgent.memories.slice(0, 3).join(' • ')}
                      </div>
                    </div>
                  )}
                  {selectedAgent.lastMessage && (
                    <div>
                      <strong>Last Said:</strong>
                      <div className="bg-gray-700 p-2 rounded text-sm mt-1">
                        "{selectedAgent.lastMessage}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-bold mb-3">World Statistics</h3>
                <div className="space-y-2">
                  <div>Map Size: {worldMap.width} × {worldMap.height}</div>
                  <div>Total Characters: {agents.length}</div>
                  <div>AI Characters: {agents.filter(a => !a.isUserControlled).length}</div>
                  <div>Human Players: {agents.filter(a => a.isUserControlled).length}</div>
                  <div>Active Conversations: {conversations.length}</div>
                  <div>Moving: {agents.filter(a => a.isMoving).length}</div>
                  <div>Idle: {agents.filter(a => !a.isMoving && !a.currentConversation).length}</div>
                </div>

                {conversations.length > 0 && (
                  <>
                    <h4 className="text-lg font-semibold mt-4 mb-2">Recent Conversations</h4>
                    <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
                      {conversations.map(conv => {
                        const recentMsg = conv.messages[conv.messages.length - 1];
                        if (!recentMsg) return null;
                        const speaker = agents.find(a => a.id === recentMsg.agentId);
                        return (
                          <div key={conv.id} className="bg-gray-700 p-2 rounded">
                            <div className="font-semibold">{speaker?.name}:</div>
                            <div className="text-gray-300">"{recentMsg.text.substring(0, 60)}..."</div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {!isSimulationRunning && (
                  <div className="mt-4 p-3 bg-yellow-900 rounded">
                    <p className="text-sm">
                      Click "Start Simulation" to see AI characters with proper sprites! 
                      {userCharacterId ? ' Click on the map to move around.' : ' Create a character to join them!'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Conversation Log Toggle */}
          <button
            onClick={() => setShowConversationLog(!showConversationLog)}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            {showConversationLog ? 'Hide' : 'Show'} Full Conversation Log
          </button>

          {/* Full Conversation Log */}
          {showConversationLog && (
            <div className="bg-gray-800 text-white rounded-lg p-4 max-h-60 overflow-y-auto">
              <h4 className="font-bold mb-3">All Conversations</h4>
              {conversations.map(conv => (
                <div key={conv.id} className="mb-4 border-b border-gray-700 pb-2">
                  <div className="text-sm text-gray-400 mb-2">
                    Conversation between {conv.participants.map(id => agents.find(a => a.id === id)?.name).join(' & ')}
                  </div>
                  {conv.messages.map((msg, idx) => {
                    const speaker = agents.find(a => a.id === msg.agentId);
                    return (
                      <div key={idx} className="text-sm mb-1">
                        <span className="font-semibold">{speaker?.name}:</span> {msg.text}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-gray-800 text-white p-2 text-sm flex justify-between">
        <div>
          LLM Status: {clientLLM.isReady() ? '🟢 Ready (HF Transformers)' : '🟡 Fallback Mode'}
        </div>
        <div>
          Simulation: {isSimulationRunning ? '🟢 Running' : '🔴 Stopped'} • 
          Map: {worldMap.width}x{worldMap.height} tiles loaded
        </div>
      </div>
    </div>
  );
}
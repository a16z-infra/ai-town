import React, { useEffect, useState } from 'react';
import { agentSimulation, Agent, Conversation } from '../lib/staticAgentSimulation';
import { clientLLM } from '../lib/clientLLM';
import { worldPersistence } from '../lib/worldPersistence';
import UserControls from './UserControls';
import WorldManager from './WorldManager';

export default function SimpleAgentWorld() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [llmReady, setLLMReady] = useState(false);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [userCharacterId, setUserCharacterId] = useState<string>();
  const [showConversationLog, setShowConversationLog] = useState(false);

  useEffect(() => {
    // Initialize world persistence
    const initPersistence = async () => {
      try {
        await worldPersistence.initialize();
        console.log('World persistence initialized');
      } catch (error) {
        console.error('Failed to initialize world persistence:', error);
      }
    };
    initPersistence();

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

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!userCharacterId) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    agentSimulation.moveUserCharacter(userCharacterId, { x, y });
  };

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

  return (
    <div className="w-full h-full flex flex-col">
      <div className="bg-brown-800 text-white p-4 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">AI Town - Live Simulation</h2>
          <p className="text-sm opacity-80">
            Agents using {clientLLM.isReady() ? '✅ Client-side LLM (DistilGPT-2)' : '🤖 Fallback AI (Personality-based responses)'}
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
        {/* Agent World Map */}
        <div 
          className="lg:col-span-2 bg-green-100 rounded-lg relative overflow-hidden cursor-crosshair" 
          style={{ minHeight: '400px' }}
          onClick={handleMapClick}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-sky-200 to-green-200">
            {/* Simple town background pattern */}
            <div className="w-full h-full opacity-20 bg-repeat" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23000" fill-opacity="0.1"%3E%3Cpath d="m0 40l40-40h-40v40zm40 0v-40h-40l40 40z"/%3E%3C/g%3E%3C/svg%3E")'
            }} />

            {/* Add some simple buildings/locations */}
            <div className="absolute w-16 h-16 bg-brown-600 border border-brown-800 rounded opacity-60" style={{ left: '50px', top: '50px' }}>
              <div className="text-xs text-white text-center mt-2">Library</div>
            </div>
            <div className="absolute w-16 h-16 bg-red-600 border border-red-800 rounded opacity-60" style={{ left: '200px', top: '300px' }}>
              <div className="text-xs text-white text-center mt-2">Café</div>
            </div>
            <div className="absolute w-16 h-16 bg-blue-600 border border-blue-800 rounded opacity-60" style={{ left: '400px', top: '80px' }}>
              <div className="text-xs text-white text-center mt-2">Lab</div>
            </div>

            {/* Render agents */}
            {agents.map(agent => (
              <div
                key={agent.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                  selectedAgent?.id === agent.id ? 'scale-125 z-10' : 'hover:scale-110'
                }`}
                style={{
                  left: `${agent.position.x}px`,
                  top: `${agent.position.y}px`,
                }}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent map click when clicking agent
                  setSelectedAgent(selectedAgent?.id === agent.id ? null : agent);
                }}
              >
                {/* Agent avatar - different styling for user vs AI */}
                <div className={`w-10 h-10 rounded-full border-3 flex items-center justify-center text-white font-bold text-sm ${
                  agent.isUserControlled ? 
                    'bg-yellow-500 border-yellow-700 shadow-lg ring-2 ring-yellow-300' :
                  agent.currentConversation ? 
                    'bg-blue-500 border-blue-700 animate-pulse' :
                  agent.isMoving ? 
                    'bg-orange-500 border-orange-700' :
                    'bg-purple-500 border-purple-700'
                } ${agent.id === userCharacterId ? 'ring-4 ring-white' : ''}`}>
                  {agent.isUserControlled ? '👤' : agent.name[0]}
                </div>
                
                {/* Agent name and status */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {agent.name} {agent.isUserControlled ? '(You)' : ''}
                  {agent.isMoving && (
                    <div className="text-green-300">→ moving</div>
                  )}
                  {agent.currentConversation && (
                    <div className="text-blue-300">💬 chatting</div>
                  )}
                </div>

                {/* Show last message as speech bubble */}
                {agent.lastMessage && agent.lastMessageTime && Date.now() - agent.lastMessageTime < 10000 && (
                  <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-white border-2 border-gray-300 rounded-lg p-2 text-sm shadow-lg max-w-xs">
                    <div className="text-gray-800">{agent.lastMessage}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                  </div>
                )}

                {/* Movement target indicator */}
                {agent.targetPosition && (
                  <div 
                    className="absolute w-3 h-3 bg-yellow-400 border border-yellow-600 transform -translate-x-1/2 -translate-y-1/2 opacity-50"
                    style={{
                      left: `${agent.targetPosition.x - agent.position.x}px`,
                      top: `${agent.targetPosition.y - agent.position.y}px`,
                    }}
                  />
                )}
              </div>
            ))}

            {/* Draw conversation connections */}
            {conversations.map(conv => {
              const agent1 = agents.find(a => a.id === conv.participants[0]);
              const agent2 = agents.find(a => a.id === conv.participants[1]);
              if (!agent1 || !agent2) return null;

              return (
                <svg 
                  key={conv.id}
                  className="absolute inset-0 pointer-events-none"
                  style={{ width: '100%', height: '100%' }}
                >
                  <line
                    x1={agent1.position.x}
                    y1={agent1.position.y}
                    x2={agent2.position.x}
                    y2={agent2.position.y}
                    stroke="rgba(59, 130, 246, 0.5)"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                </svg>
              );
            })}
          </div>
        </div>

        {/* Side Panel - Split between Agent Info and User Controls */}
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
                      Click "Start Simulation" to see AI characters come to life! 
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
          Simulation: {isSimulationRunning ? '🟢 Running' : '🔴 Stopped'}
        </div>
      </div>
    </div>
  );
}
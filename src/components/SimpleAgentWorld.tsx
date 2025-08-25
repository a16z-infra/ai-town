import React, { useEffect, useState } from 'react';
import { agentSimulation, Agent, Conversation } from '../lib/staticAgentSimulation';
import { clientLLM } from '../lib/clientLLM';

export default function SimpleAgentWorld() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [llmReady, setLLMReady] = useState(false);
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

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
        <div className="lg:col-span-2 bg-green-100 rounded-lg relative overflow-hidden" style={{ minHeight: '400px' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-sky-200 to-green-200">
            {/* Simple background pattern */}
            <div className="w-full h-full opacity-20 bg-repeat" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23000" fill-opacity="0.1"%3E%3Cpath d="m0 40l40-40h-40v40zm40 0v-40h-40l40 40z"/%3E%3C/g%3E%3C/svg%3E")'
            }} />

            {/* Render agents */}
            {agents.map(agent => (
              <div
                key={agent.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
                  selectedAgent?.id === agent.id ? 'scale-125' : 'hover:scale-110'
                }`}
                style={{
                  left: `${agent.position.x}px`,
                  top: `${agent.position.y}px`,
                }}
                onClick={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
              >
                {/* Agent avatar */}
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-white font-bold ${
                  agent.currentConversation ? 'bg-blue-500 border-blue-700 animate-pulse' :
                  agent.isMoving ? 'bg-orange-500 border-orange-700' :
                  'bg-purple-500 border-purple-700'
                }`}>
                  {agent.name[0]}
                </div>
                
                {/* Agent name */}
                <div className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {agent.name}
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

        {/* Side Panel */}
        <div className="bg-brown-800 text-white rounded-lg p-4 flex flex-col">
          {selectedAgent ? (
            <div>
              <h3 className="text-xl font-bold mb-3">{selectedAgent.name}</h3>
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
              <h3 className="text-xl font-bold mb-3">Agent Statistics</h3>
              <div className="space-y-2">
                <div>Total Agents: {agents.length}</div>
                <div>Active Conversations: {conversations.length}</div>
                <div>
                  Moving: {agents.filter(a => a.isMoving).length}
                </div>
                <div>
                  Idle: {agents.filter(a => !a.isMoving && !a.currentConversation).length}
                </div>
              </div>

              <h4 className="text-lg font-semibold mt-6 mb-2">Recent Conversations</h4>
              <div className="space-y-2 text-sm">
                {conversations.map(conv => {
                  const recentMsg = conv.messages[conv.messages.length - 1];
                  if (!recentMsg) return null;
                  const speaker = agents.find(a => a.id === recentMsg.agentId);
                  return (
                    <div key={conv.id} className="bg-gray-700 p-2 rounded">
                      <div className="font-semibold">{speaker?.name}:</div>
                      <div className="text-gray-300">"{recentMsg.text}"</div>
                    </div>
                  );
                })}
              </div>

              {!isSimulationRunning && (
                <div className="mt-6 p-3 bg-yellow-900 rounded">
                  <p className="text-sm">Click "Start Simulation" to see agents come to life!</p>
                </div>
              )}
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
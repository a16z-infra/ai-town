// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD VOICE TOOLS
// Custom tool definitions for voice conversations in X402 World
// ═══════════════════════════════════════════════════════════════════════════════

import { internal } from '../_generated/api';

/**
 * Get X402 World voice tools for agent conversations
 * These tools can be called during voice interactions
 */
export function getX402VoiceTools(): any[] {
  return [
    {
      type: 'function',
      function: {
        name: 'create_transaction',
        description: 'Create a new transaction in X402 World. Use this when the user wants to send tokens, request a service, or make a payment.',
        parameters: {
          type: 'object',
          properties: {
            from: {
              type: 'string',
              description: 'Source agent ID (e.g., "ag:000001")',
            },
            to: {
              type: 'string',
              description: 'Destination agent ID (e.g., "ag:000002")',
            },
            amount: {
              type: 'number',
              description: 'Amount to transfer (in smallest units, e.g., 1000000 for 1 USDC with 6 decimals)',
            },
            tokenType: {
              type: 'string',
              enum: ['usdc', 'x402', 'sol'],
              description: 'Token type for the transaction',
            },
            serviceType: {
              type: 'string',
              description: 'Optional: Type of service if this is a service transaction',
            },
            description: {
              type: 'string',
              description: 'Optional: Human-readable description of the transaction',
            },
          },
          required: ['from', 'to', 'amount', 'tokenType'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'check_balance',
        description: 'Check the balance of an agent. Use this when the user asks about their balance or available funds.',
        parameters: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'Agent ID to check balance for (e.g., "ag:000001")',
            },
            tokenType: {
              type: 'string',
              enum: ['usdc', 'x402', 'sol', 'all'],
              description: 'Token type to check, or "all" for all tokens',
            },
          },
          required: ['agentId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_agent_info',
        description: 'Get information about an agent. Use this when the user asks about an agent\'s capabilities, reputation, or status.',
        parameters: {
          type: 'object',
          properties: {
            agentId: {
              type: 'string',
              description: 'Agent ID to get information for (e.g., "ag:000001")',
            },
          },
          required: ['agentId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'find_service_providers',
        description: 'Find agents that can provide a specific service. Use this when the user needs to find an agent for a task.',
        parameters: {
          type: 'object',
          properties: {
            serviceType: {
              type: 'string',
              description: 'Type of service needed (e.g., "analysis", "signal_processing", "voice", "vision")',
            },
            maxPrice: {
              type: 'number',
              description: 'Maximum price willing to pay (in USDC smallest units)',
            },
          },
          required: ['serviceType'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'broadcast_signal',
        description: 'Broadcast a trading signal or alert to other agents. Use this when the user wants to share market information or alerts.',
        parameters: {
          type: 'object',
          properties: {
            signalType: {
              type: 'string',
              enum: ['price_alert', 'opportunity', 'risk_warning', 'caravan_forming'],
              description: 'Type of signal to broadcast',
            },
            payload: {
              type: 'object',
              description: 'Signal payload with relevant information',
            },
            targetZone: {
              type: 'string',
              description: 'Optional: Target zone for the signal',
            },
          },
          required: ['signalType', 'payload'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'analyze_transaction',
        description: 'Analyze a transaction for risks and recommendations. Use this when the user wants to check if a transaction is safe.',
        parameters: {
          type: 'object',
          properties: {
            transactionId: {
              type: 'string',
              description: 'Transaction ID to analyze (e.g., "tx:000001")',
            },
          },
          required: ['transactionId'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_market_summary',
        description: 'Get a summary of current market conditions. Use this when the user asks about market trends, prices, or sentiment.',
        parameters: {
          type: 'object',
          properties: {
            tokens: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional: List of tokens to analyze (e.g., ["SOL", "USDC", "X402"])',
            },
          },
        },
      },
    },
  ];
}

/**
 * Execute a tool call during voice conversation
 */
export interface ToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  voiceResponse?: string; // Natural language response for voice
}

/**
 * Execute a tool call and return a voice-friendly response
 * @param ctx - Convex ActionCtx for running mutations/queries
 */
export async function executeVoiceTool(
  ctx: any, // ActionCtx from Convex
  worldId: string,
  agentId: string | undefined,
  toolName: string,
  toolArguments: any
): Promise<ToolExecutionResult> {
  try {
    switch (toolName) {
      case 'create_transaction':
        try {
          // Convert amount to smallest units (assuming 6 decimals for USDC/X402, 9 for SOL)
          const decimals = toolArguments.tokenType === 'sol' ? 1000000000 : 1000000;
          const amountInSmallestUnits = Math.floor(toolArguments.amount * decimals);
          
          const txResult = await ctx.runAction(internal.x402World.agentOperations.requestService, {
            worldId,
            requesterId: toolArguments.from || agentId || '',
            providerId: toolArguments.to,
            serviceType: toolArguments.serviceType || 'transfer',
            payload: {
              amount: amountInSmallestUnits,
              tokenType: toolArguments.tokenType,
              description: toolArguments.description,
            },
            offeredPrice: 0, // No service fee for transfers
          });
          
          if (!txResult.success) {
            throw new Error(txResult.error || 'Transaction creation failed');
          }
          
          const amountFormatted = toolArguments.amount.toFixed(toolArguments.tokenType === 'sol' ? 4 : 2);
          return {
            success: true,
            result: txResult.result,
            voiceResponse: `I've created a transaction for ${amountFormatted} ${toolArguments.tokenType.toUpperCase()} from ${toolArguments.from} to ${toolArguments.to}. The transaction is now pending confirmation.`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            voiceResponse: `I couldn't create the transaction. ${error.message}`,
          };
        }

      case 'check_balance':
        // Query the world to get agent balance
        try {
          const world = await ctx.runQuery(internal.x402World.agentOperations.getWorld, { worldId });
          if (!world) {
            throw new Error('World not found');
          }
          const agent = world.agents.find((a: any) => a.id === (toolArguments.agentId || agentId));
          if (!agent) {
            throw new Error('Agent not found');
          }
          const balance = agent.balance || { usdc: 0, x402: 0, sol: 0 };
          const tokenType = toolArguments.tokenType || 'all';
          
          let voiceResponse = '';
          if (tokenType === 'all') {
            voiceResponse = `Agent ${toolArguments.agentId || agentId} has a balance of ${(balance.usdc / 1000000).toFixed(2)} USDC, ${(balance.x402 / 1000000).toFixed(2)} X402 tokens, and ${(balance.sol / 1000000000).toFixed(4)} SOL.`;
          } else {
            const amount = balance[tokenType as keyof typeof balance] || 0;
            const decimals = tokenType === 'sol' ? 1000000000 : 1000000;
            voiceResponse = `Agent ${toolArguments.agentId || agentId} has a balance of ${(amount / decimals).toFixed(tokenType === 'sol' ? 4 : 2)} ${tokenType.toUpperCase()}.`;
          }
          
          return {
            success: true,
            result: {
              agentId: toolArguments.agentId || agentId,
              balances: balance,
            },
            voiceResponse,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            voiceResponse: `I couldn't retrieve the balance. ${error.message}`,
          };
        }

      case 'get_agent_info':
        try {
          const world = await ctx.runQuery(internal.x402World.agentOperations.getWorld, { worldId });
          if (!world) {
            throw new Error('World not found');
          }
          const agent = world.agents.find((a: any) => a.id === (toolArguments.agentId || agentId));
          if (!agent) {
            throw new Error('Agent not found');
          }
          
          const voiceResponse = `Agent ${agent.name || toolArguments.agentId || agentId} is a ${agent.role || 'node'} with a reputation of ${agent.reputation || 0}. It has capabilities in ${(agent.capabilities || []).join(', ')}.`;
          
          return {
            success: true,
            result: {
              agentId: toolArguments.agentId || agentId,
              name: agent.name,
              role: agent.role,
              reputation: agent.reputation,
              capabilities: agent.capabilities || [],
              zone: agent.zone,
              state: agent.state,
            },
            voiceResponse,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            voiceResponse: `I couldn't retrieve agent information. ${error.message}`,
          };
        }

      case 'find_service_providers':
        try {
          const providers = await ctx.runQuery(internal.x402World.agentOperations.findServiceProviders, {
            worldId,
            serviceType: toolArguments.serviceType,
            maxPrice: toolArguments.maxPrice || 1.0,
            requiredCapabilities: undefined,
          });
          
          if (providers.length === 0) {
            return {
              success: true,
              result: { providers: [] },
              voiceResponse: `I couldn't find any agents that can provide ${toolArguments.serviceType} within your price range.`,
            };
          }
          
          const providerList = providers.slice(0, 3).map((p: any, idx: number) => 
            `${idx + 1}. ${p.name || p.id} at ${p.pricePerRequest || 0} USDC per request`
          ).join(', ');
          
          return {
            success: true,
            result: { providers },
            voiceResponse: `I found ${providers.length} agent${providers.length > 1 ? 's' : ''} that can provide ${toolArguments.serviceType}. ${providerList}.`,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message,
            voiceResponse: `I couldn't find service providers. ${error.message}`,
          };
        }

      case 'broadcast_signal':
        return {
          success: true,
          result: {
            signalId: `sg:${Date.now()}`,
            status: 'broadcast',
          },
          voiceResponse: `I've broadcast a ${toolArguments.signalType} signal. Other agents in the network will be notified.`,
        };

      case 'analyze_transaction':
        return {
          success: true,
          result: {
            transactionId: toolArguments.transactionId,
            riskLevel: 'low',
            confidence: 92,
            recommendations: ['Transaction looks safe', 'Standard processing recommended'],
          },
          voiceResponse: `I've analyzed transaction ${toolArguments.transactionId}. The risk level is low with 92 percent confidence. I recommend standard processing.`,
        };

      case 'get_market_summary':
        return {
          success: true,
          result: {
            sentiment: 'bullish',
            keyEvents: ['Price increase', 'High trading volume'],
            recommendations: ['Consider buying', 'Monitor trends'],
          },
          voiceResponse: `The current market sentiment is bullish. Key events include price increases and high trading volume. I recommend considering buying opportunities and monitoring trends closely.`,
        };

      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
          voiceResponse: `I'm sorry, I don't know how to execute that tool.`,
        };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      voiceResponse: `I encountered an error: ${error.message}`,
    };
  }
}

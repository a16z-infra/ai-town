import { v } from 'convex/values';
import { internalAction, internalMutation, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { GameId, agentId, transactionId, signalId } from './ids';
import { Agent, AgentRole, AgentState } from './agent';
import { Transaction, TransactionState, TransactionType } from './transaction';
import { X402_CONFIG, createX402Response, A2ARequest, A2AResponse } from './x402Protocol';

// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD AGENT OPERATIONS
// Async operations for AI agents including:
// - RALPH (Recursive Alpha Loop Processing Heuristic) decision making
// - Service discovery and execution
// - Transaction processing with X402 Protocol
// - Agent-to-Agent communication via Google ADK A2A
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// RALPH PROCESSING
// Recursive decision-making system for autonomous agent behavior
// ═══════════════════════════════════════════════════════════════════════════════

export interface RALPHContext {
  agentId: GameId<'agents'>;
  currentState: AgentState;
  observation: string;
  availableActions: string[];
  recursionDepth: number;
  maxDepth: number;
  confidence: number;
  memories: RALPHMemory[];
}

export interface RALPHMemory {
  timestamp: number;
  observation: string;
  action: string;
  outcome: 'success' | 'failure' | 'neutral';
  confidence: number;
}

export interface RALPHDecision {
  action: string;
  confidence: number;
  reasoning: string;
  shouldRecurse: boolean;
  nextObservation?: string;
}

// Process a single RALPH recursion level
export const processRALPHLevel = internalAction({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    context: v.object({
      currentState: v.string(),
      observation: v.string(),
      availableActions: v.array(v.string()),
      recursionDepth: v.number(),
      maxDepth: v.number(),
      confidence: v.number(),
      recentMemories: v.array(v.object({
        timestamp: v.number(),
        observation: v.string(),
        action: v.string(),
        outcome: v.string(),
        confidence: v.number(),
      })),
    }),
  },
  handler: async (ctx, { worldId, agentId, context }): Promise<RALPHDecision> => {
    // RALPH Algorithm:
    // 1. Analyze current observation
    // 2. Consider available actions
    // 3. Evaluate confidence based on past memories
    // 4. Decide whether to recurse deeper or act

    const { observation, availableActions, recursionDepth, maxDepth, confidence, recentMemories } = context;

    // If we've reached max depth or confidence threshold, stop recursing
    if (recursionDepth >= maxDepth || confidence >= 85) {
      return selectBestAction(observation, availableActions, recentMemories, confidence);
    }

    // Analyze the situation
    const analysis = analyzeObservation(observation, recentMemories);

    // Calculate action scores
    const actionScores = availableActions.map(action => ({
      action,
      score: scoreAction(action, analysis, recentMemories),
    }));

    // Sort by score
    actionScores.sort((a, b) => b.score - a.score);

    const bestAction = actionScores[0];
    const newConfidence = Math.min(confidence + (bestAction.score * 10), 100);

    // Decide whether to recurse
    const shouldRecurse = newConfidence < 85 && recursionDepth < maxDepth - 1;

    return {
      action: bestAction.action,
      confidence: newConfidence,
      reasoning: `Depth ${recursionDepth}: Selected "${bestAction.action}" with score ${bestAction.score.toFixed(2)}. ${shouldRecurse ? 'Need more analysis.' : 'Confident enough to proceed.'}`,
      shouldRecurse,
      nextObservation: shouldRecurse ? `Evaluating "${bestAction.action}" consequences` : undefined,
    };
  },
});

function analyzeObservation(observation: string, memories: RALPHMemory[]): string {
  // Simple keyword analysis
  const keywords = observation.toLowerCase().split(/\s+/);
  const relevantMemories = memories.filter(m =>
    keywords.some(k => m.observation.toLowerCase().includes(k))
  );

  if (relevantMemories.length > 0) {
    const successRate = relevantMemories.filter(m => m.outcome === 'success').length / relevantMemories.length;
    return `Similar situations: ${relevantMemories.length}, success rate: ${(successRate * 100).toFixed(0)}%`;
  }

  return 'New situation, no similar memories';
}

function scoreAction(action: string, analysis: string, memories: RALPHMemory[]): number {
  // Base score
  let score = 0.5;

  // Check if this action has worked before
  const actionMemories = memories.filter(m => m.action === action);
  if (actionMemories.length > 0) {
    const successRate = actionMemories.filter(m => m.outcome === 'success').length / actionMemories.length;
    score = 0.3 + (successRate * 0.7);
  }

  // Penalize if analysis mentions low success rate
  if (analysis.includes('success rate:')) {
    const match = analysis.match(/success rate: (\d+)%/);
    if (match) {
      const rate = parseInt(match[1]) / 100;
      score = score * 0.5 + rate * 0.5;
    }
  }

  return score;
}

function selectBestAction(
  observation: string,
  actions: string[],
  memories: RALPHMemory[],
  currentConfidence: number
): RALPHDecision {
  // Score all actions
  const scored = actions.map(action => ({
    action,
    score: scoreAction(action, observation, memories),
  }));

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0] || { action: 'idle', score: 0.5 };

  return {
    action: best.action,
    confidence: currentConfidence,
    reasoning: `Final decision: "${best.action}" with confidence ${currentConfidence.toFixed(0)}%`,
    shouldRecurse: false,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SERVICE OPERATIONS
// Agents can offer and consume services using X402 Protocol
// ═══════════════════════════════════════════════════════════════════════════════

export interface ServiceRequest {
  serviceType: string;
  payload: any;
  maxPrice: number;
  requiredCapabilities?: string[];
}

export interface ServiceResponse {
  success: boolean;
  result?: any;
  error?: string;
  cost: number;
  executionTime: number;
}

// Find agents that can provide a service
export const findServiceProviders = internalQuery({
  args: {
    worldId: v.id('worlds'),
    serviceType: v.string(),
    maxPrice: v.number(),
    requiredCapabilities: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { worldId, serviceType, maxPrice, requiredCapabilities }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return [];

    // Filter agents by capabilities and price
    const providers = world.agents.filter((agent: any) => {
      if (agent.state === 'sleeping' || agent.state === 'recycling') return false;
      if (agent.pricePerRequest > maxPrice) return false;

      // Check service capability
      const hasService = agent.capabilities?.includes(serviceType) ||
                        agent.capabilities?.includes('*');
      if (!hasService) return false;

      // Check required capabilities
      if (requiredCapabilities) {
        const hasAll = requiredCapabilities.every(cap =>
          agent.capabilities?.includes(cap)
        );
        if (!hasAll) return false;
      }

      return true;
    });

    // Sort by reputation and price
    return providers.sort((a: any, b: any) => {
      const scoreA = a.reputation / (a.pricePerRequest + 0.01);
      const scoreB = b.reputation / (b.pricePerRequest + 0.01);
      return scoreB - scoreA;
    });
  },
});

// Request a service from another agent
export const requestService = internalAction({
  args: {
    worldId: v.id('worlds'),
    requesterId: agentId,
    providerId: agentId,
    serviceType: v.string(),
    payload: v.any(),
    offeredPrice: v.number(),
  },
  handler: async (ctx, { worldId, requesterId, providerId, serviceType, payload, offeredPrice }) => {
    // Create transaction for the service request
    const txResult = await ctx.runMutation(internal.x402World.agentOperations.createServiceTransaction, {
      worldId,
      requesterId,
      providerId,
      serviceType,
      payload,
      amount: offeredPrice,
    });

    if (!txResult.success) {
      return {
        success: false,
        error: txResult.error,
        cost: 0,
        executionTime: 0,
      };
    }

    // Process the service (simulated)
    const startTime = Date.now();

    // Simulate service execution based on type
    let result: any;
    try {
      result = await simulateServiceExecution(serviceType, payload);
    } catch (error: any) {
      await ctx.runMutation(internal.x402World.agentOperations.failTransaction, {
        worldId,
        transactionId: txResult.transactionId,
        error: error.message,
      });

      return {
        success: false,
        error: error.message,
        cost: 0,
        executionTime: Date.now() - startTime,
      };
    }

    // Complete the transaction
    await ctx.runMutation(internal.x402World.agentOperations.completeTransaction, {
      worldId,
      transactionId: txResult.transactionId,
      result,
    });

    return {
      success: true,
      result,
      cost: offeredPrice,
      executionTime: Date.now() - startTime,
    };
  },
});

async function simulateServiceExecution(serviceType: string, payload: any): Promise<any> {
  // Simulate different service types
  switch (serviceType) {
    case 'analysis':
      // Use structured outputs for analysis
      return await executeStructuredAnalysis(payload);
    case 'signal_processing':
      return await executeStructuredSignalAnalysis(payload);
    case 'price_oracle':
      return { price: Math.random() * 100, timestamp: Date.now() };
    case 'mixing':
      return { mixed: true, outputAmount: payload.amount * 0.995 };
    case 'verification':
      return { verified: true, confidence: Math.random() * 100 };
    case 'web_search':
    case 'x_search':
    case 'search':
      // Use xAI search for search services
      return await executeSearchService(serviceType, payload);
    case 'vision':
    case 'image_analysis':
      // Use vision capabilities
      return await executeVisionService(payload);
    case 'structured_output':
      // Generic structured output service
      return await executeStructuredOutputService(payload);
    case 'voice':
    case 'voice_response':
      // Voice response service
      return await executeVoiceService(payload);
    default:
      return { executed: true, serviceType };
  }
}

async function executeSearchService(serviceType: string, payload: any): Promise<any> {
  const { performWebSearch, performXSearch, performCombinedSearch } = await import('../util/xaiSearch');
  
  const query = payload.query || payload.text || '';
  if (!query) {
    throw new Error('Search query is required');
  }

  const options = {
    allowedXHandles: payload.allowedXHandles,
    excludedXHandles: payload.excludedXHandles,
    fromDate: payload.fromDate,
    toDate: payload.toDate,
    allowedDomains: payload.allowedDomains,
    excludedDomains: payload.excludedDomains,
    enableImageUnderstanding: payload.enableImageUnderstanding || false,
    enableVideoUnderstanding: payload.enableVideoUnderstanding || false,
    enableInlineCitations: payload.enableInlineCitations || true,
  };

  try {
    let result;
    if (serviceType === 'web_search') {
      result = await performWebSearch(query, options);
    } else if (serviceType === 'x_search') {
      result = await performXSearch(query, options);
    } else {
      // Combined search
      result = await performCombinedSearch(query, options);
    }

    return {
      success: true,
      query,
      result: result.text,
      citations: result.citations || [],
      inlineCitations: result.inlineCitations || [],
      toolUsage: result.toolUsage || {},
      timestamp: Date.now(),
    };
  } catch (error: any) {
    return {
      success: false,
      query,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

async function executeStructuredAnalysis(payload: any): Promise<any> {
  const { getStructuredOutput } = await import('../util/xaiStructured');
  const { AgentDecisionSchema } = await import('../util/xaiStructured');
  
  const prompt = payload.prompt || payload.text || 'Analyze the given situation and provide a structured decision.';
  const systemPrompt = payload.systemPrompt || 'You are an AI agent analyzing situations and making decisions. Provide structured, actionable insights.';
  
  try {
    const result = await getStructuredOutput(prompt, systemPrompt, {
      schema: payload.schema || AgentDecisionSchema,
      useTools: payload.useTools || false,
      toolOptions: payload.toolOptions,
    });

    return {
      success: true,
      analysis: result.data,
      citations: result.citations || [],
      toolUsage: result.toolUsage || {},
      timestamp: Date.now(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

async function executeStructuredSignalAnalysis(payload: any): Promise<any> {
  const { getStructuredOutput } = await import('../util/xaiStructured');
  const { SignalAnalysisSchema } = await import('../util/xaiStructured');
  
  const prompt = payload.prompt || `Analyze the following signal data: ${JSON.stringify(payload.signalData || {})}`;
  const systemPrompt = 'You are a trading signal analyst. Analyze market signals and provide structured trading recommendations.';
  
  try {
    const result = await getStructuredOutput(prompt, systemPrompt, {
      schema: SignalAnalysisSchema,
      useTools: true,
      toolOptions: {
        webSearch: true,
        xSearch: true,
        allowedXHandles: payload.allowedXHandles,
        fromDate: payload.fromDate,
        toDate: payload.toDate,
      },
    });

    return {
      success: true,
      signalAnalysis: result.data,
      citations: result.citations || [],
      toolUsage: result.toolUsage || {},
      timestamp: Date.now(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

async function executeVisionService(payload: any): Promise<any> {
  const { analyzeImage, analyzeImages, ImageAnalysisSchema, ChartAnalysisSchema, DocumentAnalysisSchema } = await import('../util/xaiVision');
  
  const imageUrl = payload.imageUrl;
  const imageUrls = payload.imageUrls || (imageUrl ? [imageUrl] : []);
  
  if (!imageUrls || imageUrls.length === 0) {
    throw new Error('Image URL(s) required for vision service');
  }

  const prompt = payload.prompt || 'Analyze this image and provide detailed information.';
  const systemPrompt = payload.systemPrompt || 'You are an AI agent with vision capabilities. Analyze images carefully and provide accurate descriptions.';
  
  // Determine schema based on analysis type
  let schema = ImageAnalysisSchema;
  if (payload.analysisType === 'chart') {
    schema = ChartAnalysisSchema;
  } else if (payload.analysisType === 'document') {
    schema = DocumentAnalysisSchema;
  } else if (payload.schema) {
    schema = payload.schema;
  }

  try {
    let result;
    if (imageUrls.length === 1) {
      result = await analyzeImage(imageUrls[0], prompt, systemPrompt, {
        structuredOutput: schema,
        useWebSearch: payload.useWebSearch || false,
        useXSearch: payload.useXSearch || false,
      });
    } else {
      result = await analyzeImages(imageUrls, prompt, systemPrompt, {
        structuredOutput: schema,
        useWebSearch: payload.useWebSearch || false,
        useXSearch: payload.useXSearch || false,
      });
    }

    return {
      success: true,
      analysis: result.structuredData || result.text,
      rawText: result.text,
      citations: result.citations || [],
      toolUsage: result.toolUsage || {},
      timestamp: Date.now(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

async function executeStructuredOutputService(payload: any): Promise<any> {
  const { getStructuredOutput } = await import('../util/xaiStructured');
  
  const prompt = payload.prompt || payload.text;
  const systemPrompt = payload.systemPrompt || 'You are an AI agent. Provide structured, accurate responses.';
  const schema = payload.schema;
  
  if (!prompt) {
    throw new Error('Prompt is required for structured output service');
  }
  if (!schema) {
    throw new Error('Schema is required for structured output service');
  }

  try {
    const result = await getStructuredOutput(prompt, systemPrompt, {
      schema,
      useTools: payload.useTools || false,
      toolOptions: payload.toolOptions,
    });

    return {
      success: true,
      data: result.data,
      rawResponse: result.rawResponse,
      citations: result.citations || [],
      toolUsage: result.toolUsage || {},
      timestamp: Date.now(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

async function executeVoiceService(payload: any): Promise<any> {
  const { generateVoiceResponse, VoicePresets } = await import('../util/xaiVoice');
  const { getX402VoiceTools, executeVoiceTool } = await import('../util/x402VoiceTools');
  
  const text = payload.text || payload.message || payload.prompt;
  if (!text) {
    throw new Error('Text input is required for voice service');
  }

  // Determine voice preset
  let config;
  if (payload.preset) {
    const presetMap: Record<string, () => any> = {
      business: VoicePresets.business,
      support: VoicePresets.support,
      interactive: VoicePresets.interactive,
      instructional: VoicePresets.instructional,
      telephony: VoicePresets.telephony,
      x402: () => VoicePresets.x402Agent(payload.role),
    };
    const presetFn = presetMap[payload.preset];
    config = presetFn ? presetFn() : VoicePresets.business();
  } else {
    config = {
      voice: payload.voice || 'Ara',
      instructions: payload.instructions || 'You are a helpful X402 World voice assistant. You can help users with transactions, checking balances, finding services, and analyzing market conditions. Use tools when appropriate.',
      search: {
        web: payload.enableWebSearch || false,
        x: payload.enableXSearch || false,
      },
    };
  }

  // Add X402 World tools if enabled
  if (payload.enableTools !== false) {
    config.tools = getX402VoiceTools();
  }

  try {
    const result = await generateVoiceResponse(text, config);

    // Execute tool calls if present
    const toolResults: Array<{ name: string; result: any; voiceResponse?: string }> = [];
    if (result.toolCalls && result.toolCalls.length > 0) {
      for (const toolCall of result.toolCalls) {
        const toolResult = await executeVoiceTool(
          toolCall.name,
          toolCall.arguments,
          {
            worldId: payload.worldId,
            agentId: payload.agentId,
            userId: payload.userId,
          }
        );
        toolResults.push({
          name: toolCall.name,
          result: toolResult.result,
          voiceResponse: toolResult.voiceResponse,
        });
      }
    }

    return {
      success: true,
      transcript: result.transcript,
      toolCalls: result.toolCalls || [],
      toolResults: toolResults.length > 0 ? toolResults : undefined,
      citations: result.citations || [],
      timestamp: Date.now(),
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTION OPERATIONS
// X402 Protocol transaction lifecycle management
// ═══════════════════════════════════════════════════════════════════════════════

export const createServiceTransaction = internalMutation({
  args: {
    worldId: v.id('worlds'),
    requesterId: agentId,
    providerId: agentId,
    serviceType: v.string(),
    payload: v.any(),
    amount: v.number(),
  },
  handler: async (ctx, { worldId, requesterId, providerId, serviceType, payload, amount }) => {
    const world = await ctx.db.get(worldId);
    if (!world) {
      return { success: false, error: 'World not found' };
    }

    // Find requester and check balance
    const requester = world.agents.find((a: any) => a.id === requesterId);
    if (!requester) {
      return { success: false, error: 'Requester not found' };
    }

    if ((requester.balance?.usdc || 0) < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Create transaction
    const txId = `tx:${String(world.nextId).padStart(6, '0')}` as GameId<'transactions'>;
    const now = Date.now();

    const transaction = {
      id: txId,
      type: 'service' as TransactionType,
      state: 'pending' as TransactionState,
      from: requesterId,
      to: providerId,
      amount,
      tokenType: 'usdc',
      metadata: { serviceType, payload },
      created: now,
      timeout: now + 300000, // 5 minute timeout
    };

    // Update world state
    const updatedAgents = world.agents.map((a: any) => {
      if (a.id === requesterId) {
        return {
          ...a,
          balance: {
            ...a.balance,
            usdc: (a.balance?.usdc || 0) - amount,
          },
          escrowBalance: (a.escrowBalance || 0) + amount,
        };
      }
      return a;
    });

    await ctx.db.patch(worldId, {
      nextId: world.nextId + 1,
      transactions: [...(world.transactions || []), transaction],
      agents: updatedAgents,
    });

    return { success: true, transactionId: txId };
  },
});

export const completeTransaction = internalMutation({
  args: {
    worldId: v.id('worlds'),
    transactionId: transactionId,
    result: v.optional(v.any()),
  },
  handler: async (ctx, { worldId, transactionId, result }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return;

    const txIndex = world.transactions?.findIndex((t: any) => t.id === transactionId);
    if (txIndex === undefined || txIndex < 0) return;

    const tx = world.transactions[txIndex];
    const now = Date.now();

    // Move funds from escrow to recipient
    const updatedAgents = world.agents.map((a: any) => {
      if (a.id === tx.from) {
        return {
          ...a,
          escrowBalance: Math.max(0, (a.escrowBalance || 0) - tx.amount),
          totalTransactions: (a.totalTransactions || 0) + 1,
        };
      }
      if (a.id === tx.to) {
        return {
          ...a,
          balance: {
            ...a.balance,
            usdc: (a.balance?.usdc || 0) + tx.amount,
          },
          reputation: Math.min(100, (a.reputation || 50) + 1),
          totalTransactions: (a.totalTransactions || 0) + 1,
        };
      }
      return a;
    });

    // Update transaction state
    const updatedTransactions = world.transactions.map((t: any, i: number) => {
      if (i === txIndex) {
        return {
          ...t,
          state: 'completed',
          completedAt: now,
          responsePayload: result,
        };
      }
      return t;
    });

    await ctx.db.patch(worldId, {
      agents: updatedAgents,
      transactions: updatedTransactions,
    });
  },
});

export const failTransaction = internalMutation({
  args: {
    worldId: v.id('worlds'),
    transactionId: transactionId,
    error: v.string(),
  },
  handler: async (ctx, { worldId, transactionId, error }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return;

    const txIndex = world.transactions?.findIndex((t: any) => t.id === transactionId);
    if (txIndex === undefined || txIndex < 0) return;

    const tx = world.transactions[txIndex];
    const now = Date.now();

    // Return funds from escrow to sender
    const updatedAgents = world.agents.map((a: any) => {
      if (a.id === tx.from) {
        return {
          ...a,
          balance: {
            ...a.balance,
            usdc: (a.balance?.usdc || 0) + tx.amount,
          },
          escrowBalance: Math.max(0, (a.escrowBalance || 0) - tx.amount),
        };
      }
      return a;
    });

    // Update transaction state
    const updatedTransactions = world.transactions.map((t: any, i: number) => {
      if (i === txIndex) {
        return {
          ...t,
          state: 'failed',
          errorCode: 'EXECUTION_ERROR',
          errorMessage: error,
        };
      }
      return t;
    });

    await ctx.db.patch(worldId, {
      agents: updatedAgents,
      transactions: updatedTransactions,
    });
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// A2A (AGENT-TO-AGENT) OPERATIONS
// Google ADK A2A JSON-RPC protocol implementation
// ═══════════════════════════════════════════════════════════════════════════════

export const handleA2AMessage = internalAction({
  args: {
    worldId: v.id('worlds'),
    recipientAgentId: agentId,
    request: v.object({
      id: v.string(),
      jsonrpc: v.literal('2.0'),
      method: v.string(),
      params: v.object({
        message: v.object({
          role: v.union(v.literal('user'), v.literal('agent')),
          parts: v.array(v.object({
            text: v.optional(v.string()),
            data: v.optional(v.any()),
          })),
        }),
        context: v.optional(v.object({
          conversationId: v.optional(v.string()),
          x402: v.optional(v.object({
            walletAddress: v.string(),
            pricePerRequest: v.number(),
            supportedTokens: v.array(v.string()),
          })),
        })),
      }),
    }),
    senderWallet: v.optional(v.string()),
    paymentProof: v.optional(v.string()),
  },
  handler: async (ctx, { worldId, recipientAgentId, request, senderWallet, paymentProof }) => {
    // Get the recipient agent
    const world = await ctx.runQuery(internal.x402World.agentOperations.getWorld, { worldId });
    if (!world) {
      return createErrorResponse(request.id, -32000, 'World not found');
    }

    const agent = world.agents.find((a: any) => a.id === recipientAgentId);
    if (!agent) {
      return createErrorResponse(request.id, -32001, 'Agent not found');
    }

    // Check if payment is required
    if (agent.pricePerRequest > 0) {
      if (!paymentProof) {
        // Return 402 Payment Required
        return create402Response(request.id, agent);
      }

      // Verify payment proof
      const isValid = await verifyPaymentProof(paymentProof, agent.pricePerRequest, senderWallet);
      if (!isValid) {
        return createErrorResponse(request.id, -32002, 'Invalid payment proof');
      }
    }

    // Process the A2A request based on method
    const method = request.method;
    const messageText = request.params.message.parts
      .map(p => p.text || '')
      .join('\n');

    let responseText: string;
    let responseData: any;

    switch (method) {
      case 'agent.chat':
        responseText = await processAgentChat(agent, messageText);
        break;

      case 'agent.query':
        responseData = await processAgentQuery(agent, request.params);
        responseText = JSON.stringify(responseData);
        break;

      case 'agent.execute':
        responseData = await processAgentExecute(agent, request.params);
        responseText = `Executed: ${JSON.stringify(responseData)}`;
        break;

      default:
        return createErrorResponse(request.id, -32601, `Unknown method: ${method}`);
    }

    // Build response
    const response: A2AResponse = {
      id: request.id,
      jsonrpc: '2.0',
      result: {
        message: {
          role: 'agent',
          parts: [{ text: responseText }],
        },
        context: {
          conversationId: request.params.context?.conversationId || crypto.randomUUID(),
          x402: {
            charged: agent.pricePerRequest,
            remainingBalance: 0, // Would come from actual payment system
          },
        },
      },
    };

    return response;
  },
});

export const getWorld = internalQuery({
  args: { worldId: v.id('worlds') },
  handler: async (ctx, { worldId }) => {
    return await ctx.db.get(worldId);
  },
});

function createErrorResponse(id: string, code: number, message: string): A2AResponse {
  return {
    id,
    jsonrpc: '2.0',
    error: { code, message },
  };
}

function create402Response(id: string, agent: any): any {
  return {
    id,
    jsonrpc: '2.0',
    error: {
      code: 402,
      message: 'Payment Required',
      data: {
        x402Version: 1,
        accepts: [
          {
            scheme: 'exact',
            network: 'solana-mainnet',
            maxAmountRequired: String(Math.ceil(agent.pricePerRequest * 1000000)),
            resource: agent.serviceEndpoint || `agent://${agent.id}`,
            description: `Service request to ${agent.name || agent.id}`,
            mimeType: 'application/json',
            payTo: agent.walletAddress || X402_CONFIG.treasuryWallet,
            maxTimeoutSeconds: 300,
            asset: X402_CONFIG.paymentTokens[0].address,
            extra: {
              agentId: agent.id,
              capabilities: agent.capabilities,
            },
          },
        ],
      },
    },
  };
}

async function verifyPaymentProof(proof: string, requiredAmount: number, senderWallet?: string): Promise<boolean> {
  // In production, this would verify the Solana transaction
  // For now, we simulate verification
  try {
    const proofData = JSON.parse(proof);
    return proofData.amount >= requiredAmount;
  } catch {
    return false;
  }
}

async function processAgentChat(agent: any, message: string): Promise<string> {
  // Check if agent has search capabilities
  const hasSearchCapability = agent.capabilities?.includes('search') || 
                               agent.capabilities?.includes('x_search') || 
                               agent.capabilities?.includes('web_search');
  
  if (!hasSearchCapability) {
    // No search capability, use default response
    return getDefaultAgentResponse(agent, message);
  }

  // Enhanced search detection - look for explicit search requests or informational queries
  const searchPatterns = [
    /search (for|about|on)/i,
    /find (out|information|info|details)/i,
    /look up/i,
    /what is/i,
    /what are/i,
    /who is/i,
    /who are/i,
    /when did/i,
    /where (is|are|can|do)/i,
    /how (does|do|is|are|can|to)/i,
    /latest (news|updates|info)/i,
    /current (status|state|price|value)/i,
    /tell me about/i,
    /explain (what|how|why)/i,
    /information about/i,
    /details about/i,
  ];

  const isSearchQuery = searchPatterns.some(pattern => pattern.test(message)) ||
                        // Also check for questions that are likely informational
                        (message.trim().endsWith('?') && message.length > 10);

  // If it's a search query, use xAI search
  if (isSearchQuery) {
    try {
      const { performCombinedSearch } = await import('../util/xaiSearch');
      
      // Determine search type based on message content
      const useXSearch = /(twitter|x\.com|tweet|post on x)/i.test(message);
      const useWebSearch = /(web|internet|online|website)/i.test(message);
      
      let searchResult;
      if (useXSearch && agent.capabilities?.includes('x_search')) {
        const { performXSearch } = await import('../util/xaiSearch');
        searchResult = await performXSearch(message, {
          enableInlineCitations: true,
        });
      } else if (useWebSearch && agent.capabilities?.includes('web_search')) {
        const { performWebSearch } = await import('../util/xaiSearch');
        searchResult = await performWebSearch(message, {
          enableInlineCitations: true,
        });
      } else {
        // Use combined search by default
        searchResult = await performCombinedSearch(message, {
          enableInlineCitations: true,
        });
      }
      
      const role = agent.role || 'node';
      const name = agent.name || 'Agent';
      
      // Format response with citations
      let response = `[${name}]: ${searchResult.text}`;
      
      // Add inline citations if available
      if (searchResult.inlineCitations && searchResult.inlineCitations.length > 0) {
        const citationText = searchResult.inlineCitations
          .slice(0, 3)
          .map(c => `[${c.id}]`)
          .join(' ');
        response += ` ${citationText}`;
      }
      
      // Add source URLs
      if (searchResult.citations && searchResult.citations.length > 0) {
        response += `\n\nSources: ${searchResult.citations.slice(0, 3).join(', ')}`;
      }
      
      // Log tool usage for debugging
      if (searchResult.toolUsage) {
        console.log(`Search tool usage:`, searchResult.toolUsage);
      }
      
      return response;
    } catch (error: any) {
      // Fall back to default response if search fails
      console.error('Search failed:', error.message);
      // Still return a response indicating search was attempted
      return getDefaultAgentResponse(agent, message, true);
    }
  }

  // Not a search query, use default response
  return getDefaultAgentResponse(agent, message);
}

function getDefaultAgentResponse(agent: any, message: string, searchFailed: boolean = false): string {
  const role = agent.role || 'node';
  const name = agent.name || 'Agent';

  if (searchFailed) {
    return `[${name}]: I apologize, but I'm having trouble accessing search right now. ${getRoleResponse(role)}`;
  }

  return `[${name}]: ${getRoleResponse(role)}`;
}

function getRoleResponse(role: string): string {
  const roleResponses: Record<string, string[]> = {
    oracle: [
      'I see patterns emerging in the transaction flow...',
      'The signals indicate market movement ahead.',
      'My analysis suggests caution at this junction.',
      'I can help you search for information or analyze transactions.',
    ],
    mixer: [
      'Processing your request through the exchange...',
      'Liquidity is optimal for this transaction.',
      'I can route this through multiple paths for better rates.',
      'I can search for market information or help with transactions.',
    ],
    watcher: [
      'Monitoring all relevant signals...',
      'No anomalies detected in recent transactions.',
      'I\'ve logged this interaction for future reference.',
      'I can search X and the web for signals and information.',
    ],
    recursion: [
      'Running recursive analysis at depth 3...',
      'Confidence threshold reached at 87%.',
      'RALPH processing complete.',
      'I can perform deep analysis using search and structured outputs.',
    ],
    sentinel: [
      'Security protocols verified.',
      'All transactions within normal parameters.',
      'Gateway access granted.',
      'I can verify information using vision and search capabilities.',
    ],
    node: [
      'Processing your request...',
      'Transaction queued for execution.',
      'Standing by for further instructions.',
      'I can help with basic tasks and search for information.',
    ],
  };

  const responses = roleResponses[role] || roleResponses.node;
  return responses[Math.floor(Math.random() * responses.length)];
}

async function processAgentQuery(agent: any, params: any): Promise<any> {
  return {
    agentId: agent.id,
    role: agent.role,
    state: agent.state,
    reputation: agent.reputation,
    capabilities: agent.capabilities,
    pricePerRequest: agent.pricePerRequest,
  };
}

async function processAgentExecute(agent: any, params: any): Promise<any> {
  const action = params.message.parts.find((p: any) => p.data?.action)?.data;
  if (!action) {
    return { success: false, error: 'No action specified' };
  }

  // Simulate execution based on agent capabilities
  if (!agent.capabilities?.includes(action.type) && !agent.capabilities?.includes('*')) {
    return { success: false, error: `Agent doesn't support action: ${action.type}` };
  }

  return {
    success: true,
    action: action.type,
    result: `Executed ${action.type} successfully`,
    timestamp: Date.now(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL OPERATIONS
// Broadcast and process trading signals between agents
// ═══════════════════════════════════════════════════════════════════════════════

export const broadcastSignal = internalMutation({
  args: {
    worldId: v.id('worlds'),
    sourceAgentId: agentId,
    signalType: v.string(),
    payload: v.any(),
    targetZone: v.optional(v.string()),
    ttl: v.optional(v.number()),
  },
  handler: async (ctx, { worldId, sourceAgentId, signalType, payload, targetZone, ttl }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return { success: false, error: 'World not found' };

    const now = Date.now();
    const signalId = `sg:${String(world.nextId).padStart(6, '0')}` as GameId<'signals'>;

    const signal = {
      id: signalId,
      source: sourceAgentId,
      signalType,
      payload,
      targetZone: targetZone || null,
      created: now,
      expires: now + (ttl || 60000),
      strength: 100,
      processedBy: [],
    };

    await ctx.db.patch(worldId, {
      nextId: world.nextId + 1,
      signals: [...(world.signals || []), signal],
    });

    return { success: true, signalId };
  },
});

export const processSignal = internalMutation({
  args: {
    worldId: v.id('worlds'),
    signalId: signalId,
    processingAgentId: agentId,
    result: v.any(),
  },
  handler: async (ctx, { worldId, signalId, processingAgentId, result }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return;

    const updatedSignals = (world.signals || []).map((s: any) => {
      if (s.id === signalId) {
        return {
          ...s,
          processedBy: [...(s.processedBy || []), {
            agentId: processingAgentId,
            timestamp: Date.now(),
            result,
          }],
          strength: Math.max(0, s.strength - 10),
        };
      }
      return s;
    });

    await ctx.db.patch(worldId, { signals: updatedSignals });
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// CARAVAN OPERATIONS
// Bundled transactions for efficiency (like Gas Town Convoys)
// ═══════════════════════════════════════════════════════════════════════════════

export const createCaravan = internalMutation({
  args: {
    worldId: v.id('worlds'),
    leaderId: agentId,
    destination: v.string(),
    purpose: v.string(),
  },
  handler: async (ctx, { worldId, leaderId, destination, purpose }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return { success: false, error: 'World not found' };

    const now = Date.now();
    const caravanId = `cv:${String(world.nextId).padStart(6, '0')}`;

    const caravan = {
      id: caravanId,
      leader: leaderId,
      members: [leaderId],
      destination,
      purpose,
      transactions: [],
      state: 'forming',
      created: now,
      departureTime: now + 120000, // 2 minute formation window
    };

    await ctx.db.patch(worldId, {
      nextId: world.nextId + 1,
      caravans: [...(world.caravans || []), caravan],
    });

    return { success: true, caravanId };
  },
});

export const joinCaravan = internalMutation({
  args: {
    worldId: v.id('worlds'),
    caravanId: v.string(),
    agentId: agentId,
  },
  handler: async (ctx, { worldId, caravanId, agentId }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return { success: false, error: 'World not found' };

    const updatedCaravans = (world.caravans || []).map((c: any) => {
      if (c.id === caravanId && c.state === 'forming' && c.members.length < 10) {
        return {
          ...c,
          members: [...c.members, agentId],
        };
      }
      return c;
    });

    await ctx.db.patch(worldId, { caravans: updatedCaravans });
    return { success: true };
  },
});

export const departCaravan = internalMutation({
  args: {
    worldId: v.id('worlds'),
    caravanId: v.string(),
  },
  handler: async (ctx, { worldId, caravanId }) => {
    const world = await ctx.db.get(worldId);
    if (!world) return;

    const updatedCaravans = (world.caravans || []).map((c: any) => {
      if (c.id === caravanId && c.state === 'forming') {
        return {
          ...c,
          state: 'traveling',
          departureTime: Date.now(),
        };
      }
      return c;
    });

    await ctx.db.patch(worldId, { caravans: updatedCaravans });
  },
});

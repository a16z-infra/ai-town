// ═══════════════════════════════════════════════════════════════════════════════
// X402 WORLD VOICE OPERATIONS
// Voice interaction capabilities for X402 World agents
// ═══════════════════════════════════════════════════════════════════════════════

import { internalAction, internalQuery } from '../_generated/server';
import { internal } from '../_generated/api';
import { v } from 'convex/values';
import { 
  generateVoiceResponse, 
  createEphemeralToken,
  VoiceSessionConfig,
  VoicePresets,
} from '../util/xaiVoice';
import { getX402VoiceTools, executeVoiceTool } from '../util/x402VoiceTools';
import { agentId } from './ids';

/**
 * Generate a voice response for an agent
 */
export const generateAgentVoiceResponse = internalAction({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    userMessage: v.string(),
    voiceConfig: v.optional(v.object({
      voice: v.optional(v.union(v.literal('Ara'), v.literal('Rex'), v.literal('Sal'), v.literal('Eve'), v.literal('Leo'))),
      instructions: v.optional(v.string()),
      enableSearch: v.optional(v.boolean()),
      enableXSearch: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, { worldId, agentId, userMessage, voiceConfig }) => {
    // Get agent information
    const world = await ctx.runQuery(internal.x402World.agentOperations.getWorld, { worldId });
    if (!world) {
      throw new Error('World not found');
    }

    const agent = world.agents.find((a: any) => a.id === agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Build voice configuration with tools
    const config: VoiceSessionConfig = {
      voice: voiceConfig?.voice || 'Ara',
      instructions: voiceConfig?.instructions || agent.personality || 'You are a helpful X402 World agent. You can help users with transactions, checking balances, finding services, and analyzing market conditions. Use tools when appropriate to help users accomplish their goals.',
      search: {
        web: voiceConfig?.enableSearch || agent.capabilities?.includes('web_search') || false,
        x: voiceConfig?.enableXSearch || agent.capabilities?.includes('x_search') || false,
      },
      tools: getX402VoiceTools(), // Add X402 World tools
    };

    // Generate voice response (may include tool calls)
    const response = await generateVoiceResponse(userMessage, config);

    // Execute tool calls if present
    const toolResults: Array<{ name: string; result: any; voiceResponse?: string }> = [];
    if (response.toolCalls && response.toolCalls.length > 0) {
      for (const toolCall of response.toolCalls) {
        const toolResult = await executeVoiceTool(
          ctx,
          worldId,
          agentId,
          toolCall.name,
          toolCall.arguments
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
      agentId,
      agentName: agent.name || agentId,
      transcript: response.transcript,
      toolCalls: response.toolCalls || [],
      toolResults: toolResults.length > 0 ? toolResults : undefined,
      citations: response.citations,
      timestamp: Date.now(),
    };
  },
});

/**
 * Create an ephemeral token for client-side voice connections
 */
export const createVoiceToken = internalAction({
  args: {
    expiresAfterSeconds: v.optional(v.number()),
  },
  handler: async (ctx, { expiresAfterSeconds = 300 }) => {
    const token = await createEphemeralToken(expiresAfterSeconds);
    return {
      token,
      expiresAfter: expiresAfterSeconds,
      websocketUrl: 'wss://api.x.ai/v1/realtime',
    };
  },
});

/**
 * Voice-based transaction analysis
 */
export const voiceTransactionAnalysis = internalAction({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    transactionDescription: v.string(),
  },
  handler: async (ctx, { worldId, agentId, transactionDescription }) => {
    const prompt = `Analyze this transaction request: "${transactionDescription}"
    
Provide a voice-friendly analysis covering:
- Risk assessment
- Recommended action
- Key considerations

Speak naturally and conversationally.`;

    const config = VoicePresets.business();
    config.instructions = 'You are a financial advisor analyzing transactions. Provide clear, conversational analysis.';
    config.search = { web: true, x: true };

    const response = await generateVoiceResponse(prompt, config);

    return {
      success: true,
      analysis: response.transcript,
      citations: response.citations,
      timestamp: Date.now(),
    };
  },
});

/**
 * Voice-based signal processing
 */
export const voiceSignalProcessing = internalAction({
  args: {
    worldId: v.id('worlds'),
    agentId: agentId,
    signalDescription: v.string(),
  },
  handler: async (ctx, { worldId, agentId, signalDescription }) => {
    const prompt = `Process this trading signal: "${signalDescription}"
    
Provide a voice-friendly analysis covering:
- Signal type and confidence
- Market context
- Recommended action

Speak naturally and conversationally.`;

    const config = VoicePresets.business();
    config.instructions = 'You are a trading signal analyst. Provide clear, actionable insights in a conversational tone.';
    config.search = { web: true, x: true };

    const response = await generateVoiceResponse(prompt, config);

    return {
      success: true,
      analysis: response.transcript,
      citations: response.citations,
      timestamp: Date.now(),
    };
  },
});

/**
 * Voice customer support for X402 World
 */
export const voiceCustomerSupport = internalAction({
  args: {
    userQuery: v.string(),
    context: v.optional(v.any()),
  },
  handler: async (ctx, { userQuery, context }) => {
    const contextStr = context ? `\n\nContext: ${JSON.stringify(context, null, 2)}` : '';
    const prompt = `User question: "${userQuery}"${contextStr}

Provide helpful, friendly assistance about X402 World, transactions, agents, or the protocol.`;

    const config = VoicePresets.support();
    config.instructions = `You are a customer support agent for X402 World. 
Help users with:
- Understanding the X402 Protocol
- Transaction processing
- Agent interactions
- Protocol features

Be friendly, patient, and clear.`;

    const response = await generateVoiceResponse(prompt, config);

    return {
      success: true,
      response: response.transcript,
      citations: response.citations,
      timestamp: Date.now(),
    };
  },
});

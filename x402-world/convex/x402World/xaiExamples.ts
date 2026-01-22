// ═══════════════════════════════════════════════════════════════════════════════
// XAI INTEGRATION EXAMPLES
// Example functions demonstrating xAI capabilities in X402 World
// ═══════════════════════════════════════════════════════════════════════════════

import { internalAction } from '../_generated/server';
import { v } from 'convex/values';
import { getStructuredOutput, TransactionAnalysisSchema, SignalAnalysisSchema, MarketSummarySchema } from '../util/xaiStructured';
import { analyzeImage, ImageAnalysisSchema, ChartAnalysisSchema } from '../util/xaiVision';
import { performXSearch, performWebSearch } from '../util/xaiSearch';

/**
 * Example: Analyze a transaction using structured outputs
 */
export const analyzeTransaction = internalAction({
  args: {
    transactionData: v.any(),
    useSearch: v.optional(v.boolean()),
  },
  handler: async (ctx, { transactionData, useSearch }) => {
    const prompt = `Analyze this transaction and assess its risk:
${JSON.stringify(transactionData, null, 2)}

Provide a structured risk assessment with recommendations.`;

    const systemPrompt = `You are a financial risk analyst for X402 World. 
Analyze transactions carefully, considering:
- Transaction amount and token type
- Sender and receiver reputation
- Historical patterns
- Market conditions

Provide actionable recommendations.`;

    const result = await getStructuredOutput(prompt, systemPrompt, {
      schema: TransactionAnalysisSchema,
      useTools: useSearch || false,
      toolOptions: useSearch ? {
        webSearch: true,
        xSearch: true,
      } : undefined,
    });

    return result.data;
  },
});

/**
 * Example: Analyze trading signals using structured outputs with X search
 */
export const analyzeTradingSignal = internalAction({
  args: {
    signalData: v.any(),
    allowedHandles: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { signalData, allowedHandles }) => {
    const prompt = `Analyze this trading signal:
${JSON.stringify(signalData, null, 2)}

Consider current market conditions and provide a structured signal analysis.`;

    const systemPrompt = `You are a trading signal analyst. Analyze signals considering:
- Market trends
- Historical performance
- Risk factors
- Optimal entry/exit points`;

    const result = await getStructuredOutput(prompt, systemPrompt, {
      schema: SignalAnalysisSchema,
      useTools: true,
      toolOptions: {
        webSearch: true,
        xSearch: true,
        allowedXHandles: allowedHandles,
        fromDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
      },
    });

    return result.data;
  },
});

/**
 * Example: Get market summary using structured outputs
 */
export const getMarketSummary = internalAction({
  args: {
    tokens: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { tokens }) => {
    const tokenList = tokens?.join(', ') || 'SOL, USDC, X402';
    const prompt = `Provide a comprehensive market summary for: ${tokenList}
Include recent events, price trends, and trading recommendations.`;

    const systemPrompt = `You are a market analyst. Provide structured market insights including:
- Overall sentiment
- Key events and their impact
- Price trends
- Actionable recommendations`;

    const result = await getStructuredOutput(prompt, systemPrompt, {
      schema: MarketSummarySchema,
      useTools: true,
      toolOptions: {
        webSearch: true,
        xSearch: true,
        allowedXHandles: ['solana', 'x402protocol'],
      },
    });

    return result.data;
  },
});

/**
 * Example: Analyze an image (e.g., trading chart)
 */
export const analyzeTradingChart = internalAction({
  args: {
    imageUrl: v.string(),
    token: v.optional(v.string()),
  },
  handler: async (ctx, { imageUrl, token }) => {
    const prompt = token 
      ? `Analyze this trading chart for ${token}. Extract all data points, identify trends, and provide insights.`
      : 'Analyze this trading chart. Extract all data points, identify trends, and provide insights.';

    const systemPrompt = 'You are a financial chart analyst. Extract precise data and identify meaningful patterns.';

    const result = await analyzeImage(imageUrl, prompt, systemPrompt, {
      structuredOutput: ChartAnalysisSchema,
      useWebSearch: true,
    });

    return result.structuredData;
  },
});

/**
 * Example: Search X for specific information and get structured output
 */
export const searchXForSignals = internalAction({
  args: {
    query: v.string(),
    handles: v.optional(v.array(v.string())),
    days: v.optional(v.number()),
  },
  handler: async (ctx, { query, handles, days }) => {
    // First, search X
    const searchResult = await performXSearch(query, {
      allowedXHandles: handles,
      fromDate: days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
      enableInlineCitations: true,
    });

    // Then, analyze the results with structured output
    const analysisPrompt = `Based on the following X search results, analyze trading signals:
${searchResult.text}

Extract structured signal information.`;

    const analysisResult = await getStructuredOutput(
      analysisPrompt,
      'You are a signal extraction expert. Extract trading signals from social media posts.',
      {
        schema: SignalAnalysisSchema,
      }
    );

    return {
      searchResults: searchResult.text,
      citations: searchResult.citations,
      signalAnalysis: analysisResult.data,
    };
  },
});

/**
 * Example: Vision + Search combined - Analyze image and search for context
 */
export const analyzeImageWithContext = internalAction({
  args: {
    imageUrl: v.string(),
    searchQuery: v.optional(v.string()),
  },
  handler: async (ctx, { imageUrl, searchQuery }) => {
    // Analyze the image
    const visionResult = await analyzeImage(
      imageUrl,
      'Describe this image in detail and identify any text, objects, or patterns.',
      undefined,
      {
        structuredOutput: ImageAnalysisSchema,
        useWebSearch: !!searchQuery,
      }
    );

    // If search query provided, search for additional context
    let searchContext = null;
    if (searchQuery) {
      const searchResult = await performWebSearch(searchQuery, {
        enableInlineCitations: true,
      });
      searchContext = searchResult.text;
    }

    return {
      imageAnalysis: visionResult.structuredData,
      searchContext,
      citations: visionResult.citations,
    };
  },
});

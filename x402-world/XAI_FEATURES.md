# xAI Features Integration for X402 World

X402 World agents now have access to four powerful xAI capabilities:

## 🎯 Features Overview

### 1. **Search Tools** (Web + X Search)
- Web search with domain filtering
- X (Twitter) search with handle/date filtering
- Image and video understanding in search results
- Citation extraction

### 2. **Structured Outputs**
- Type-safe, schema-validated responses
- Pre-defined schemas for common tasks
- Custom schema support
- Combined with search tools

### 3. **Vision Capabilities**
- Image analysis and description
- Chart data extraction
- Document parsing
- Multi-image comparison
- Combined with search for context

### 4. **Voice Agent API** 🆕
- Real-time voice conversations via WebSocket
- 5 distinct voice personalities (Ara, Rex, Sal, Eve, Leo)
- Multiple audio formats (PCM, PCMU, PCMA)
- Tool calling during voice conversations
- Multilingual support (100+ languages)
- Low latency for natural conversations

## 📋 Quick Start

### 1. Set API Key
```bash
npx convex env set XAI_API_KEY "your-api-key-here"
```

### 2. Agents Automatically Use These Features

Agents with the following capabilities will automatically use xAI:
- **search** - Uses web/X search when queries contain search keywords
- **structured_output** - Returns structured, type-safe responses
- **vision** - Analyzes images when provided
- **image_analysis** - Deep image understanding

## 🔧 Usage Examples

### Structured Transaction Analysis

```typescript
import { api } from './convex/_generated/api';

// Agent automatically uses structured outputs for analysis
const result = await ctx.runAction(api.x402World.agentOperations.requestService, {
  worldId,
  requesterId: 'ag:000001',
  providerId: 'ag:000002',
  serviceType: 'analysis',
  payload: {
    prompt: 'Analyze this transaction for risks...',
    schema: TransactionAnalysisSchema,
    useTools: true,
  },
  offeredPrice: 0.05,
});

// Result is type-safe
console.log(result.analysis.risk_level); // 'low' | 'medium' | 'high' | 'critical'
console.log(result.analysis.confidence); // number (0-100)
console.log(result.analysis.recommendations); // string[]
```

### Vision Analysis

```typescript
// Analyze a trading chart
const result = await ctx.runAction(api.x402World.agentOperations.requestService, {
  worldId,
  requesterId: 'ag:000001',
  providerId: 'ag:000004', // Deep Analysis Engine
  serviceType: 'vision',
  payload: {
    imageUrl: 'https://example.com/chart.png',
    prompt: 'Extract all data points from this chart',
    analysisType: 'chart', // Uses ChartAnalysisSchema
  },
  offeredPrice: 0.03,
});

// Structured chart data
console.log(result.analysis.data_points);
console.log(result.analysis.trends);
```

### Search + Structured Output

```typescript
// Search X and get structured signal analysis
const result = await ctx.runAction(api.x402World.xaiExamples.searchXForSignals, {
  query: 'Solana price predictions',
  handles: ['solana', 'x402protocol'],
  days: 7,
});

console.log(result.signalAnalysis.signal_type); // 'buy' | 'sell' | 'hold'
console.log(result.signalAnalysis.confidence);
console.log(result.citations); // Source URLs
```

## 📊 Pre-defined Schemas

### TransactionAnalysisSchema
```typescript
{
  risk_level: 'low' | 'medium' | 'high' | 'critical',
  confidence: number (0-100),
  recommendations: string[],
  estimated_value: number,
  flags: string[],
}
```

### SignalAnalysisSchema
```typescript
{
  signal_type: 'buy' | 'sell' | 'hold' | 'swap' | 'stake' | 'delegate',
  confidence: number (0-100),
  reasoning: string,
  target_price: number,
  stop_loss: number,
  timeframe: string,
}
```

### MarketSummarySchema
```typescript
{
  overall_sentiment: 'bullish' | 'bearish' | 'neutral',
  key_events: Array<{ event: string, impact: 'low' | 'medium' | 'high' }>,
  price_trends: { sol: number, usdc: number, trend: 'up' | 'down' | 'stable' },
  recommendations: string[],
}
```

### ImageAnalysisSchema
```typescript
{
  description: string,
  objects: Array<{ name: string, confidence: number, location: {...} }>,
  text: string[],
  sentiment: 'positive' | 'negative' | 'neutral',
  tags: string[],
}
```

### ChartAnalysisSchema
```typescript
{
  chart_type: 'line' | 'bar' | 'pie' | 'candlestick' | 'scatter' | 'other',
  data_points: Array<{ label: string, value: number, timestamp: string }>,
  trends: string[],
  insights: string[],
}
```

## 🎨 Agent Capabilities by Role

| Role | Search | Structured Output | Vision | Voice |
|------|--------|-------------------|--------|-------|
| **Oracle** | ✅ Full | ✅ Yes | ✅ Yes | ✅ Yes |
| **Mixer** | ✅ Basic | ✅ Yes | ❌ No | ✅ Yes |
| **Watcher** | ✅ Full | ✅ Yes | ✅ Yes | ✅ Yes |
| **Recursion** | ✅ Full | ✅ Yes | ✅ Yes | ✅ Yes |
| **Sentinel** | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Node** | ✅ Basic | ✅ Yes | ❌ No | ✅ Yes |

## 🔄 Workflow Examples

### 1. Agent Decision with Search
```typescript
// Agent uses search to gather information, then makes structured decision
const decision = await getStructuredOutput(
  'Should we execute this trade?',
  'You are a trading agent. Use search to gather current market data.',
  {
    schema: AgentDecisionSchema,
    useTools: true,
    toolOptions: {
      webSearch: true,
      xSearch: true,
      allowedXHandles: ['solana'],
    },
  }
);
```

### 2. Image + Search Analysis
```typescript
// Analyze image and search for additional context
const result = await analyzeImage(
  'https://example.com/chart.png',
  'What does this chart show?',
  undefined,
  {
    structuredOutput: ChartAnalysisSchema,
    useWebSearch: true, // Search for context about the chart
  }
);
```

### 3. Multi-step Analysis
```typescript
// 1. Search for information
const searchResult = await performXSearch('Solana price trends');

// 2. Analyze with structured output
const analysis = await getStructuredOutput(
  `Based on: ${searchResult.text}\n\nAnalyze the market.`,
  'You are a market analyst.',
  {
    schema: MarketSummarySchema,
  }
);
```

## ⚙️ Configuration

All features use the same API key:
```bash
npx convex env set XAI_API_KEY "your-key"
```

Model used: `grok-4-1-fast` (optimized for speed and tool calling)

## 🎤 Voice Capabilities

### Voice Presets

```typescript
// Business voice (Rex)
VoicePresets.business()

// Customer support (Ara)
VoicePresets.support()

// Interactive (Eve)
VoicePresets.interactive()

// Instructional (Leo)
VoicePresets.instructional()

// Telephony (Sal, PCMU, 8kHz)
VoicePresets.telephony()

// X402 Agent (Ara, with search)
VoicePresets.x402Agent('oracle')
```

### Voice Operations

```typescript
// Generate agent voice response
const response = await ctx.runAction(api.x402World.voiceOperations.generateAgentVoiceResponse, {
  worldId,
  agentId: 'ag:000001',
  userMessage: 'What is the X402 Protocol?',
  voiceConfig: {
    voice: 'Rex',
    enableSearch: true,
  },
});

// Voice transaction analysis
const analysis = await ctx.runAction(api.x402World.voiceOperations.voiceTransactionAnalysis, {
  worldId,
  agentId: 'ag:000001',
  transactionDescription: 'Transfer 100 USDC',
});

// Voice customer support
const support = await ctx.runAction(api.x402World.voiceOperations.voiceCustomerSupport, {
  userQuery: 'How do I create a transaction?',
});
```

### WebSocket Integration

For full real-time voice streaming, use WebSocket:

```typescript
// Create ephemeral token for client
const tokenInfo = await ctx.runAction(api.x402World.voiceOperations.createVoiceToken);

// Connect to wss://api.x.ai/v1/realtime
// Use tokenInfo.token for authentication
```

See `XAI_VOICE_SETUP.md` for complete WebSocket integration guide.

## 📝 Notes

- **Structured outputs guarantee schema compliance** - responses always match your schema
- **Vision supports multiple images** - analyze up to multiple images in one request
- **Search tools can be combined** - use web + X search together
- **Citations included** - all search results include source URLs
- **Type-safe** - TypeScript types match the schemas
- **Token usage** - Vision and video understanding increase token usage
- **Voice supports real-time streaming** - WebSocket for bidirectional audio
- **Voice multilingual** - Automatic language detection and response
- **Voice tool calling** - Can use search and custom tools during conversations

## 🚀 Next Steps

1. Set your `XAI_API_KEY`
2. Agents will automatically use these features when appropriate
3. Use the example functions in `xaiExamples.ts` as templates
4. Create custom schemas for your specific use cases

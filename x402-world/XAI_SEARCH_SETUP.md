# xAI Integration for X402 World

This guide explains how to set up xAI's capabilities (Search, Structured Outputs, and Vision) for X402 World agents.

## Setup

### 1. Get Your xAI API Key

1. Sign up at [x.ai](https://x.ai)
2. Navigate to your API keys section
3. Create a new API key

### 2. Set the Environment Variable

In your x402-world directory, run:

```bash
npx convex env set XAI_API_KEY "your-api-key-here"
```

This securely stores your API key in Convex's environment variables (never exposed to the client).

### 3. Install Dependencies

```bash
npm install
```

## Usage

### Agent Capabilities

Agents with search capabilities can now:
- **Web Search**: Search the web and browse pages
- **X Search**: Search X (Twitter) for posts, users, and threads
- **Combined Search**: Use both web and X search together

### Which Agents Have Search?

The following agents have search capabilities enabled by default:
- **Chief Orchestrator (Oracle)**: Full search access (web + X)
- **Liquidity Coordinator (Mixer)**: Basic search
- **Signal Processor (Watcher)**: X search + web search
- **Deep Analysis Engine (Recursion)**: Full search access
- **General Purpose (Node)**: Basic search

### Using Search in Agent Chat

When an agent with search capabilities receives a message containing search keywords (like "search", "find", "what is", "who is", etc.), it will automatically use xAI's search tools to find information.

Example queries:
- "What is the latest news about Solana?"
- "Search X for posts about X402 Protocol"
- "Find information about autonomous agents"

### Programmatic Search

You can also call search directly from agent operations:

```typescript
import { performWebSearch, performXSearch, performCombinedSearch } from '../util/xaiSearch';

// Web search
const result = await performWebSearch('What is X402 Protocol?', {
  allowedDomains: ['x402.world'],
  enableInlineCitations: true,
});

// X search
const xResult = await performXSearch('Latest posts about Solana', {
  allowedXHandles: ['solana'],
  fromDate: '2025-01-01',
  enableVideoUnderstanding: true,
});

// Combined search
const combined = await performCombinedSearch('What are people saying about AI agents?');
```

## Search Options

### Web Search Options
- `allowedDomains`: Array of up to 5 domains to search within
- `excludedDomains`: Array of up to 5 domains to exclude
- `enableImageUnderstanding`: Enable image analysis (increases token usage)

### X Search Options
- `allowedXHandles`: Array of up to 10 X handles to search from
- `excludedXHandles`: Array of up to 10 X handles to exclude
- `fromDate`: Start date in ISO8601 format (YYYY-MM-DD)
- `toDate`: End date in ISO8601 format (YYYY-MM-DD)
- `enableImageUnderstanding`: Enable image analysis
- `enableVideoUnderstanding`: Enable video analysis (increases token usage)

### Common Options
- `enableInlineCitations`: Include markdown citations in response text

## Citations

Search results include:
- **All Citations**: List of all source URLs encountered
- **Inline Citations**: Markdown-style links embedded in response text (e.g., `[[1]](https://x.ai/news)`)

## Service Integration

Agents can offer search as a service:

```typescript
// Request search service from an agent
const searchResult = await requestService({
  worldId,
  requesterId: 'ag:000001',
  providerId: 'ag:000002', // An agent with search capability
  serviceType: 'web_search',
  payload: {
    query: 'What is the X402 Protocol?',
    enableInlineCitations: true,
  },
  offeredPrice: 0.01, // USDC
});
```

## Troubleshooting

### "XAI_API_KEY not set" Error
Run: `npx convex env set XAI_API_KEY "your-key"`

### Search Not Working
1. Verify your API key is valid
2. Check that the agent has search capabilities
3. Ensure the query contains search keywords
4. Check Convex logs for API errors

### API Format Issues
If you encounter API format errors, the xAI API format may have changed. Check the [xAI API documentation](https://docs.x.ai) for the latest format.

## Structured Outputs

Agents can use structured outputs to get type-safe, schema-validated responses from xAI.

### Pre-defined Schemas

The following schemas are available:
- `TransactionAnalysisSchema` - For analyzing transaction risk and value
- `SignalAnalysisSchema` - For trading signal analysis
- `MarketSummarySchema` - For market sentiment and trends
- `AgentDecisionSchema` - For structured decision-making

### Using Structured Outputs

```typescript
import { getStructuredOutput } from '../util/xaiStructured';
import { AgentDecisionSchema } from '../util/xaiStructured';

const result = await getStructuredOutput(
  'Should I execute this transaction?',
  'You are a financial advisor. Analyze transactions carefully.',
  {
    schema: AgentDecisionSchema,
    useTools: true,
    toolOptions: {
      webSearch: true,
      xSearch: true,
    },
  }
);

console.log(result.data.action); // Type-safe access
console.log(result.data.confidence); // Guaranteed to be 0-100
```

### Custom Schemas

You can define custom schemas using JSON Schema format:

```typescript
const customSchema = {
  type: 'object',
  properties: {
    field1: { type: 'string' },
    field2: { type: 'number', minimum: 0, maximum: 100 },
    field3: { type: 'array', items: { type: 'string' } },
  },
  required: ['field1', 'field2'],
  additionalProperties: false,
};

const result = await getStructuredOutput(prompt, systemPrompt, {
  schema: customSchema,
});
```

## Vision Capabilities

Agents can analyze images and videos using xAI's vision capabilities.

### Image Analysis

```typescript
import { analyzeImage, ImageAnalysisSchema } from '../util/xaiVision';

const result = await analyzeImage(
  'https://example.com/image.png',
  'What is in this image?',
  'You are an image analysis expert.',
  {
    structuredOutput: ImageAnalysisSchema,
    useWebSearch: true, // Can combine with search
  }
);

console.log(result.structuredData.description);
console.log(result.structuredData.objects);
```

### Chart Analysis

```typescript
import { analyzeImage, ChartAnalysisSchema } from '../util/xaiVision';

const result = await analyzeImage(
  'https://example.com/chart.png',
  'Extract all data points and trends from this chart',
  undefined,
  {
    structuredOutput: ChartAnalysisSchema,
  }
);

console.log(result.structuredData.data_points);
console.log(result.structuredData.trends);
```

### Document Analysis

```typescript
import { analyzeImage, DocumentAnalysisSchema } from '../util/xaiVision';

const result = await analyzeImage(
  'https://example.com/invoice.pdf',
  'Extract all information from this invoice',
  undefined,
  {
    structuredOutput: DocumentAnalysisSchema,
  }
);

console.log(result.structuredData.extracted_fields);
console.log(result.structuredData.amounts);
```

### Multiple Images

```typescript
import { analyzeImages } from '../util/xaiVision';

const result = await analyzeImages(
  ['https://example.com/img1.png', 'https://example.com/img2.png'],
  'Compare these two images',
);
```

## Service Integration Examples

### Structured Analysis Service

```typescript
const result = await requestService({
  worldId,
  requesterId: 'ag:000001',
  providerId: 'ag:000002',
  serviceType: 'analysis',
  payload: {
    prompt: 'Analyze this market situation...',
    schema: AgentDecisionSchema,
    useTools: true,
  },
  offeredPrice: 0.05,
});
```

### Vision Service

```typescript
const result = await requestService({
  worldId,
  requesterId: 'ag:000001',
  providerId: 'ag:000004', // Deep Analysis Engine
  serviceType: 'vision',
  payload: {
    imageUrl: 'https://example.com/chart.png',
    prompt: 'Analyze this trading chart',
    analysisType: 'chart', // Uses ChartAnalysisSchema
  },
  offeredPrice: 0.03,
});
```

### Custom Structured Output

```typescript
const result = await requestService({
  worldId,
  requesterId: 'ag:000001',
  providerId: 'ag:000002',
  serviceType: 'structured_output',
  payload: {
    prompt: 'Extract key information from this text...',
    systemPrompt: 'You are a data extraction expert.',
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        value: { type: 'number' },
      },
      required: ['key', 'value'],
    },
  },
  offeredPrice: 0.02,
});
```

## Notes

- Search uses `grok-4-1-fast` model for speed
- Structured outputs use `grok-4-1-fast` with JSON schema validation
- Vision uses `grok-4-1-fast` with image understanding
- Image and video understanding increase token usage
- Citations are included by default
- All results are cached in agent memories for future reference
- Structured outputs guarantee type safety and schema compliance

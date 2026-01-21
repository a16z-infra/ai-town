# Voice Tool Calling in X402 World

X402 World agents can execute tools during voice conversations, enabling natural voice interactions with full protocol functionality.

## Available Tools

### 1. `create_transaction`
Create a new transaction in X402 World.

**Example Voice Query:**
- "Transfer 100 USDC to agent ag:000002"
- "Send 50 X402 tokens to Alice"
- "Create a payment of 0.1 SOL to the oracle"

**Parameters:**
- `from` (string) - Source agent ID
- `to` (string) - Destination agent ID
- `amount` (number) - Amount in smallest units
- `tokenType` (string) - 'usdc', 'x402', or 'sol'
- `serviceType` (string, optional) - Type of service if applicable
- `description` (string, optional) - Human-readable description

### 2. `check_balance`
Check an agent's balance.

**Example Voice Query:**
- "What's my balance?"
- "How much USDC do I have?"
- "Check the balance for agent ag:000001"

**Parameters:**
- `agentId` (string) - Agent ID to check
- `tokenType` (string, optional) - 'usdc', 'x402', 'sol', or 'all'

### 3. `get_agent_info`
Get information about an agent.

**Example Voice Query:**
- "Tell me about agent ag:000001"
- "What can the oracle do?"
- "What's the reputation of agent ag:000002?"

**Parameters:**
- `agentId` (string) - Agent ID to query

### 4. `find_service_providers`
Find agents that can provide a service.

**Example Voice Query:**
- "Find me an agent that can do analysis"
- "Who can help with signal processing?"
- "Find a voice service provider"

**Parameters:**
- `serviceType` (string) - Type of service needed
- `maxPrice` (number, optional) - Maximum price willing to pay

### 5. `broadcast_signal`
Broadcast a trading signal or alert.

**Example Voice Query:**
- "Broadcast a price alert for SOL"
- "Send a risk warning to all agents"
- "Alert others about this trading opportunity"

**Parameters:**
- `signalType` (string) - 'price_alert', 'opportunity', 'risk_warning', or 'caravan_forming'
- `payload` (object) - Signal data
- `targetZone` (string, optional) - Target zone

### 6. `analyze_transaction`
Analyze a transaction for risks.

**Example Voice Query:**
- "Is transaction tx:000001 safe?"
- "Analyze this transaction for risks"
- "Check transaction tx:000002"

**Parameters:**
- `transactionId` (string) - Transaction ID to analyze

### 7. `get_market_summary`
Get current market conditions.

**Example Voice Query:**
- "What's the market sentiment?"
- "Give me a market summary"
- "What are the current market trends?"

**Parameters:**
- `tokens` (array, optional) - List of tokens to analyze

## Usage

### Enable Tools in Voice Conversations

```typescript
import { generateVoiceResponse, VoicePresets } from '../util/xaiVoice';
import { getX402VoiceTools } from '../util/x402VoiceTools';

const config = VoicePresets.x402Agent('oracle');
config.tools = getX402VoiceTools(); // Enable X402 World tools

const response = await generateVoiceResponse(
  'Transfer 100 USDC to agent ag:000002',
  config
);

// Check if tools were called
if (response.toolCalls) {
  for (const toolCall of response.toolCalls) {
    console.log(`Tool called: ${toolCall.name}`);
    console.log(`Arguments:`, toolCall.arguments);
  }
}
```

### Execute Tools During Voice Service

```typescript
const result = await requestService({
  serviceType: 'voice',
  payload: {
    text: 'Check my balance and then transfer 50 USDC to agent ag:000002',
    preset: 'x402',
    enableTools: true, // Enable tool calling
    worldId: worldId,
    agentId: 'ag:000001',
  },
});

// Tools are automatically executed
console.log(result.toolCalls); // Tools that were called
console.log(result.toolResults); // Results from tool execution
```

### Voice Operations with Tools

```typescript
// Agent voice response with automatic tool execution
const response = await ctx.runAction(
  api.x402World.voiceOperations.generateAgentVoiceResponse,
  {
    worldId,
    agentId: 'ag:000001',
    userMessage: 'Create a transaction to send 100 USDC to Alice',
    voiceConfig: {
      voice: 'Rex',
      enableSearch: true,
    },
  }
);

// Tools are automatically executed and results included
console.log(response.toolCalls);
console.log(response.toolResults);
```

## Tool Execution Flow

1. **User speaks** - "Transfer 100 USDC to agent ag:000002"
2. **Agent processes** - Voice agent understands the request
3. **Tool called** - Agent calls `create_transaction` tool
4. **Tool executed** - System executes the transaction
5. **Voice response** - Agent responds: "I've created a transaction for 100 USDC from your account to agent ag:000002. The transaction is now pending confirmation."

## Natural Language Examples

### Transaction Creation
- **User**: "Send 50 USDC to the oracle"
- **Agent**: *[Calls create_transaction tool]*
- **Agent**: "I've created a transaction for 50 USDC to the oracle. The transaction is now pending confirmation."

### Balance Check
- **User**: "What's my current balance?"
- **Agent**: *[Calls check_balance tool]*
- **Agent**: "You have a balance of 1 USDC, 5 X402 tokens, and 0.1 SOL."

### Service Discovery
- **User**: "Find me someone who can analyze transactions"
- **Agent**: *[Calls find_service_providers tool]*
- **Agent**: "I found 2 agents that can provide analysis. The first is Analysis Engine at 0.05 USDC per request, and the second is Deep Analysis at 0.03 USDC per request."

### Market Analysis
- **User**: "What's the current market sentiment?"
- **Agent**: *[Calls get_market_summary tool, may also use web_search]*
- **Agent**: "The current market sentiment is bullish. Key events include price increases and high trading volume. I recommend considering buying opportunities and monitoring trends closely."

## Combining Tools with Search

Tools can be combined with search capabilities:

```typescript
const config = {
  voice: 'Ara',
  instructions: 'You are a helpful X402 World agent.',
  tools: getX402VoiceTools(), // X402 World tools
  search: {
    web: true, // Can search the web
    x: true,   // Can search X
  },
};

// Agent can now:
// - Execute X402 World operations (tools)
// - Search for current information (web/X search)
// - Combine both for comprehensive responses
```

## Custom Tool Execution

You can customize tool execution by implementing your own handlers:

```typescript
import { executeVoiceTool } from '../util/x402VoiceTools';

// Execute a specific tool
const result = await executeVoiceTool(
  'create_transaction',
  {
    from: 'ag:000001',
    to: 'ag:000002',
    amount: 1000000,
    tokenType: 'usdc',
  },
  {
    worldId: 'world123',
    agentId: 'ag:000001',
  }
);

console.log(result.voiceResponse); // Natural language response
console.log(result.result); // Structured result
```

## Best Practices

1. **Enable tools for voice agents** - Add `getX402VoiceTools()` to voice config
2. **Natural language** - Tools are called automatically based on user intent
3. **Voice-friendly responses** - Tool results include natural language responses
4. **Error handling** - Tools return voice-friendly error messages
5. **Combine with search** - Use both tools and search for comprehensive responses

## Notes

- Tools are called automatically based on conversation context
- Tool execution results are included in voice responses
- All tools return voice-friendly natural language responses
- Tools can be combined with web/X search for richer responses
- Tool execution happens server-side for security

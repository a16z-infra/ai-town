# xAI Voice Agent API Integration for X402 World

This guide explains how to use xAI's Voice Agent API for real-time voice interactions with X402 World agents.

## Overview

The Grok Voice Agent API enables:
- **Real-time voice conversations** via WebSocket
- **5 distinct voice personalities** (Ara, Rex, Sal, Eve, Leo)
- **Multiple audio formats** (PCM, PCMU, PCMA)
- **Tool calling** during voice conversations (web search, X search, custom functions)
- **Multilingual support** (100+ languages)
- **Low latency** for natural conversations

## Setup

### 1. API Key

The same `XAI_API_KEY` is used for voice:

```bash
npx convex env set XAI_API_KEY "your-api-key-here"
```

### 2. WebSocket Connection

The Voice Agent API uses WebSocket connections to:
```
wss://api.x.ai/v1/realtime
```

## Voice Options

### Available Voices

| Voice | Type | Tone | Best For |
|-------|------|------|----------|
| **Ara** | Female | Warm, friendly | Default, conversational |
| **Rex** | Male | Confident, clear | Business, professional |
| **Sal** | Neutral | Smooth, balanced | Versatile, various contexts |
| **Eve** | Female | Energetic, upbeat | Interactive, engaging |
| **Leo** | Male | Authoritative, strong | Instructional, decisive |

### Audio Formats

- **audio/pcm** - High quality, configurable sample rates (8kHz-48kHz)
- **audio/pcmu** - G.711 μ-law, optimized for telephony (8kHz)
- **audio/pcma** - G.711 A-law, international telephony (8kHz)

### Sample Rates (PCM only)

- 8000 Hz - Telephone quality
- 16000 Hz - Wideband (good for speech)
- 24000 Hz - High quality (default, recommended)
- 32000 Hz - Very high quality
- 44100 Hz - CD quality
- 48000 Hz - Professional/studio quality

## Usage

### Simple Voice Response (Text-to-Voice)

For simple use cases where you have text input and want a voice response:

```typescript
import { generateVoiceResponse, VoicePresets } from '../util/xaiVoice';

// Use a preset
const response = await generateVoiceResponse(
  'What is the X402 Protocol?',
  VoicePresets.x402Agent('oracle')
);

console.log(response.transcript); // Text response
console.log(response.citations); // Source URLs if search was used
```

### Agent Voice Service

Request voice responses from agents:

```typescript
import { api } from './convex/_generated/api';

const result = await ctx.runAction(api.x402World.agentOperations.requestService, {
  worldId,
  requesterId: 'ag:000001',
  providerId: 'ag:000002',
  serviceType: 'voice',
  payload: {
    text: 'Explain how transactions work in X402 World',
    preset: 'x402', // or 'business', 'support', 'interactive', etc.
    role: 'oracle', // For x402 preset
  },
  offeredPrice: 0.05,
});

console.log(result.transcript);
```

### Voice Operations

Use dedicated voice operations:

```typescript
// Generate agent voice response
const response = await ctx.runAction(api.x402World.voiceOperations.generateAgentVoiceResponse, {
  worldId,
  agentId: 'ag:000001',
  userMessage: 'What transactions are available?',
  voiceConfig: {
    voice: 'Rex',
    enableSearch: true,
    enableXSearch: true,
  },
});

// Voice transaction analysis
const analysis = await ctx.runAction(api.x402World.voiceOperations.voiceTransactionAnalysis, {
  worldId,
  agentId: 'ag:000001',
  transactionDescription: 'Transfer 100 USDC to agent ag:000002',
});

// Voice customer support
const support = await ctx.runAction(api.x402World.voiceOperations.voiceCustomerSupport, {
  userQuery: 'How do I create a transaction?',
  context: { userId: 'user123' },
});
```

### Create Ephemeral Token (for Client-Side)

For client-side WebSocket connections, create an ephemeral token:

```typescript
const tokenInfo = await ctx.runAction(api.x402World.voiceOperations.createVoiceToken, {
  expiresAfterSeconds: 300, // 5 minutes
});

// Use tokenInfo.token and tokenInfo.websocketUrl for WebSocket connection
```

## Voice Presets

Pre-configured voice settings for different use cases:

### Business
```typescript
VoicePresets.business()
// Voice: Rex, Professional tone, 24kHz
```

### Customer Support
```typescript
VoicePresets.support()
// Voice: Ara, Friendly tone, 16kHz
```

### Interactive
```typescript
VoicePresets.interactive()
// Voice: Eve, Energetic tone, 24kHz
```

### Instructional
```typescript
VoicePresets.instructional()
// Voice: Leo, Authoritative tone, 24kHz
```

### Telephony
```typescript
VoicePresets.telephony()
// Voice: Sal, PCMU format, 8kHz (optimized for phone calls)
```

### X402 Agent
```typescript
VoicePresets.x402Agent('oracle')
// Voice: Ara, X402-specific instructions, includes search
```

## WebSocket Integration

For full real-time voice streaming, you'll need a WebSocket server. Here's the basic flow:

### 1. Connect to WebSocket

```javascript
import WebSocket from 'ws';

const ws = new WebSocket('wss://api.x.ai/v1/realtime', {
  headers: {
    Authorization: `Bearer ${process.env.XAI_API_KEY}`,
    'Content-Type': 'application/json',
  },
});
```

### 2. Configure Session

```javascript
import { createSessionConfig, VoicePresets } from '../util/xaiVoice';

const config = VoicePresets.x402Agent('oracle');
const sessionMsg = createSessionConfig(config);
ws.send(JSON.stringify(sessionMsg));
```

### 3. Send Messages

```javascript
import { createTextMessage, createAudioMessage, commitAudioBuffer } from '../util/xaiVoice';

// Text message
const textMsg = createTextMessage('Hello, how can I help?');
ws.send(JSON.stringify(textMsg));

// Audio message (base64-encoded PCM16)
const audioMsg = createAudioMessage(audioBase64);
ws.send(JSON.stringify(audioMsg));

// Commit audio buffer
const commitMsg = commitAudioBuffer();
ws.send(JSON.stringify(commitMsg));
```

### 4. Handle Responses

```javascript
ws.on('message', (message) => {
  const event = JSON.parse(message);
  
  switch (event.type) {
    case 'conversation.created':
      console.log('Conversation started');
      break;
      
    case 'response.output_audio_transcript.delta':
      console.log('Transcript:', event.delta);
      break;
      
    case 'response.output_audio.delta':
      // Decode base64 audio and play
      const audioData = Buffer.from(event.delta, 'base64');
      // Play audio...
      break;
      
    case 'response.done':
      console.log('Response complete');
      break;
  }
});
```

## Agent Capabilities

Agents with voice capabilities can:
- Respond to voice queries
- Use search tools during voice conversations
- Provide voice-based transaction analysis
- Offer voice customer support
- Process voice-based signals

### Voice-Enabled Agents

| Role | Voice Capability |
|------|------------------|
| **Oracle** | ✅ Full voice + search |
| **Mixer** | ✅ Voice responses |
| **Watcher** | ✅ Voice + search |
| **Recursion** | ✅ Full voice + search |
| **Sentinel** | ✅ Voice responses |
| **Node** | ✅ Basic voice |

## Use Cases

### 1. Voice Transaction Assistant
```typescript
// User asks: "Transfer 50 USDC to Alice"
const response = await voiceTransactionAnalysis({
  worldId,
  agentId: 'ag:000001',
  transactionDescription: 'Transfer 50 USDC to Alice',
});
// Returns voice-friendly analysis
```

### 2. Voice Signal Processing
```typescript
// User asks: "What's the latest trading signal?"
const response = await voiceSignalProcessing({
  worldId,
  agentId: 'ag:000003',
  signalDescription: 'Latest Solana price signal',
});
// Returns voice-friendly signal analysis
```

### 3. Voice Customer Support
```typescript
// User asks: "How do I create a transaction?"
const response = await voiceCustomerSupport({
  userQuery: 'How do I create a transaction?',
  context: { userId: 'user123', experience: 'beginner' },
});
// Returns helpful voice response
```

## Integration with Tools

Voice conversations can use:
- **Web Search** - Real-time internet search
- **X Search** - Search X posts and trends
- **Collections** - RAG over your documents
- **X402 World Tools** - Protocol-specific operations (transactions, balances, signals, etc.)
- **Custom Functions** - Your own tools

### X402 World Tools

X402 World provides built-in tools for voice conversations:

```typescript
import { getX402VoiceTools } from '../util/x402VoiceTools';

const config = {
  voice: 'Ara',
  instructions: 'You are a helpful X402 World agent.',
  tools: getX402VoiceTools(), // Enable X402 World tools
  search: {
    web: true,
    x: true,
  },
};
```

**Available X402 World Tools:**
- `create_transaction` - Create transactions via voice
- `check_balance` - Check agent balances
- `get_agent_info` - Get agent information
- `find_service_providers` - Find service providers
- `broadcast_signal` - Broadcast trading signals
- `analyze_transaction` - Analyze transaction risks
- `get_market_summary` - Get market conditions

**Example Voice Interactions:**
- "Transfer 100 USDC to agent ag:000002" → Calls `create_transaction`
- "What's my balance?" → Calls `check_balance`
- "Find me an analysis service" → Calls `find_service_providers`
- "What's the market sentiment?" → Calls `get_market_summary` + web search

See `XAI_VOICE_TOOLS.md` for complete tool documentation.

## Multilingual Support

The Voice Agent API automatically detects input language and responds in the same language. Supports 100+ languages including:

English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Chinese (Mandarin), Japanese, Korean, Arabic, Hindi, Turkish, Polish, Swedish, Danish, Norwegian, Finnish, Czech, and many more.

## Notes

- **Low Latency**: Optimized for real-time conversations
- **Enterprise Ready**: Suitable for regulated industries
- **Telephony Compatible**: Works with Twilio, Vonage, and SIP providers
- **Tool Calling**: Can execute tools during voice conversations
- **Multilingual**: Automatic language detection and response
- **Audio Formats**: Multiple formats for different use cases

## Next Steps

1. Set your `XAI_API_KEY`
2. Use voice operations for simple text-to-voice
3. Set up WebSocket server for full real-time streaming
4. Integrate with telephony platforms (Twilio, etc.)
5. Add custom tools for your use cases

For full WebSocket examples, see the xAI documentation or create a dedicated WebSocket server in your application.

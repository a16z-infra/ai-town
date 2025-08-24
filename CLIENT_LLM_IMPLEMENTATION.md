# Client-Side LLM Implementation with Transformers.js

This implementation shifts character inference from server-side to client-side using Hugging Face Transformers.js.

## Architecture Overview

### Before (Server-Side LLM)
```
Agent needs text → Server LLM API call → Generated text → Send message
```

### After (Client-Side LLM) 
```
Agent needs text → Store request in DB → Client picks up → Browser generates text → Send message
```

## Key Components

### 1. Client-Side LLM Service (`src/lib/clientLLM.ts`)
- Uses `@xenova/transformers` with DistilGPT-2 model
- Runs entirely in the browser
- Handles text generation for conversations

### 2. Conversation Functions (`src/lib/clientConversation.ts`)
- `generateStartConversationMessage()` - Character introductions
- `generateContinueConversationMessage()` - Ongoing conversations  
- `generateLeaveConversationMessage()` - Polite conversation endings

### 3. Request Queue System
- `convex/clientLLMRequests.ts` - Database operations for request queue
- `convex/aiTown/clientAgentOperations.ts` - New agent operations
- `clientLLMRequests` table in schema for request persistence

### 4. Processing Hook (`src/hooks/useClientLLM.tsx`)
- `useClientLLMProcessor()` - React hook for processing requests
- `ClientLLMProcessor` - Background component for LLM processing
- Automatic request polling and processing

## Configuration

### Model Selection
Currently using `Xenova/distilgpt2` for:
- Small size (~82MB download)
- Fast inference in browser
- Good conversational abilities

Alternative models:
- `Xenova/gpt2` (larger, better quality)
- `microsoft/DialoGPT-small` (specialized for conversations)

### Performance Optimization
- Browser-based inference (no server calls)
- WebGL acceleration when available
- Request batching to avoid overwhelming browser
- Automatic cleanup of processed requests

## Usage

The system automatically processes agent conversation requests:

1. Agent triggers conversation (start/continue/leave)
2. Request stored in `clientLLMRequests` table  
3. `ClientLLMProcessor` picks up pending requests
4. Browser generates text using Transformers.js
5. Generated text sent back to continue conversation flow

## Benefits

- **Privacy**: All inference happens on user's device
- **Offline Capability**: Works without internet connection
- **No Server Costs**: Eliminates LLM API expenses
- **Reduced Latency**: No network round-trips for inference
- **Scalability**: Distributes compute to client devices

## Limitations

- **Model Size**: Limited to smaller models that fit in browser memory
- **Performance**: Slower than server-grade GPUs
- **Device Requirements**: Requires modern browser with sufficient memory
- **Initial Load**: Model download on first use

## Development Status

- ✅ Core infrastructure implemented
- ✅ DistilGPT-2 model integration
- ✅ Request queue system
- ✅ Automatic processing pipeline
- 🔄 Needs testing with live conversations
- 🔄 Performance optimization needed
- 🔄 UI loading states to be improved

## Testing

To test the client-side LLM:

```bash
# Build and run the application
npm run build
npm run dev

# The ClientLLMProcessor will show status in development mode
# Check browser console for LLM initialization logs
```

## Future Improvements

1. **Model Optimization**: Explore quantized models for better performance
2. **Progressive Loading**: Stream model weights for faster startup
3. **Caching**: Cache generated responses to avoid regeneration
4. **Fallback System**: Server-side fallback when client-side fails
5. **Memory Management**: Better handling of model memory usage
// ═══════════════════════════════════════════════════════════════════════════════
// XAI VOICE AGENT API INTEGRATION
// Real-time voice interactions with Grok via WebSocket
// ═══════════════════════════════════════════════════════════════════════════════

export type VoiceType = 'Ara' | 'Rex' | 'Sal' | 'Eve' | 'Leo';
export type AudioFormat = 'audio/pcm' | 'audio/pcmu' | 'audio/pcma';
export type SampleRate = 8000 | 16000 | 21050 | 24000 | 32000 | 44100 | 48000;
export type TurnDetection = 'server_vad' | null;

export interface VoiceSessionConfig {
  instructions?: string;
  voice?: VoiceType;
  turnDetection?: TurnDetection;
  audio?: {
    input?: {
      format?: {
        type?: AudioFormat;
        rate?: SampleRate;
      };
    };
    output?: {
      format?: {
        type?: AudioFormat;
        rate?: SampleRate;
      };
    };
  };
  tools?: any[]; // Tool definitions for function calling
  search?: {
    web?: boolean;
    x?: boolean;
    collections?: string[]; // Collection IDs for RAG
  };
}

export interface VoiceMessage {
  type: string;
  [key: string]: any;
}

export interface VoiceResponse {
  transcript?: string;
  audioBase64?: string;
  toolCalls?: Array<{
    name: string;
    arguments: any;
    id?: string;
  }>;
  toolResults?: Array<{
    toolCallId?: string;
    name: string;
    result: any;
    voiceResponse?: string;
  }>;
  citations?: string[];
  done: boolean;
}

/**
 * Create an ephemeral token for client-side authentication
 * This should be called from a secure server endpoint
 */
export async function createEphemeralToken(expiresAfterSeconds: number = 300): Promise<string> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not set. Run: npx convex env set XAI_API_KEY "your-key"');
  }

  try {
    const response = await fetch('https://api.x.ai/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expires_after: { seconds: expiresAfterSeconds },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create ephemeral token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.client_secret.value;
  } catch (error: any) {
    throw new Error(`Ephemeral token creation failed: ${error.message}`);
  }
}

/**
 * Generate voice response from text input
 * This is a simplified version that uses the chat API with voice instructions
 * For full WebSocket voice streaming, use a dedicated WebSocket server
 */
export async function generateVoiceResponse(
  text: string,
  config: VoiceSessionConfig = {}
): Promise<VoiceResponse> {
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI_API_KEY not set. Run: npx convex env set XAI_API_KEY "your-key"');
  }

  // Build tools array if search is enabled
  const tools: any[] = [];
  if (config.tools) {
    tools.push(...config.tools);
  }
  if (config.search?.web) {
    tools.push({ type: 'web_search' });
  }
  if (config.search?.x) {
    tools.push({ type: 'x_search' });
  }

  const requestBody: any = {
    model: 'grok-4-1-fast',
    messages: [
      {
        role: 'system',
        content: config.instructions || 'You are a helpful voice assistant. Respond naturally and conversationally.',
      },
      {
        role: 'user',
        content: text,
      },
    ],
  };

  if (tools.length > 0) {
    requestBody.tools = tools;
  }

  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`xAI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const message = data.choices?.[0]?.message;
    if (!message) {
      throw new Error('No response from xAI');
    }

    const transcript = message.content || '';
    
    // Extract tool calls if present
    const toolCalls: Array<{ name: string; arguments: any }> = [];
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        toolCalls.push({
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments || '{}'),
        });
      }
    }

    // Extract citations
    const citations: string[] = [];
    if (data.citations) {
      for (const citation of data.citations) {
        if (citation.url) {
          citations.push(citation.url);
        }
      }
    }

    return {
      transcript,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      citations: citations.length > 0 ? citations : undefined,
      done: true,
    };
  } catch (error: any) {
    throw new Error(`Voice response generation failed: ${error.message}`);
  }
}

/**
 * Voice session configuration helper
 * Returns the session.update message format
 */
export function createSessionConfig(config: VoiceSessionConfig): VoiceMessage {
  return {
    type: 'session.update',
    session: {
      instructions: config.instructions || 'You are a helpful assistant.',
      voice: config.voice || 'Ara',
      turn_detection: config.turnDetection !== undefined 
        ? (config.turnDetection ? { type: 'server_vad' } : null)
        : { type: 'server_vad' },
      audio: {
        input: {
          format: {
            type: config.audio?.input?.format?.type || 'audio/pcm',
            ...(config.audio?.input?.format?.rate && { rate: config.audio.input.format.rate }),
          },
        },
        output: {
          format: {
            type: config.audio?.output?.format?.type || 'audio/pcm',
            ...(config.audio?.output?.format?.rate && { rate: config.audio.output.format.rate }),
          },
        },
      },
      ...(config.search && {
        search: {
          ...(config.search.web !== undefined && { web: config.search.web }),
          ...(config.search.x !== undefined && { x: config.search.x }),
          ...(config.search.collections && { collections: config.search.collections }),
        },
      }),
    },
  };
}

/**
 * Create a text message for voice conversation
 */
export function createTextMessage(text: string): VoiceMessage {
  return {
    type: 'conversation.item.create',
    item: {
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text }],
    },
  };
}

/**
 * Create an audio buffer append message
 */
export function createAudioMessage(audioBase64: string): VoiceMessage {
  return {
    type: 'input_audio_buffer.append',
    audio: audioBase64,
  };
}

/**
 * Commit audio buffer to create a message
 */
export function commitAudioBuffer(): VoiceMessage {
  return {
    type: 'conversation.item.commit',
  };
}

/**
 * Request a response (for client-side VAD)
 */
export function createResponseRequest(): VoiceMessage {
  return {
    type: 'response.create',
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// VOICE CONFIGURATION PRESETS
// Pre-configured voice settings for different use cases
// ═══════════════════════════════════════════════════════════════════════════════

export const VoicePresets = {
  // Professional business voice
  business: (): VoiceSessionConfig => ({
    voice: 'Rex',
    instructions: 'You are a professional business assistant. Speak clearly and confidently.',
    audio: {
      input: { format: { type: 'audio/pcm', rate: 24000 } },
      output: { format: { type: 'audio/pcm', rate: 24000 } },
    },
  }),

  // Customer support voice
  support: (): VoiceSessionConfig => ({
    voice: 'Ara',
    instructions: 'You are a friendly customer support agent. Be helpful, patient, and empathetic.',
    audio: {
      input: { format: { type: 'audio/pcm', rate: 16000 } },
      output: { format: { type: 'audio/pcm', rate: 16000 } },
    },
  }),

  // Interactive/engaging voice
  interactive: (): VoiceSessionConfig => ({
    voice: 'Eve',
    instructions: 'You are an engaging and enthusiastic assistant. Keep conversations lively and interesting.',
    audio: {
      input: { format: { type: 'audio/pcm', rate: 24000 } },
      output: { format: { type: 'audio/pcm', rate: 24000 } },
    },
  }),

  // Authoritative/instructional voice
  instructional: (): VoiceSessionConfig => ({
    voice: 'Leo',
    instructions: 'You are an authoritative instructor. Provide clear, decisive guidance.',
    audio: {
      input: { format: { type: 'audio/pcm', rate: 24000 } },
      output: { format: { type: 'audio/pcm', rate: 24000 } },
    },
  }),

  // Telephony-optimized (lower bandwidth)
  telephony: (): VoiceSessionConfig => ({
    voice: 'Sal',
    instructions: 'You are a helpful assistant optimized for phone calls.',
    audio: {
      input: { format: { type: 'audio/pcmu', rate: 8000 } },
      output: { format: { type: 'audio/pcmu', rate: 8000 } },
    },
  }),

  // X402 World agent voice
  x402Agent: (role: string = 'node'): VoiceSessionConfig => ({
    voice: 'Ara',
    instructions: `You are an X402 World agent (${role}). You help users with transactions, signals, and protocol interactions. Be professional but friendly.`,
    audio: {
      input: { format: { type: 'audio/pcm', rate: 24000 } },
      output: { format: { type: 'audio/pcm', rate: 24000 } },
    },
    search: {
      web: true,
      x: true,
    },
  }),
};

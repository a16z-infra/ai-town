import { Ollama } from 'langchain/llms/ollama';
import { CreateChatCompletionRequest, retryWithBackoff, tryPullOllama } from './openai';
import { IterableReadableStream } from 'langchain/dist/util/stream';
import { LLM_CONFIG } from '../constants';

export async function ollamaFetchEmbedding(text: string) {
  const { result } = await retryWithBackoff(async () => {
    const resp = await fetch(process.env.OLLAMA_HOST + '/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: LLM_CONFIG.embeddingModel, prompt: text }),
    });
    if (resp.status === 404) {
      const error = await resp.text();
      await tryPullOllama(LLM_CONFIG.embeddingModel, error);
      throw new Error(`Failed to fetch embeddings: ${resp.status}`);
    }
    return (await resp.json()).embedding as number[];
  });
  return { embedding: result };
}

// Overload for non-streaming
export async function ollamaChatCompletion(
  body: Omit<CreateChatCompletionRequest, 'model'> & {
    model?: string;
  } & {
    stream?: false | null | undefined;
  },
): Promise<{ content: string; retries: number; ms: number }>;
// Overload for streaming
export async function ollamaChatCompletion(
  body: Omit<CreateChatCompletionRequest, 'model'> & {
    model?: string;
  } & {
    stream?: true;
  },
): Promise<{ content: OllamaCompletionContent; retries: number; ms: number }>;
export async function ollamaChatCompletion(
  body: Omit<CreateChatCompletionRequest, 'model'> & {
    model?: string;
  },
) {
  body.model = body.model ?? LLM_CONFIG.chatModel;
  const {
    result: content,
    retries,
    ms,
  } = await retryWithBackoff(async () => {
    console.log('#### Ollama api ####, using ', body.model);

    const stop = typeof body.stop === 'string' ? [body.stop] : body.stop;
    stop?.push('<|');
    const resp = await fetch(process.env.OLLAMA_HOST + '/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (resp.status === 404) {
      const error = await resp.text();
      await tryPullOllama(LLM_CONFIG.embeddingModel, error);
      throw new Error(`Failed to fetch embeddings: ${resp.status}`);
    }
    if (body.stream) {
      return new OllamaCompletionContent(resp.body!, stop ?? []);
    }
    const json = await resp.json();
    const content = json.message?.content;
    if (content === undefined) {
      throw new Error('Unexpected result from Ollama: ' + JSON.stringify(json));
    }
    console.log('#### ollama result = ');
    console.log(content);
    return content;
  });

  return {
    content,
    retries,
    ms,
  };
}

export class OllamaCompletionContent {
  private readonly body: IterableReadableStream<string>;
  private readonly stopWords: string[];

  constructor(body: IterableReadableStream<string>, stopWords: string[]) {
    this.body = body;
    this.stopWords = stopWords;
  }

  async *read() {
    for await (const data of this.splitStream(this.body)) {
      yield data;
    }
  }

  async readAll() {
    let allContent = '';
    for await (const chunk of this.read()) {
      allContent += chunk;
    }
    return allContent;
  }

  async *splitStream(stream: IterableReadableStream<string>) {
    const reader = stream.getReader();
    let lastFragment = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        const data = value;
        let startIdx = 0;
        while (true) {
          const endIdx = data.indexOf('\n\n', startIdx);
          if (endIdx === -1) {
            lastFragment += data.substring(startIdx);
            break;
          }
          yield lastFragment + data.substring(startIdx, endIdx);
          startIdx = endIdx + 2;
          lastFragment = '';
        }
      }
      if (lastFragment) {
        yield lastFragment;
      }
    } finally {
      reader.releaseLock();
    }
  }
}

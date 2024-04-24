import { Ollama } from 'langchain/llms/ollama';
import { CreateChatCompletionRequest, retryWithBackoff } from './openai';
import { IterableReadableStream } from 'langchain/dist/util/stream';
import { OllamaEmbedModel } from '../constants';

const ollamaModel = process.env.OLLAMA_MODEL || 'llama3';
export const UseOllama = process.env.OLLAMA_HOST !== undefined;

export async function ollamaFetchEmbedding(text: string) {
  const { result } = await retryWithBackoff(async () => {
    const resp = await fetch(process.env.OLLAMA_HOST + '/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: OllamaEmbedModel, prompt: text }),
    });
    if (resp.status === 404) {
      const error = await resp.text();
      if (error.includes('try pulling')) {
        console.error('Embedding model not found, pulling from Ollama');
        const pullResp = await fetch(process.env.OLLAMA_HOST + '/api/pull', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: OllamaEmbedModel }),
        });
        console.log('Pull response', await pullResp.text());
        throw { retry: true, error };
      }
      throw new Error(`Failed to fetch embeddings: ${resp.status}`);
    }
    return (await resp.json()).embedding as number[];
  });
  return { ollamaEmbedding: result };
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
  body.model = body.model ?? ollamaModel;
  const {
    result: content,
    retries,
    ms,
  } = await retryWithBackoff(async () => {
    console.log('#### Ollama api ####, using ', body.model);

    const stop = typeof body.stop === 'string' ? [body.stop] : body.stop;
    const ollama = new Ollama({
      model: body.model,
      baseUrl: process.env.OLLAMA_HOST,
      stop,
    });
    const prompt = body.messages.map((m) => m.content).join('\n');
    console.log('body.prompt', prompt);
    const stream = await ollama.stream(prompt, { stop });
    if (body.stream) {
      return new OllamaCompletionContent(stream, stop ?? []);
    }
    let ollamaResult = '';
    for await (const chunk of stream) {
      ollamaResult += chunk;
    }
    console.log('#### ollama result = ');
    console.log(ollamaResult);
    return ollamaResult;
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

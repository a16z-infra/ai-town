import { Ollama } from 'langchain/llms/ollama';
import {
  ChatCompletionContent,
  CreateChatCompletionRequest,
  LLMMessage,
  retryWithBackoff,
} from './openai';
import { IterableReadableStream } from 'langchain/dist/util/stream';

const ollamaModel = process.env.OLLAMA_MODEL || 'llama2';
export const UseOllama = process.env.OLLAMA_HOST !== undefined;

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
  body.model = body.model ?? 'llama2';
  const {
    result: content,
    retries,
    ms,
  } = await retryWithBackoff(async () => {
    console.log('#### Ollama api ####, using ', ollamaModel);

    const stop = typeof body.stop === 'string' ? [body.stop] : body.stop;
    const ollama = new Ollama({
      model: ollamaModel,
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

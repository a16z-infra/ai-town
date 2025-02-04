// That's right! No imports and no dependencies 🤯

export const LLM_CONFIG = {
  /* Ollama (local) config:
  // ollama: true,
  // url: 'http://127.0.0.1:11434',
  // chatModel: 'llama3' as const,
  // embeddingModel: 'mxbai-embed-large',
  // embeddingDimension: 1024,
  // stopWords: ['<|eot_id|>'],
  // apiKey: () => undefined,
  // embeddingModel: 'llama3',
  // embeddingDimension: 4096,

  /* Together.ai config:
  ollama: false,
  url: 'https://api.together.xyz',
  chatModel: 'meta-llama/Llama-3-8b-chat-hf',
  embeddingModel: 'togethercomputer/m2-bert-80M-8k-retrieval',
  embeddingDimension: 768,
  stopWords: ['<|eot_id|>'],
  apiKey: () => process.env.TOGETHER_API_KEY ?? process.env.LLM_API_KEY,
   */

  /* OpenAI config:*/
  
  ollama: false,
  url: 'https://api.openai.com',
  chatModel: 'gpt-4o-mini',
  embeddingModel: 'text-embedding-ada-002',
  embeddingDimension: 1536,
  stopWords: [],
  apiKey: () => process.env.OPENAI_API_KEY ?? process.env.LLM_API_KEY,
   
};

function apiUrl(path: string) {
  // OPENAI_API_BASE and OLLAMA_HOST are legacy
  const host =
    process.env.LLM_API_URL ??
    process.env.OLLAMA_HOST ??
    process.env.OPENAI_API_BASE ??
    LLM_CONFIG.url;
  if (host.endsWith('/') && path.startsWith('/')) {
    return host + path.slice(1);
  } else if (!host.endsWith('/') && !path.startsWith('/')) {
    return host + '/' + path;
  } else {
    return host + path;
  }
}

const AuthHeaders = (): Record<string, string> =>
  LLM_CONFIG.apiKey()
    ? {
        Authorization: 'Bearer ' + LLM_CONFIG.apiKey(),
      }
    : {};

// Overload for non-streaming
export async function chatCompletion(
  body: Omit<CreateChatCompletionRequest, 'model'> & {
    model?: CreateChatCompletionRequest['model'];
  } & {
    stream?: false | null | undefined;
  },
): Promise<{ content: string; retries: number; ms: number }>;
// Overload for streaming
export async function chatCompletion(
  body: Omit<CreateChatCompletionRequest, 'model'> & {
    model?: CreateChatCompletionRequest['model'];
  } & {
    stream?: true;
  },
): Promise<{ content: ChatCompletionContent; retries: number; ms: number }>;
export async function chatCompletion(
  body: Omit<CreateChatCompletionRequest, 'model'> & {
    model?: CreateChatCompletionRequest['model'];
  },
) {
  assertApiKey();
  // OLLAMA_MODEL is legacy
  body.model =
    body.model ?? process.env.LLM_MODEL ?? process.env.OLLAMA_MODEL ?? LLM_CONFIG.chatModel;
  const stopWords = body.stop ? (typeof body.stop === 'string' ? [body.stop] : body.stop) : [];
  if (LLM_CONFIG.stopWords) stopWords.push(...LLM_CONFIG.stopWords);
  console.log(body);
  const {
    result: content,
    retries,
    ms,
  } = await retryWithBackoff(async () => {
    const result = await fetch(apiUrl('/v1/chat/completions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...AuthHeaders(),
      },

      body: JSON.stringify(body),
    });
    if (!result.ok) {
      const error = await result.text();
      console.error({ error });
      if (result.status === 404 && LLM_CONFIG.ollama) {
        await tryPullOllama(body.model!, error);
      }
      throw {
        retry: result.status === 429 || result.status >= 500,
        error: new Error(`Chat completion failed with code ${result.status}: ${error}`),
      };
    }
    if (body.stream) {
      return new ChatCompletionContent(result.body!, stopWords);
    } else {
      const json = (await result.json()) as CreateChatCompletionResponse;
      const content = json.choices[0].message?.content;
      if (content === undefined) {
        throw new Error('Unexpected result from OpenAI: ' + JSON.stringify(json));
      }
      console.log(content);
      return content;
    }
  });

  return {
    content,
    retries,
    ms,
  };
}

export async function tryPullOllama(model: string, error: string) {
  if (error.includes('try pulling')) {
    console.error('Embedding model not found, pulling from Ollama');
    const pullResp = await fetch(apiUrl('/api/pull'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: model }),
    });
    console.log('Pull response', await pullResp.text());
    throw { retry: true, error: `Dynamically pulled model. Original error: ${error}` };
  }
}

export async function fetchEmbeddingBatch(texts: string[]) {
  if (LLM_CONFIG.ollama) {
    return {
      ollama: true as const,
      embeddings: await Promise.all(
        texts.map(async (t) => (await ollamaFetchEmbedding(t)).embedding),
      ),
    };
  }
  assertApiKey();
  const {
    result: json,
    retries,
    ms,
  } = await retryWithBackoff(async () => {
    const result = await fetch(apiUrl('/v1/embeddings'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...AuthHeaders(),
      },

      body: JSON.stringify({
        model: LLM_CONFIG.embeddingModel,
        input: texts.map((text) => text.replace(/\n/g, ' ')),
      }),
    });
    if (!result.ok) {
      throw {
        retry: result.status === 429 || result.status >= 500,
        error: new Error(`Embedding failed with code ${result.status}: ${await result.text()}`),
      };
    }
    return (await result.json()) as CreateEmbeddingResponse;
  });
  if (json.data.length !== texts.length) {
    console.error(json);
    throw new Error('Unexpected number of embeddings');
  }
  const allembeddings = json.data;
  allembeddings.sort((a, b) => a.index - b.index);
  return {
    ollama: false as const,
    embeddings: allembeddings.map(({ embedding }) => embedding),
    usage: json.usage?.total_tokens,
    retries,
    ms,
  };
}

export async function fetchEmbedding(text: string) {
  const { embeddings, ...stats } = await fetchEmbeddingBatch([text]);
  return { embedding: embeddings[0], ...stats };
}

export async function fetchModeration(content: string) {
  assertApiKey();
  const { result: flagged } = await retryWithBackoff(async () => {
    const result = await fetch(apiUrl('/v1/moderations'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...AuthHeaders(),
      },

      body: JSON.stringify({
        input: content,
      }),
    });
    if (!result.ok) {
      throw {
        retry: result.status === 429 || result.status >= 500,
        error: new Error(`Embedding failed with code ${result.status}: ${await result.text()}`),
      };
    }
    return (await result.json()) as { results: { flagged: boolean }[] };
  });
  return flagged;
}

export function assertApiKey() {
  if (!LLM_CONFIG.ollama && !LLM_CONFIG.apiKey()) {
    throw new Error(
      '\n  Missing LLM_API_KEY in environment variables.\n\n' +
        (LLM_CONFIG.ollama ? 'just' : 'npx') +
        " convex env set LLM_API_KEY 'your-key'",
    );
  }
}

// Retry after this much time, based on the retry number.
const RETRY_BACKOFF = [1000, 10_000, 20_000]; // In ms
const RETRY_JITTER = 100; // In ms
type RetryError = { retry: boolean; error: any };

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
): Promise<{ retries: number; result: T; ms: number }> {
  let i = 0;
  for (; i <= RETRY_BACKOFF.length; i++) {
    try {
      const start = Date.now();
      const result = await fn();
      const ms = Date.now() - start;
      return { result, retries: i, ms };
    } catch (e) {
      const retryError = e as RetryError;
      if (i < RETRY_BACKOFF.length) {
        if (retryError.retry) {
          console.log(
            `Attempt ${i + 1} failed, waiting ${RETRY_BACKOFF[i]}ms to retry...`,
            Date.now(),
          );
          await new Promise((resolve) =>
            setTimeout(resolve, RETRY_BACKOFF[i] + RETRY_JITTER * Math.random()),
          );
          continue;
        }
      }
      if (retryError.error) throw retryError.error;
      else throw e;
    }
  }
  throw new Error('Unreachable');
}

// Lifted from openai's package
export interface LLMMessage {
  /**
   * The contents of the message. `content` is required for all messages, and may be
   * null for assistant messages with function calls.
   */
  content: string | null;

  /**
   * The role of the messages author. One of `system`, `user`, `assistant`, or
   * `function`.
   */
  role: 'system' | 'user' | 'assistant' | 'function';

  /**
   * The name of the author of this message. `name` is required if role is
   * `function`, and it should be the name of the function whose response is in the
   * `content`. May contain a-z, A-Z, 0-9, and underscores, with a maximum length of
   * 64 characters.
   */
  name?: string;

  /**
   * The name and arguments of a function that should be called, as generated by the model.
   */
  function_call?: {
    // The name of the function to call.
    name: string;
    /**
     * The arguments to call the function with, as generated by the model in
     * JSON format. Note that the model does not always generate valid JSON,
     * and may hallucinate parameters not defined by your function schema.
     * Validate the arguments in your code before calling your function.
     */
    arguments: string;
  };
}

// Non-streaming chat completion response
interface CreateChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index?: number;
    message?: {
      role: 'system' | 'user' | 'assistant';
      content: string;
    };
    finish_reason?: string;
  }[];
  usage?: {
    completion_tokens: number;

    prompt_tokens: number;

    total_tokens: number;
  };
}

interface CreateEmbeddingResponse {
  data: {
    index: number;
    object: string;
    embedding: number[];
  }[];
  model: string;
  object: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export interface CreateChatCompletionRequest {
  /**
   * ID of the model to use.
   * @type {string}
   * @memberof CreateChatCompletionRequest
   */
  model: string;
  // | 'gpt-4'
  // | 'gpt-4-0613'
  // | 'gpt-4-32k'
  // | 'gpt-4-32k-0613'
  // | 'gpt-3.5-turbo'; // <- our default
  /**
   * The messages to generate chat completions for, in the chat format:
   * https://platform.openai.com/docs/guides/chat/introduction
   * @type {Array<ChatCompletionRequestMessage>}
   * @memberof CreateChatCompletionRequest
   */
  messages: LLMMessage[];
  /**
   * What sampling temperature to use, between 0 and 2. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic.  We generally recommend altering this or `top_p` but not both.
   * @type {number}
   * @memberof CreateChatCompletionRequest
   */
  temperature?: number | null;
  /**
   * An alternative to sampling with temperature, called nucleus sampling, where the model considers the results of the tokens with top_p probability mass. So 0.1 means only the tokens comprising the top 10% probability mass are considered.  We generally recommend altering this or `temperature` but not both.
   * @type {number}
   * @memberof CreateChatCompletionRequest
   */
  top_p?: number | null;
  /**
   * How many chat completion choices to generate for each input message.
   * @type {number}
   * @memberof CreateChatCompletionRequest
   */
  n?: number | null;
  /**
   * If set, partial message deltas will be sent, like in ChatGPT. Tokens will be sent as data-only [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format) as they become available, with the stream terminated by a `data: [DONE]` message.
   * @type {boolean}
   * @memberof CreateChatCompletionRequest
   */
  stream?: boolean | null;
  /**
   *
   * @type {CreateChatCompletionRequestStop}
   * @memberof CreateChatCompletionRequest
   */
  stop?: Array<string> | string;
  /**
   * The maximum number of tokens allowed for the generated answer. By default,
   * the number of tokens the model can return will be (4096 - prompt tokens).
   * @type {number}
   * @memberof CreateChatCompletionRequest
   */
  max_tokens?: number;
  /**
   * Number between -2.0 and 2.0. Positive values penalize new tokens based on
   * whether they appear in the text so far, increasing the model\'s likelihood
   * to talk about new topics. See more information about frequency and
   * presence penalties:
   * https://platform.openai.com/docs/api-reference/parameter-details
   * @type {number}
   * @memberof CreateChatCompletionRequest
   */
  presence_penalty?: number | null;
  /**
   * Number between -2.0 and 2.0. Positive values penalize new tokens based on
   * their existing frequency in the text so far, decreasing the model\'s
   * likelihood to repeat the same line verbatim. See more information about
   * presence penalties:
   * https://platform.openai.com/docs/api-reference/parameter-details
   * @type {number}
   * @memberof CreateChatCompletionRequest
   */
  frequency_penalty?: number | null;
  /**
   * Modify the likelihood of specified tokens appearing in the completion.
   * Accepts a json object that maps tokens (specified by their token ID in the
   * tokenizer) to an associated bias value from -100 to 100. Mathematically,
   * the bias is added to the logits generated by the model prior to sampling.
   * The exact effect will vary per model, but values between -1 and 1 should
   * decrease or increase likelihood of selection; values like -100 or 100
   * should result in a ban or exclusive selection of the relevant token.
   * @type {object}
   * @memberof CreateChatCompletionRequest
   */
  logit_bias?: object | null;
  /**
   * A unique identifier representing your end-user, which can help OpenAI to
   * monitor and detect abuse. Learn more:
   * https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids
   * @type {string}
   * @memberof CreateChatCompletionRequest
   */
  user?: string;
  tools?: {
    // The type of the tool. Currently, only function is supported.
    type: 'function';
    function: {
      /**
       * The name of the function to be called. Must be a-z, A-Z, 0-9, or
       * contain underscores and dashes, with a maximum length of 64.
       */
      name: string;
      /**
       * A description of what the function does, used by the model to choose
       * when and how to call the function.
       */
      description?: string;
      /**
       * The parameters the functions accepts, described as a JSON Schema
       * object. See the guide[1] for examples, and the JSON Schema reference[2]
       * for documentation about the format.
       * [1]: https://platform.openai.com/docs/guides/gpt/function-calling
       * [2]: https://json-schema.org/understanding-json-schema/
       * To describe a function that accepts no parameters, provide the value
       * {"type": "object", "properties": {}}.
       */
      parameters: object;
    };
  }[];
  /**
   * Controls which (if any) function is called by the model. `none` means the
   * model will not call a function and instead generates a message.
   * `auto` means the model can pick between generating a message or calling a
   * function. Specifying a particular function via
   * {"type: "function", "function": {"name": "my_function"}} forces the model
   * to call that function.
   *
   * `none` is the default when no functions are present.
   * `auto` is the default if functions are present.
   */
  tool_choice?:
    | 'none' // none means the model will not call a function and instead generates a message.
    | 'auto' // auto means the model can pick between generating a message or calling a function.
    // Specifies a tool the model should use. Use to force the model to call
    // a specific function.
    | {
        // The type of the tool. Currently, only function is supported.
        type: 'function';
        function: { name: string };
      };
  // Replaced by "tools"
  // functions?: {
  //   /**
  //    * The name of the function to be called. Must be a-z, A-Z, 0-9, or
  //    * contain underscores and dashes, with a maximum length of 64.
  //    */
  //   name: string;
  //   /**
  //    * A description of what the function does, used by the model to choose
  //    * when and how to call the function.
  //    */
  //   description?: string;
  //   /**
  //    * The parameters the functions accepts, described as a JSON Schema
  //    * object. See the guide[1] for examples, and the JSON Schema reference[2]
  //    * for documentation about the format.
  //    * [1]: https://platform.openai.com/docs/guides/gpt/function-calling
  //    * [2]: https://json-schema.org/understanding-json-schema/
  //    * To describe a function that accepts no parameters, provide the value
  //    * {"type": "object", "properties": {}}.
  //    */
  //   parameters: object;
  // }[];
  // /**
  //  * Controls how the model responds to function calls. "none" means the model
  //  * does not call a function, and responds to the end-user. "auto" means the
  //  * model can pick between an end-user or calling a function. Specifying a
  //  * particular function via {"name":\ "my_function"} forces the model to call
  //  *  that function.
  //  * - "none" is the default when no functions are present.
  //  * - "auto" is the default if functions are present.
  //  */
  // function_call?: 'none' | 'auto' | { name: string };
  /**
   * An object specifying the format that the model must output.
   *
   * Setting to { "type": "json_object" } enables JSON mode, which guarantees
   * the message the model generates is valid JSON.
   * *Important*: when using JSON mode, you must also instruct the model to
   * produce JSON yourself via a system or user message. Without this, the model
   * may generate an unending stream of whitespace until the generation reaches
   * the token limit, resulting in a long-running and seemingly "stuck" request.
   * Also note that the message content may be partially cut off if
   * finish_reason="length", which indicates the generation exceeded max_tokens
   * or the conversation exceeded the max context length.
   */
  response_format?: { type: 'text' | 'json_object' };
}

// Checks whether a suffix of s1 is a prefix of s2. For example,
// ('Hello', 'Kira:') -> false
// ('Hello Kira', 'Kira:') -> true
const suffixOverlapsPrefix = (s1: string, s2: string) => {
  for (let i = 1; i <= Math.min(s1.length, s2.length); i++) {
    const suffix = s1.substring(s1.length - i);
    const prefix = s2.substring(0, i);
    if (suffix === prefix) {
      return true;
    }
  }
  return false;
};

export class ChatCompletionContent {
  private readonly body: ReadableStream<Uint8Array>;
  private readonly stopWords: string[];

  constructor(body: ReadableStream<Uint8Array>, stopWords: string[]) {
    this.body = body;
    this.stopWords = stopWords;
  }

  async *readInner() {
    for await (const data of this.splitStream(this.body)) {
      if (data.startsWith('data: ')) {
        try {
          const json = JSON.parse(data.substring('data: '.length)) as {
            choices: { delta: { content?: string } }[];
          };
          if (json.choices[0].delta.content) {
            yield json.choices[0].delta.content;
          }
        } catch (e) {
          // e.g. the last chunk is [DONE] which is not valid JSON.
        }
      }
    }
  }

  // stop words in OpenAI api don't always work.
  // So we have to truncate on our side.
  async *read() {
    let lastFragment = '';
    for await (const data of this.readInner()) {
      lastFragment += data;
      let hasOverlap = false;
      for (const stopWord of this.stopWords) {
        const idx = lastFragment.indexOf(stopWord);
        if (idx >= 0) {
          yield lastFragment.substring(0, idx);
          return;
        }
        if (suffixOverlapsPrefix(lastFragment, stopWord)) {
          hasOverlap = true;
        }
      }
      if (hasOverlap) continue;
      yield lastFragment;
      lastFragment = '';
    }
    yield lastFragment;
  }

  async readAll() {
    let allContent = '';
    for await (const chunk of this.read()) {
      allContent += chunk;
    }
    return allContent;
  }

  async *splitStream(stream: ReadableStream<Uint8Array>) {
    const reader = stream.getReader();
    let lastFragment = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          // Flush the last fragment now that we're done
          if (lastFragment !== '') {
            yield lastFragment;
          }
          break;
        }
        const data = new TextDecoder().decode(value);
        lastFragment += data;
        const parts = lastFragment.split('\n\n');
        // Yield all except for the last part
        for (let i = 0; i < parts.length - 1; i += 1) {
          yield parts[i];
        }
        // Save the last part as the new last fragment
        lastFragment = parts[parts.length - 1];
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export async function ollamaFetchEmbedding(text: string) {
  const { result } = await retryWithBackoff(async () => {
    const resp = await fetch(apiUrl('/api/embeddings'), {
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
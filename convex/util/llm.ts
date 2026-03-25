// That's right! No imports and no dependencies 🤯

const OPENAI_EMBEDDING_DIMENSION = 1536;
const TOGETHER_EMBEDDING_DIMENSION = 768;
const OLLAMA_EMBEDDING_DIMENSION = 1024;

export const EMBEDDING_DIMENSION: number = OPENAI_EMBEDDING_DIMENSION;

export function detectMismatchedLLMProvider() {
  switch (EMBEDDING_DIMENSION) {
    case OPENAI_EMBEDDING_DIMENSION:
      if (!process.env.OPENAI_API_KEY) {
        throw new Error(
          "Are you trying to use OpenAI? If so, run: npx convex env set OPENAI_API_KEY 'your-key'",
        );
      }
      break;
    case TOGETHER_EMBEDDING_DIMENSION:
      if (!process.env.TOGETHER_API_KEY) {
        throw new Error(
          "Are you trying to use Together.ai? If so, run: npx convex env set TOGETHER_API_KEY 'your-key'",
        );
      }
      break;
    case OLLAMA_EMBEDDING_DIMENSION:
      break;
    default:
      if (!process.env.LLM_API_URL) {
        throw new Error(
          "Are you trying to use a custom cloud-hosted LLM? If so, run: npx convex env set LLM_API_URL 'your-url'",
        );
      }
      break;
  }
}

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'gemini' | 'together' | 'ollama' | 'custom';
  url: string; // Should not have a trailing slash
  chatModel: string;
  embeddingModel: string;
  stopWords: string[];
  apiKey: string | undefined;
}

// Embedding always uses OpenAI (most reliable, already configured).
// Chat can use Anthropic, Gemini, or OpenAI — controlled by LLM_PROVIDER env var.
function getEmbeddingConfig(): { url: string; model: string; apiKey: string | undefined } {
  return {
    url: 'https://api.openai.com',
    model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-ada-002',
    apiKey: process.env.OPENAI_API_KEY,
  };
}

export function getLLMConfig(): LLMConfig {
  const provider = process.env.LLM_PROVIDER;

  // Anthropic / Claude
  if (provider === 'anthropic' || (!provider && process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY)) {
    return {
      provider: 'anthropic',
      url: 'https://api.anthropic.com',
      chatModel: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022',
      embeddingModel: getEmbeddingConfig().model,
      stopWords: [],
      apiKey: process.env.ANTHROPIC_API_KEY,
    };
  }

  // DeepSeek (OpenAI-compatible)
  if (provider === 'deepseek' || (!provider && process.env.DEEPSEEK_API_KEY && !process.env.OPENAI_API_KEY)) {
    return {
      provider: 'openai', // OpenAI-compatible format
      url: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
      chatModel: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      embeddingModel: getEmbeddingConfig().model,
      stopWords: [],
      apiKey: process.env.DEEPSEEK_API_KEY,
    };
  }

  // Gemini (OpenAI-compatible endpoint)
  if (provider === 'gemini' || (!provider && process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY)) {
    return {
      provider: 'gemini',
      url: process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai',
      chatModel: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
      embeddingModel: getEmbeddingConfig().model,
      stopWords: [],
      apiKey: process.env.GEMINI_API_KEY,
    };
  }

  // OpenAI (default)
  if (provider ? provider === 'openai' : process.env.OPENAI_API_KEY) {
    if (EMBEDDING_DIMENSION !== OPENAI_EMBEDDING_DIMENSION) {
      throw new Error('EMBEDDING_DIMENSION must be 1536 for OpenAI');
    }
    return {
      provider: 'openai',
      url: 'https://api.openai.com',
      chatModel: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
      embeddingModel: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-ada-002',
      stopWords: [],
      apiKey: process.env.OPENAI_API_KEY,
    };
  }
  if (process.env.TOGETHER_API_KEY) {
    if (EMBEDDING_DIMENSION !== TOGETHER_EMBEDDING_DIMENSION) {
      throw new Error('EMBEDDING_DIMENSION must be 768 for Together.ai');
    }
    return {
      provider: 'together',
      url: 'https://api.together.xyz',
      chatModel: process.env.TOGETHER_CHAT_MODEL ?? 'meta-llama/Llama-3-8b-chat-hf',
      embeddingModel:
        process.env.TOGETHER_EMBEDDING_MODEL ?? 'togethercomputer/m2-bert-80M-8k-retrieval',
      stopWords: ['<|eot_id|>'],
      apiKey: process.env.TOGETHER_API_KEY,
    };
  }
  if (process.env.LLM_API_URL) {
    const apiKey = process.env.LLM_API_KEY;
    const url = process.env.LLM_API_URL;
    const chatModel = process.env.LLM_MODEL;
    if (!chatModel) throw new Error('LLM_MODEL is required');
    const embeddingModel = process.env.LLM_EMBEDDING_MODEL;
    if (!embeddingModel) throw new Error('LLM_EMBEDDING_MODEL is required');
    return {
      provider: 'custom',
      url,
      chatModel,
      embeddingModel,
      stopWords: [],
      apiKey,
    };
  }
  // Assume Ollama
  if (EMBEDDING_DIMENSION !== OLLAMA_EMBEDDING_DIMENSION) {
    detectMismatchedLLMProvider();
    throw new Error(
      `Unknown EMBEDDING_DIMENSION ${EMBEDDING_DIMENSION} found` +
        `. See convex/util/llm.ts for details.`,
    );
  }
  return {
    provider: 'ollama',
    url: process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434',
    chatModel: process.env.OLLAMA_MODEL ?? 'llama3',
    embeddingModel: process.env.OLLAMA_EMBEDDING_MODEL ?? 'mxbai-embed-large',
    stopWords: ['<|eot_id|>'],
    apiKey: undefined,
  };
}

// Build ordered fallback chain: OpenAI → Claude → Gemini → DeepSeek
// Only includes providers that have API keys configured.
interface FallbackProvider {
  name: string;
  provider: LLMConfig['provider'];
  url: string;
  model: string;
  apiKey: string;
}

function getFallbackChain(): FallbackProvider[] {
  const chain: FallbackProvider[] = [];
  if (process.env.OPENAI_API_KEY) {
    chain.push({
      name: 'OpenAI',
      provider: 'openai',
      url: 'https://api.openai.com',
      model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini',
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  if (process.env.ANTHROPIC_API_KEY) {
    chain.push({
      name: 'Claude',
      provider: 'anthropic',
      url: 'https://api.anthropic.com',
      model: process.env.ANTHROPIC_MODEL ?? 'claude-3-5-sonnet-20241022',
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  if (process.env.GEMINI_API_KEY) {
    chain.push({
      name: 'Gemini',
      provider: 'gemini',
      url: process.env.GEMINI_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash',
      apiKey: process.env.GEMINI_API_KEY,
    });
  }
  if (process.env.DEEPSEEK_API_KEY) {
    chain.push({
      name: 'DeepSeek',
      provider: 'openai',
      url: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-chat',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }
  return chain;
}

const AuthHeaders = (): Record<string, string> => {
  const config = getLLMConfig();
  if (!config.apiKey) return {};
  if (config.provider === 'anthropic') {
    return {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }
  return { Authorization: 'Bearer ' + config.apiKey };
};

// Embedding always uses OpenAI, so we need separate auth headers for it.
const EmbeddingAuthHeaders = (): Record<string, string> => {
  const embeddingConfig = getEmbeddingConfig();
  if (!embeddingConfig.apiKey) return {};
  return { Authorization: 'Bearer ' + embeddingConfig.apiKey };
};

// Anthropic has a different API format. Convert and call.
async function anthropicChatCompletion(
  config: LLMConfig,
  messages: LLMMessage[],
  maxTokens: number,
  stopWords: string[],
): Promise<string> {
  // Split system message from the rest
  const systemMessages = messages.filter((m) => m.role === 'system');
  const nonSystemMessages = messages.filter((m) => m.role !== 'system');
  const systemPrompt = systemMessages.map((m) => m.content ?? '').join('\n');

  // Anthropic requires alternating user/assistant roles, starting with user
  const anthropicMessages = nonSystemMessages.map((m) => ({
    role: m.role === 'function' ? ('user' as const) : (m.role as 'user' | 'assistant'),
    content: m.content ?? '',
  }));

  // If no non-system messages or first message is assistant, prepend a user message
  if (anthropicMessages.length === 0 || anthropicMessages[0].role !== 'user') {
    anthropicMessages.unshift({ role: 'user', content: systemPrompt ? 'Please respond.' : 'Hello.' });
  }

  const anthropicBody = {
    model: config.chatModel,
    max_tokens: maxTokens || 300,
    system: systemPrompt || undefined,
    messages: anthropicMessages,
    stop_sequences: stopWords.length > 0 ? stopWords.slice(0, 4) : undefined,
  };

  const result = await fetch(config.url + '/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...AuthHeaders(),
    },
    body: JSON.stringify(anthropicBody),
  });

  if (!result.ok) {
    const error = await result.text();
    console.error({ error });
    throw {
      retry: result.status === 429 || result.status >= 500,
      error: new Error(`Anthropic chat failed with code ${result.status}: ${error}`),
    };
  }

  const json = (await result.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  const text = json.content?.[0]?.text;
  if (!text) {
    throw new Error('Unexpected result from Anthropic: ' + JSON.stringify(json));
  }
  return text;
}

// Single-provider chat call (no retry, throws on failure)
async function singleProviderChat(
  fp: FallbackProvider,
  messages: LLMMessage[],
  maxTokens: number,
  stopWords: string[],
): Promise<string> {
  if (fp.provider === 'anthropic') {
    const config: LLMConfig = {
      provider: 'anthropic',
      url: fp.url,
      chatModel: fp.model,
      embeddingModel: '',
      stopWords: [],
      apiKey: fp.apiKey,
    };
    return await anthropicChatCompletion(config, messages, maxTokens, stopWords);
  }

  // OpenAI-compatible path
  const chatUrl = fp.provider === 'gemini'
    ? fp.url + '/chat/completions'
    : fp.url + '/v1/chat/completions';

  const body = {
    model: fp.model,
    messages,
    max_tokens: maxTokens,
    stop: stopWords.length > 0 ? stopWords : undefined,
  };

  const result = await fetch(chatUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + fp.apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    const error = await result.text();
    throw new Error(`${fp.name} chat failed (${result.status}): ${error}`);
  }

  const json = (await result.json()) as CreateChatCompletionResponse;
  const content = json.choices[0].message?.content;
  if (content === undefined) {
    throw new Error(`Unexpected result from ${fp.name}: ` + JSON.stringify(json));
  }
  return content;
}

export async function chatCompletion(
  body: Omit<CreateChatCompletionRequest, 'model'> & {
    model?: CreateChatCompletionRequest['model'];
  },
): Promise<{ content: string; retries: number; ms: number }> {
  const config = getLLMConfig();
  const stopWords = body.stop ? (typeof body.stop === 'string' ? [body.stop] : body.stop) : [];
  if (config.stopWords) stopWords.push(...config.stopWords);

  const fallbackChain = getFallbackChain();

  // If no fallback providers configured, use primary config directly (legacy path)
  if (fallbackChain.length === 0) {
    fallbackChain.push({
      name: config.provider,
      provider: config.provider,
      url: config.url,
      model: body.model ?? config.chatModel,
      apiKey: config.apiKey ?? '',
    });
  }

  // Reorder: put the configured LLM_PROVIDER first
  const primaryProvider = process.env.LLM_PROVIDER;
  if (primaryProvider) {
    const nameMap: Record<string, string> = {
      openai: 'OpenAI', anthropic: 'Claude', gemini: 'Gemini', deepseek: 'DeepSeek',
    };
    const primaryName = nameMap[primaryProvider];
    if (primaryName) {
      const idx = fallbackChain.findIndex((f) => f.name === primaryName);
      if (idx > 0) {
        const [primary] = fallbackChain.splice(idx, 1);
        fallbackChain.unshift(primary);
      }
    }
  }

  const start = Date.now();
  for (let i = 0; i < fallbackChain.length; i++) {
    const fp = fallbackChain[i];
    try {
      console.log(`[LLM] Trying ${fp.name} (${fp.model})...`);
      const content = await singleProviderChat(
        fp,
        body.messages,
        body.max_tokens ?? 300,
        stopWords,
      );
      if (i > 0) {
        console.log(`[LLM] Fallback to ${fp.name} succeeded`);
      }
      return { content, retries: i, ms: Date.now() - start };
    } catch (e: any) {
      console.error(`[LLM] ${fp.name} failed: ${e.message ?? e}`);
      if (i === fallbackChain.length - 1) {
        throw e; // All providers failed
      }
      // Continue to next provider
    }
  }
  throw new Error('All LLM providers failed');
}

export async function tryPullOllama(model: string, error: string) {
  if (error.includes('try pulling')) {
    console.error('Embedding model not found, pulling from Ollama');
    const pullResp = await fetch(getLLMConfig().url + '/api/pull', {
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
  const config = getLLMConfig();
  if (config.provider === 'ollama') {
    return {
      ollama: true as const,
      embeddings: await Promise.all(
        texts.map(async (t) => (await ollamaFetchEmbedding(t)).embedding),
      ),
    };
  }
  // Embeddings always use OpenAI endpoint, regardless of chat provider
  const embeddingConfig = getEmbeddingConfig();
  const {
    result: json,
    retries,
    ms,
  } = await retryWithBackoff(async () => {
    const result = await fetch(embeddingConfig.url + '/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...EmbeddingAuthHeaders(),
      },

      body: JSON.stringify({
        model: embeddingConfig.model,
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
  const { result: flagged } = await retryWithBackoff(async () => {
    const result = await fetch(getLLMConfig().url + '/v1/moderations', {
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
  const config = getLLMConfig();
  const { result } = await retryWithBackoff(async () => {
    const resp = await fetch(config.url + '/api/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: config.embeddingModel, prompt: text }),
    });
    if (resp.status === 404) {
      const error = await resp.text();
      await tryPullOllama(config.embeddingModel, error);
      throw new Error(`Failed to fetch embeddings: ${resp.status}`);
    }
    return (await resp.json()).embedding as number[];
  });
  return { embedding: result };
}

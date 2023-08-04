// That's right! No imports and no dependencies 🤯

export async function chatGPTCompletion(messages: Message[], maxTokens?: number, stop?: string[]) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'Missing OPENAI_API_KEY in environment variables.\n' +
        'Set it in the project settings in the Convex dashboard:\n' +
        '    npx convex dashboard\n or https://dashboard.convex.dev',
    );
  }

  const start = Date.now();
  let bodyPayload: CreateChatCompletionRequest = {
    model: 'gpt-3.5-turbo-16k',
    stream: false, // TODO: add streaming implementation
    // function_call: "none" | "auto" | {"name": "my_function"}
    // frequency_penalty: -2 to 2;
    // functions: [{name: "my_function", parameters: {json schema}, description: "my function description"}]
    // logit_bias: {[tokenId]: -100 to 100}
    // max_tokens: number
    // n: how many choices to generate
    // presence_penalty: -2 to 2
    // stop: string[] | string, specifies tokens to stop at
    // temperature 0 to 2, how random
    // top_p: number, alternative to temp
    // user: string, string identifying user to help OpenAI monitor abuse.
    messages,
  };
  if (maxTokens) {
    bodyPayload.max_tokens = maxTokens;
  }

  if (stop) {
    bodyPayload.stop = stop;
  }

  const result = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
    },

    body: JSON.stringify(bodyPayload),
  });
  if (!result.ok) {
    throw new Error('Unexpected result from OpenAI: ' + JSON.stringify(result));
  }
  const completion = (await result.json()) as CreateChatCompletionResponse;
  console.log('completion: ', completion);
  const ms = Date.now() - start;
  const content = completion.choices[0].message?.content;
  if (!content) {
    throw new Error('Unexpected result from OpenAI: ' + JSON.stringify(completion));
  }
  return {
    content,
    usage: completion.usage,
    ms,
  };
}

export async function fetchEmbeddingBatch(texts: string[]) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'Missing OPENAI_API_KEY in environment variables.\n' +
        'Set it in the project settings in the Convex dashboard:\n' +
        '    npx convex dashboard\n or https://dashboard.convex.dev',
    );
  }
  const start = Date.now();
  const result = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + process.env.OPENAI_API_KEY,
    },

    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: texts.map((text) => text.replace(/\n/g, ' ')),
    }),
  });
  const ms = Date.now() - start;

  const jsonresults = (await result.json()) as CreateEmbeddingResponse;
  if (jsonresults.data.length !== texts.length) {
    console.error(result);
    throw new Error('Unexpected number of embeddings');
  }
  const allembeddings = jsonresults.data;
  allembeddings.sort((a, b) => b.index - a.index);
  return {
    embeddings: allembeddings.map(({ embedding }) => embedding),
    usage: jsonresults.usage.total_tokens,
    ms,
  };
}

export async function fetchEmbedding(text: string) {
  const { embeddings, ...stats } = await fetchEmbeddingBatch([text]);
  return { embedding: embeddings[0], ...stats };
}

// Lifted from openai's package
export interface Message {
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
}

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

interface CreateChatCompletionRequest {
  /**
   * ID of the model to use. Currently, only `gpt-3.5-turbo` and `gpt-3.5-turbo-0301` are supported.
   * @type {string}
   * @memberof CreateChatCompletionRequest
   */
  model: string;
  /**
   * The messages to generate chat completions for, in the [chat format](/docs/guides/chat/introduction).
   * @type {Array<ChatCompletionRequestMessage>}
   * @memberof CreateChatCompletionRequest
   */
  messages: Message[];
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
   * The maximum number of tokens allowed for the generated answer. By default, the number of tokens the model can return will be (4096 - prompt tokens).
   * @type {number}
   * @memberof CreateChatCompletionRequest
   */
  max_tokens?: number;
  /**
   * Number between -2.0 and 2.0. Positive values penalize new tokens based on whether they appear in the text so far, increasing the model\'s likelihood to talk about new topics.  [See more information about frequency and presence penalties.](/docs/api-reference/parameter-details)
   * @type {number}
   * @memberof CreateChatCompletionRequest
   */
  presence_penalty?: number | null;
  /**
   * Number between -2.0 and 2.0. Positive values penalize new tokens based on their existing frequency in the text so far, decreasing the model\'s likelihood to repeat the same line verbatim.  [See more information about frequency and presence penalties.](/docs/api-reference/parameter-details)
   * @type {number}
   * @memberof CreateChatCompletionRequest
   */
  frequency_penalty?: number | null;
  /**
   * Modify the likelihood of specified tokens appearing in the completion.  Accepts a json object that maps tokens (specified by their token ID in the tokenizer) to an associated bias value from -100 to 100. Mathematically, the bias is added to the logits generated by the model prior to sampling. The exact effect will vary per model, but values between -1 and 1 should decrease or increase likelihood of selection; values like -100 or 100 should result in a ban or exclusive selection of the relevant token.
   * @type {object}
   * @memberof CreateChatCompletionRequest
   */
  logit_bias?: object | null;
  /**
   * A unique identifier representing your end-user, which can help OpenAI to monitor and detect abuse. [Learn more](/docs/guides/safety-best-practices/end-user-ids).
   * @type {string}
   * @memberof CreateChatCompletionRequest
   */
  user?: string;
}

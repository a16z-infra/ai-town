import * as WebLLM from '@mlc-ai/web-llm';

let engine: WebLLM.MLCEngineInterface | null = null;
// let chatModule: WebLLM.ChatModule | null = null; // ChatModule seems to be deprecated or integrated
let currentModelId = '';

// Model suggestions:
// Llama-2-7b-chat-hf-q4f16_1 (larger, more capable)
// RedPajama-INCITE-Chat-3B-v1-q4f16_1 (smaller, faster)
// vicuna-v1-7b-q4f16_1
// TinyLlama-1.1B-Chat-v0.4-q4f16_1 (very small, good for testing)
// const SELECTED_MODEL = "TinyLlama-1.1B-Chat-v0.4-q4f16_1";
// const SELECTED_MODEL = "RedPajama-INCITE-Chat-3B-v1-q4f16_1";
const SELECTED_MODEL = "Llama-2-7b-chat-hf-q4f16_1";


const appConfig: WebLLM.AppConfig = {
  model_list: [
    {
      "model": "https://huggingface.co/mlc-ai/Llama-2-7b-chat-hf-q4f16_1-MLC/resolve/main/",
      "model_id": "Llama-2-7b-chat-hf-q4f16_1",
      "model_lib": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/Llama-2-7b-chat-hf/Llama-2-7b-chat-hf-q4f16_1-ctx4k_cs1k-webgpu.wasm",
      // "vram_required_MB": 9109.0, // These seem to be optional or part of a different structure now
      // "low_resource_required": false,
    },
    {
      "model": "https://huggingface.co/mlc-ai/RedPajama-INCITE-Chat-3B-v1-q4f16_1-MLC/resolve/main/",
      "model_id": "RedPajama-INCITE-Chat-3B-v1-q4f16_1",
      "model_lib": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/RedPajama-INCITE-Chat-3B-v1/RedPajama-INCITE-Chat-3B-v1-q4f16_1-ctx2k-webgpu.wasm",
    },
     {
      "model": "https://huggingface.co/mlc-ai/vicuna-v1-7b-q4f16_1-MLC/resolve/main/",
      "model_id": "vicuna-v1-7b-q4f16_1",
      "model_lib": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/vicuna-v1-7b/vicuna-v1-7b-q4f16_1-ctx2k-webgpu.wasm",
    },
    {
      "model": "https://huggingface.co/mlc-ai/TinyLlama-1.1B-Chat-v0.4-q4f16_1-MLC/resolve/main/",
      "model_id": "TinyLlama-1.1B-Chat-v0.4-q4f16_1",
      "model_lib": "https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/TinyLlama-1.1B-Chat-v0.4/TinyLlama-1.1B-Chat-v0.4-q4f16_1-ctx2k-webgpu.wasm",
    }
  ],
  // wasmCacheName: "webllm-wasm-cache" // Default is "webllm/wasm"
};

// ChatOptions are still relevant for chat completions
// const chatOpts: WebLLM.ChatOptions = { // This type might also have changed or is part of ChatCompletionRequest
//   temperature: 0.7,
//   top_p: 0.95,
// };
// Instead of global chatOpts, these will be passed directly into the chat completion request.


const chatOpts: WebLLM.ChatOptions = {
  temperature: 0.7,
  top_p: 0.95,
  // context_window_size: 2048, // Default context window size
};

const progressCallback = (report: WebLLM.InitProgressReport) => {
  console.log('LLM Init Progress:', report.text);
};

export async function initLLM(modelId: string = SELECTED_MODEL): Promise<void> {
  if (engine && modelId === currentModelId) {
    console.log(`LLM engine with model ${modelId} is already initialized.`);
    return;
  }

  if (engine) {
    console.log(`Switching LLM model from ${currentModelId} to ${modelId}. Unloading current model...`);
    await engine.unload();
    // Reset state before initializing new engine or reloading
    engine = null;
    currentModelId = '';
  }


  console.log(`Initializing LLM engine with model: ${modelId}`);
  try {
    const worker = new Worker(
      new URL('./webllm-worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Use CreateWebWorkerMLCEngine as suggested by TS error
    engine = await WebLLM.CreateWebWorkerMLCEngine(worker, modelId, { // engine needs to be MLCEngine
      initProgressCallback: progressCallback,
      appConfig: appConfig,
      // chatOpts: chatOpts, // Pass chatOpts here if supported by CreateWebWorkerMLCEngine
    });
    
    // Reload is often implicit with CreateWebWorkerMLCEngine if modelId is passed,
    // or done via engine.reload(modelId, newChatOpts, appConfig)
    // For now, assuming CreateWebWorkerMLCEngine handles initial load.

    currentModelId = modelId;
    console.log(`LLM engine with model ${modelId} initialized successfully.`);
  } catch (err) {
    console.error('Error initializing LLM engine:', err);
    engine = null;
    currentModelId = '';
    throw err;
  }
}

export function isLLMReady(): boolean {
  return !!engine && !!currentModelId;
}

export async function generateLLMResponse(
  prompt: string | WebLLM.ChatCompletionMessageParam[], // Changed to ChatCompletionMessageParam
  progressCb?: (chunk: string, message: string) => void,
): Promise<string> {
  if (!isLLMReady() || !engine) {
    console.warn('LLM engine not initialized. Call initLLM() first.');
    // Fallback or throw error
    // For now, try to initialize with the default model if not ready.
    console.log('Attempting to initialize LLM with default model...');
    await initLLM();
    if (!isLLMReady() || !engine) {
       return "LLM is not ready. Please try again after initialization.";
    }
  }

  console.log('Generating LLM response for prompt:', prompt);
  try {
    // Use ChatCompletionRequestBase if that's what TS suggested for messages
    // However, the structure of messages [{role: 'user', content: '...'}], is standard.
    // The error was for ChatCompletionRequestMessage, not the messages array itself.
    // Let's assume ChatCompletionRequest is still the correct top-level type for the request.
    const request: WebLLM.ChatCompletionRequest = {
      messages: typeof prompt === 'string' ? [{ role: 'user', content: prompt }] : prompt,
      stream: true,
      // model: currentModelId, // Model is inherent to the engine instance after init
      // Pass chat options directly here
      temperature: 0.7,
      top_p: 0.95,
      // context_window_size: 2048, // This might be part of ChatOptions or model config
    };

    const asyncChunkGenerator = await engine.chat.completions.create(request);
    let fullResponse = "";
    for await (const chunk of asyncChunkGenerator) {
      // A new stream message has been generated
      // console.log("Chunk:", chunk);
      if (chunk.choices && chunk.choices[0].delta.content) {
        const content = chunk.choices[0].delta.content;
        fullResponse += content;
        if (progressCb) {
          progressCb(content, fullResponse);
        }
      }
      // Check for stop condition if necessary (e.g. based on a token)
      if (chunk.choices[0].finish_reason === "stop") {
          console.log("LLM generation finished.");
          break;
      }
    }
    console.log('LLM Response:', fullResponse);
    return fullResponse;

  } catch (err) {
    console.error('Error generating LLM response:', err);
    return `Error: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export async function getEngineInfo(): Promise<string> {
    if (!engine) return "Engine not loaded";
    return await engine.runtimeStatsText();
}

// --- Test functions (can be moved to a UI component later) ---
export async function testLLMInitialization() {
  console.log('Testing LLM Initialization...');
  try {
    await initLLM(); // Initialize with the default SELECTED_MODEL
    console.log('LLM Initialization test successful:', isLLMReady() ? 'Ready' : 'Not Ready');
    console.log(await getEngineInfo());
  } catch (e) {
    console.error('LLM Initialization test failed:', e);
  }
}

export async function testLLMGeneration() {
  console.log('Testing LLM Generation...');
  if (!isLLMReady()) {
    console.log('LLM not ready, attempting to initialize...');
    await testLLMInitialization();
    if (!isLLMReady()) {
      console.error('LLM could not be initialized for generation test.');
      return;
    }
  }
  try {
    const prompt = "Hello, LLM! Tell me a short joke.";
    console.log(`Sending prompt: "${prompt}"`);
    const response = await generateLLMResponse(prompt, (chunk, message) => {
        console.log("Stream chunk:", chunk);
        // console.log("Current full message:", message);
    });
    console.log(`LLM response to "${prompt}":\n${response}`);
  } catch (e) {
    console.error('LLM Generation test failed:', e);
  }
}

// Expose a way to trigger tests, e.g. from the console or a debug UI
// (window as any).testLLMInit = testLLMInitialization;
// (window as any).testLLMGen = testLLMGeneration;

console.log('llm.ts loaded. Call initLLM() to start model loading, or testLLMInitialization() / testLLMGeneration() for testing.');

// Notes on worker setup:
// The worker script `src/webllm-worker.ts` should use `WebLLM.WorkerMLCEngineHandler`
// if `MLCEngineWorkerHandler` was indeed the incorrect name from the error.
// Or, if the error was about `MLCEngineWorkerHandler` not existing on `WebLLM` directly,
// it might be a submodule like `WebLLM.Workers.MLCEngineWorkerHandler`.
// The previous error was: `Property 'MLCEngineWorkerHandler' does not exist on type 'typeof import("/app/node_modules/@mlc-ai/web-llm/lib/index")'.`
// This means it's not directly WebLLM.MLCEngineWorkerHandler.
// The library might have a different way to initialize the worker script.
// Let's assume `src/webllm-worker.ts` needs `WebLLM.CreateMLCEngineServer()` or similar.
// For now, the focus is on correcting the main `llm.ts` types.
// The worker file will be addressed in the next step based on any new errors.

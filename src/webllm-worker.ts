// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

/**
 * Worker handler for MLC Engine using WebWorkerMLCEngineHandler.
 *
 * This script runs in a separate thread when `llm.ts` creates a new Worker.
 * `WebWorkerMLCEngineHandler` is provided by the `@mlc-ai/web-llm` package.
 * It listens for messages from the main thread (forwarded by `CreateWebWorkerMLCEngine`'s proxy)
 * and translates them into calls to an `MLCEngine` instance that it manages internally.
 * This keeps the main UI thread responsive by offloading LLM computations.
 */

// Instantiate the handler. This is the core of the worker script for WebLLM.
// The handler will internally create an MLCEngine instance and manage
// the communication (postMessage/onmessage) with the main thread.
const handler = new WebWorkerMLCEngineHandler();

console.log("WebLLM Worker (webllm-worker.ts) with WebWorkerMLCEngineHandler has started.");

// No further manual setup of `postMessage` or `onmessage` is needed here,
// as `WebWorkerMLCEngineHandler` encapsulates this logic.

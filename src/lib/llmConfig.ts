// Configuration for LLM inference mode
export const LLM_CONFIG = {
  // Set to 'client' for browser-based inference, 'server' for traditional API-based inference
  INFERENCE_MODE: (import.meta.env.VITE_LLM_INFERENCE_MODE as 'client' | 'server') || 'client',
  
  // Client-side model configuration
  CLIENT_MODEL: import.meta.env.VITE_CLIENT_LLM_MODEL || 'Xenova/distilgpt2',
  
  // Show client LLM status in UI (development only)
  SHOW_CLIENT_STATUS: !!import.meta.env.VITE_SHOW_CLIENT_LLM_STATUS || import.meta.env.NODE_ENV === 'development',
  
  // Maximum number of requests to process concurrently
  MAX_CONCURRENT_REQUESTS: parseInt(import.meta.env.VITE_MAX_CLIENT_REQUESTS || '1'),
  
  // Request timeout in milliseconds
  REQUEST_TIMEOUT: parseInt(import.meta.env.VITE_CLIENT_REQUEST_TIMEOUT || '30000'),
} as const;

// Legacy server-side LLM check (for backward compatibility)
export function shouldUseClientLLM(): boolean {
  return LLM_CONFIG.INFERENCE_MODE === 'client';
}

export function shouldUseServerLLM(): boolean {
  return LLM_CONFIG.INFERENCE_MODE === 'server';
}
import { retryWithBackoff, tryPullOllama } from './openai';
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

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
  const embeddingMs = Date.now() - start;

  const jsonresults = await result.json();
  if (jsonresults.data.length !== texts.length) {
    console.error(result);
    throw new Error('Unexpected number of embeddings');
  }
  const allembeddings = jsonresults.data as {
    embedding: number[];
    index: number;
  }[];
  allembeddings.sort((a, b) => b.index - a.index);
  return {
    embeddings: allembeddings.map(({ embedding }) => embedding),
    totalTokens: jsonresults.usage.total_tokens,
    embeddingMs,
  };
}

export async function fetchEmbedding(text: string) {
  const { embeddings, ...stats } = await fetchEmbeddingBatch([text]);
  return { embedding: embeddings[0], ...stats };
}

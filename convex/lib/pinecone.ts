import { PineconeClient } from '@pinecone-database/pinecone';
import { Id, TableNames } from '../_generated/dataModel';
import { VectorOperationsApi } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';

export const MaxUpsertBatchLimit = 100;

function orThrow(env: string | undefined): string {
  if (!env) throw new Error('Missing Environment Variable');
  return env;
}

export function pineconeAvailable(): boolean {
  return (
    !!process.env.PINECONE_API_KEY &&
    !!process.env.PINECONE_ENVIRONMENT &&
    !!process.env.PINECONE_INDEX_NAME
  );
}

export async function pineconeIndex() {
  const client = new PineconeClient();
  await client.init({
    apiKey: orThrow(process.env.PINECONE_API_KEY),
    environment: orThrow(process.env.PINECONE_ENVIRONMENT),
  });
  return client.Index(orThrow(process.env.PINECONE_INDEX_NAME));
}

export async function upsertVectors<TableName extends TableNames>(
  namespace: TableName,
  vectors: { id: Id<TableName>; values: number[]; metadata: object }[],
  index?: VectorOperationsApi,
) {
  const start = Date.now();
  if (!index) {
    index = await pineconeIndex();
  }
  const results = [];
  // Insert all the vectors in batches of 100
  // https://docs.pinecone.io/docs/insert-data#batching-upserts
  for (let i = 0; i < vectors.length; i += MaxUpsertBatchLimit) {
    results.push(
      await index.upsert({
        upsertRequest: {
          namespace,
          vectors: vectors.slice(i, i + MaxUpsertBatchLimit),
        },
      }),
    );
  }
  console.log({
    count: vectors.length,
    pineconeUpsertMs: Date.now() - start,
  });
  return results;
}

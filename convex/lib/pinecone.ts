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
  tableName: TableName,
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
          namespace: tableName + process.env.CONVEX_CLOUD_URL,
          vectors: vectors.slice(i, i + MaxUpsertBatchLimit),
        },
      }),
    );
  }
  console.debug({
    upserted: vectors.length,
    pineconeUpsertMs: Date.now() - start,
  });
  return results;
}

export async function queryVectors<TableName extends TableNames>(
  tableName: TableName,
  embedding: number[],
  filter: object,
  limit: number,
) {
  const start = Date.now();
  const pinecone = await pineconeIndex();
  const { matches } = await pinecone.query({
    queryRequest: {
      namespace: tableName + process.env.CONVEX_CLOUD_URL,
      topK: limit,
      vector: embedding,
      filter,
    },
  });
  console.debug({
    queried: matches?.length,
    pineconeQueryMs: Date.now() - start,
  });
  if (!matches) {
    throw new Error('Pinecone returned undefined results');
  }
  return matches.filter((m) => !!m.score).map(({ id, score }) => ({ _id: id, score })) as {
    _id: Id<TableName>;
    score: number;
  }[];
}

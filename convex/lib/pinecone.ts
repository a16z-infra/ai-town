import { PineconeClient } from '@pinecone-database/pinecone';
import { Id, TableNames } from '../_generated/dataModel';
import { VectorOperationsApi } from '@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch';
import { internalAction } from '../_generated/server';

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

if (!pineconeAvailable()) {
  const deploymentName = process.env.CONVEX_CLOUD_URL?.slice(8).replace('.convex.cloud', '');
  throw new Error(
    '\n  Missing PINECONE_API_KEY, PINECONE_ENVIRONMENT, or PINECONE_INDEX_NAME' +
      ' in environment variables.\n\n' +
      '  Get one at https://app.pinecone.io/\n\n' +
      '  Paste it on the Convex dashboard:\n' +
      '  https://dashboard.convex.dev/d/' +
      deploymentName +
      '/settings?var=PINECONE_API_KEY&var=PINECONE_ENVIRONMENT&var=PINECONE_INDEX_NAME',
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

export const deleteVectors = internalAction({
  handler: async (ctx, { tableName, ids }: { tableName: TableNames; ids: Id<TableNames>[] }) => {
    const pinecone = await pineconeIndex();
    await pinecone.delete1({
      // NOTE: Pinecone namespaces are a paid feature. Uncomment this line
      // to use multiple Convex instances on the same Pinecone index:
      //
      // namespace: `${tableName} [${process.env.CONVEX_CLOUD_URL}]`,
      ids,
    });
  },
});

export const deleteAllVectors = internalAction({
  args: {},
  handler: async (ctx, args) => {
    if (pineconeAvailable()) {
      const index = await pineconeIndex();
      const deletionResult = await index._delete({
        deleteRequest: { deleteAll: true },
      });
      return deletionResult;
    } else {
      return {};
    }
  },
});

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
          // NOTE: Pinecone namespaces are a paid feature. Uncomment this line
          // to use multiple Convex instances on the same Pinecone index:
          //
          // namespace: `${tableName} [${process.env.CONVEX_CLOUD_URL}]`,
          vectors: vectors.slice(i, i + MaxUpsertBatchLimit),
        },
      }),
    );
  }
  // console.debug(`Pinecone upserted ${vectors.length} vectors in ${Date.now() - start}ms`);
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
      // NOTE: Pinecone namespaces are a paid feature. Uncomment this line
      // to use multiple Convex instances on the same Pinecone index:
      //
      // namespace: `${tableName} [${process.env.CONVEX_CLOUD_URL}]`,
      topK: limit,
      vector: embedding,
      filter,
    },
  });
  // console.debug(`Pinecone queried ${matches?.length} vectors in ${Date.now() - start}ms`);
  if (!matches) {
    throw new Error('Pinecone returned undefined results');
  }
  return matches.filter((m) => !!m.score).map(({ id, score }) => ({ _id: id, score })) as {
    _id: Id<TableName>;
    score: number;
  }[];
}

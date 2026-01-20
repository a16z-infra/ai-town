import { MilvusClient, DataType } from '@zilliz/milvus2-sdk-node';
import { EMBEDDING_DIMENSION } from './llm';

const MILVUS_HOST = process.env.MILVUS_HOST ?? 'localhost';
const MILVUS_PORT = process.env.MILVUS_PORT ?? '19530';

const milvusClient = new MilvusClient({
  address: `${MILVUS_HOST}:${MILVUS_PORT}`,
});

const COLLECTION_NAME = 'memories';

async function createCollection() {
  const collections = await milvusClient.showCollections();
  const collectionExists = collections.data.some((collection) => collection.name === COLLECTION_NAME);

  if (!collectionExists) {
    await milvusClient.createCollection({
      collection_name: COLLECTION_NAME,
      fields: [
        {
          name: 'embedding',
          data_type: DataType.FloatVector,
          dim: EMBEDDING_DIMENSION,
        },
        {
          name: 'playerId',
          data_type: DataType.VarChar,
          max_length: 256,
          is_primary_key: false,
        },
        {
            name: 'memoryId',
            data_type: DataType.VarChar,
            max_length: 256,
            is_primary_key: true,
        }
      ],
    });
  }
}

// Ensure the collection exists when the module is loaded.
createCollection().catch((error) => {
    console.error('Error creating Milvus collection:', error);
});

export async function insertVector(embedding: number[], playerId: string, memoryId: string) {
  await milvusClient.insert({
    collection_name: COLLECTION_NAME,
    fields_data: [
      {
        name: 'embedding',
        data: [embedding],
      },
      {
        name: 'playerId',
        data: [playerId],
      },
      {
        name: 'memoryId',
        data: [memoryId],
      },
    ],
  });
}

export async function searchVectors(vector: number[], playerId: string, limit: number) {
    const results = await milvusClient.search({
        collection_name: COLLECTION_NAME,
        vector: vector,
        filter: `playerId == "${playerId}"`,
        limit: limit,
        output_fields: ['memoryId', 'playerId'],
    });

    return results.results.map((result: any) => ({
        memoryId: result.memoryId,
        score: result.score,
    }));
}

import { Redis } from '@upstash/redis';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import { PineconeClient } from '@pinecone-database/pinecone';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { SupabaseVectorStore } from 'langchain/vectorstores/supabase';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { callLLM } from './converse';

export type CompanionKey = {
  companionName: string;
  modelName: string;
  userId: string;
};

class MemoryManager {
  private static instance: MemoryManager;
  private history: Redis;
  private vectorDBClient: PineconeClient | SupabaseClient;

  public constructor() {
    this.history = Redis.fromEnv();
    if (process.env.VECTOR_DB === 'pinecone') {
      this.vectorDBClient = new PineconeClient();
    } else {
      const auth = {
        detectSessionInUrl: false,
        persistSession: false,
        autoRefreshToken: false,
      };
      const url = process.env.SUPABASE_URL!;
      const privateKey = process.env.SUPABASE_PRIVATE_KEY!;
      this.vectorDBClient = createClient(url, privateKey, { auth });
    }
  }

  public async init() {
    if (this.vectorDBClient instanceof PineconeClient) {
      await this.vectorDBClient.init({
        apiKey: process.env.PINECONE_API_KEY!,
        environment: process.env.PINECONE_ENVIRONMENT!,
      });
    }
  }

  public async vectorSearch(recentChatHistory: string, companionFileName: string) {
    if (process.env.VECTOR_DB === 'pinecone') {
      console.log('INFO: using Pinecone for vector search.');
      const pineconeClient = <PineconeClient>this.vectorDBClient;

      const pineconeIndex = pineconeClient.Index(process.env.PINECONE_INDEX! || '');

      const vectorStore = await PineconeStore.fromExistingIndex(
        new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
        { pineconeIndex },
      );

      const similarDocs = await vectorStore
        .similaritySearch(recentChatHistory, 3, { fileName: companionFileName })
        .catch((err) => {
          console.log('WARNING: failed to get vector search results.', err);
        });
      return similarDocs;
    } else {
      console.log('INFO: using Supabase for vector search.');
      const supabaseClient = <SupabaseClient>this.vectorDBClient;
      const vectorStore = await SupabaseVectorStore.fromExistingIndex(
        new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
        {
          client: supabaseClient,
          tableName: 'documents',
          queryName: 'match_documents',
        },
      );
      const similarDocs = await vectorStore.similaritySearch(recentChatHistory, 3).catch((err) => {
        console.log('WARNING: failed to get vector search results.', err);
      });
      return similarDocs;
    }
  }

  public async summarizeAndStoreInVectorDB(text: string, name1: string, name2: string) {
    const chatHistoryKey = [name1.toLowerCase(), name2.toLowerCase()].sort().join('-');
    const summaryPrompt = `This is a conversation between ${name1} and ${name2}. 
    Please return a one paragraph summary of the conversation including all key words and concepts ${text}`;

    const summaryText = await callLLM(summaryPrompt);
    await this.storeInVectorDB(summaryText!.text, chatHistoryKey);
  }

  public async storeInVectorDB(text: string, key: string) {
    const doc = new Document({
      metadata: { names: key, timestamp: Date.now() },
      pageContent: text,
    });
    if (process.env.VECTOR_DB === 'pinecone') {
      console.log('INFO: using Pinecone for vector search.');
      const pineconeClient = <PineconeClient>this.vectorDBClient;

      const pineconeIndex = pineconeClient.Index(process.env.PINECONE_INDEX! || '');

      await PineconeStore.fromDocuments(
        [doc],
        new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
        {
          pineconeIndex,
        },
      );
    } else {
      console.log('INFO: using Supabase for vector store.');
      const supabaseClient = <SupabaseClient>this.vectorDBClient;
      await SupabaseVectorStore.fromDocuments(
        [doc],
        new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY }),
        {
          client: supabaseClient,
          tableName: 'documents',
        },
      );
    }
  }

  public static async getInstance(): Promise<MemoryManager> {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
      await MemoryManager.instance.init();
    }
    return MemoryManager.instance;
  }

  private generateRedisCompanionKey(companionKey: CompanionKey): string {
    return `${companionKey.companionName}-${companionKey.modelName}-${companionKey.userId}`;
  }

  public async writeToConversationHistory(text: string, conversationKey: string) {
    const result = await this.history.zadd(conversationKey, {
      score: Date.now(),
      member: text,
    });

    return result;
  }

  public async writeToHistory(text: string, companionKey: CompanionKey) {
    if (!companionKey || typeof companionKey.userId == 'undefined') {
      console.log('Companion key set incorrectly');
      return '';
    }

    const key = this.generateRedisCompanionKey(companionKey);
    const result = await this.history.zadd(key, {
      score: Date.now(),
      member: text,
    });

    return result;
  }

  public async readLatestCharacterConversations(conversationKey: string): Promise<string[]> {
    let result = await this.history.zrange(conversationKey, -1, Date.now(), {
      byScore: true,
      withScores: true,
    });
    let latestChatTimeStr: string;
    if (result.length > 0) {
      let timestamp = new Date(<number>result[1]);
      latestChatTimeStr = timestamp.toDateString() + ' ' + timestamp.toTimeString();
    } else {
      latestChatTimeStr = 'two weeks ago';
    }

    result = result.filter((item) => typeof item !== 'number');

    result = result.reverse();
    const recentChats = result.reverse().join('\n');
    return [latestChatTimeStr, recentChats];
  }

  public async readLatestHistory(companionKey: CompanionKey): Promise<string> {
    if (!companionKey || typeof companionKey.userId == 'undefined') {
      console.log('Companion key set incorrectly');
      return '';
    }

    const key = this.generateRedisCompanionKey(companionKey);
    let result = await this.history.zrange(key, 0, Date.now(), {
      byScore: true,
    });

    result = result.slice(-30).reverse();
    const recentChats = result.reverse().join('\n');
    return recentChats;
  }

  public async seedChatHistory(
    seedContent: String,
    delimiter: string = '\n',
    companionKey: CompanionKey,
  ) {
    const key = this.generateRedisCompanionKey(companionKey);
    if (await this.history.exists(key)) {
      console.log('User already has chat history');
      return;
    }

    const content = seedContent.split(delimiter);
    let counter = 0;
    for (const line of content) {
      await this.history.zadd(key, { score: counter, member: line });
      counter += 1;
    }
  }
}

export default MemoryManager;

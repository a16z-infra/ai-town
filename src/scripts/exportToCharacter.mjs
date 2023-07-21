import { Redis } from "@upstash/redis";
import { PromptTemplate } from "langchain/prompts";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";

import dotenv from "dotenv";
import fs from "fs/promises";
dotenv.config({ path: `.env.local` });

const COMPANION_NAME = process.argv[2];
const MODEL_NAME = process.argv[3];
const USER_ID = process.argv[4];

if (!!!COMPANION_NAME || !!!MODEL_NAME || !!!USER_ID) {
  throw new Error(
    "**Usage**: npm run export-to-character <COMPANION_NAME> <MODEL_NAME> <USER_ID>"
  );
}

const data = await fs.readFile("companions/" + COMPANION_NAME + ".txt", "utf8");
const presplit = data.split("###ENDPREAMBLE###");
const preamble = presplit[0];
const seedsplit = presplit[1].split("###ENDSEEDCHAT###");
const seedChat = seedsplit[0];
const backgroundStory = seedsplit[1];
console.log(preamble, backgroundStory);

const history = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const upstashChatHistory = await history.zrange(
  `${COMPANION_NAME}-${MODEL_NAME}-${USER_ID}`,
  0,
  Date.now(),
  {
    byScore: true,
  }
);
const recentChat = upstashChatHistory.slice(-30);
const model = new OpenAI({
  modelName: "gpt-3.5-turbo-16k",
  openAIApiKey: process.env.OPENAI_API_KEY,
});
model.verbose = true;

const chainPrompt = PromptTemplate.fromTemplate(`
  ### Background Story: 
  ${preamble}
  
  ${backgroundStory}

  ### Chat history: 
  ${seedChat}

  ...
  ${recentChat}

  
  Above is someone whose name is ${COMPANION_NAME}'s story and their chat history with a human. Output answer to the following question. Return only the answer itself 
  
  {question}`);

const chain = new LLMChain({
  llm: model,
  prompt: chainPrompt,
});
const questions = [
  `Greeting: What would ${COMPANION_NAME} say to start a conversation?`,
  `Short Description: In a few sentences, how would ${COMPANION_NAME} describe themselves?`,
  `Long Description: In a few sentences, how would ${COMPANION_NAME} describe themselves?`,
];
const results = await Promise.all(
  questions.map(async (question) => {
    try {
      return await chain.call({ question });
    } catch (error) {
      console.error(error);
    }
  })
);

let output = "";
for (let i = 0; i < questions.length; i++) {
  output += `*****${questions[i]}*****\n${results[i].text}\n\n`;
}
output += `Definition (Advanced)\n${recentChat.join("\n")}`;

await fs.writeFile(`${COMPANION_NAME}_chat_history.txt`, upstashChatHistory);
await fs.writeFile(`${COMPANION_NAME}_character_ai_data.txt`, output);

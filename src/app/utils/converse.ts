import { LLMChain } from 'langchain/chains';
import { PromptTemplate } from 'langchain/prompts';
import { OpenAI } from 'langchain/llms/openai';

export async function callLLM(prompt: string) {
  const model = new OpenAI({
    streaming: true,
    modelName: 'gpt-3.5-turbo-16k',
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
  model.verbose = true;

  const chain = new LLMChain({
    llm: model,
    prompt: PromptTemplate.fromTemplate(prompt),
  });

  const result = await chain.call({}).catch(console.error);
  return result;
}

export async function loadCharacterOverview(companionFileName: string) {
  const fs = require('fs').promises;
  const data = await fs.readFile('companions/' + companionFileName, 'utf8');

  // Clunky way to break out PREAMBLE and SEEDCHAT from the character file
  const presplit = data.split('###ENDPREAMBLE###');
  const preamble = presplit[0];
  return preamble;
}

export async function reflectStoppingPoint(currentConversation: string) {
  const prompt = `Based on the below chat history, return "0" if you think the conversation should be stopped. return "1" otherwise. ONLY return "0" or "1" and nothing else. ${currentConversation}`;
  const result = await callLLM(prompt);

  return result!.text;
}

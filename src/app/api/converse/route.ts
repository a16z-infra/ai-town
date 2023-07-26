import dotenv from 'dotenv';
import ConfigManager from '@/app/utils/config';
import { callLLM, loadCharacterOverview, reflectStoppingPoint } from '@/app/utils/converse';
import { NextResponse } from 'next/server';
import MemoryManager from '@/app/utils/memory';

dotenv.config({ path: `.env.local` });
let chatHistory: any[] = [];

type ConversationKey = {};

export async function POST(req: Request, res: Response) {
  const data = await req.json();
  const characters = data.characters;

  const configManager = ConfigManager.getInstance();
  const character1Name = characters[0];
  const character2Name = characters[1];
  const character1Config = configManager.getConfig('name', character1Name);
  const character2Config = configManager.getConfig('name', character2Name);
  const memoryManager = await MemoryManager.getInstance();
  const chatHistoryKey = [character1Name.toLowerCase(), character2Name.toLowerCase()]
    .sort()
    .join('-');
  // const recentConversationObj: string[] = await memoryManager.readLatestCharacterConversations(
  //   chatHistoryKey,
  // );

  //TODO
  const recentConversationObj: string[] = ['', ''];
  const latestChatTimestamp = recentConversationObj[0];
  const latestChatHistory = recentConversationObj[1];
  console.log('recent conversation ts', latestChatTimestamp);

  // Get character overviews. TODO: add vector search here
  let fromCharacterOverview = await loadCharacterOverview(character1Config.name + '.txt');
  let toCharacterOverview = await loadCharacterOverview(character2Config.name + '.txt');
  const now = new Date();

  const finalPrompt = `

  You are ${character1Name} and you are currently talking to ${character2Name}. 

  ONLY greet the other person at the beginning of the conversation. DO NOT greet them again. 
  Do NOT repeat topics already in the chat history provided below. 
  
  If the conversation below starts to sound repetitive to you, find a way to conclude the conversation. 
  If you think the conversation should end, return "0" and do not say anything else.

  Last time you chatted with ${character2Name}, it was ${latestChatTimestamp}. It's now ${now}. 
  If you talked to ${character2Name} within the last 30 minutes, skip this conversation by returning "0". 
  DO NOT engage in conversation if you have talked to ${character2Name} within the last 30 minutes.

  Below are relevant details about ${character2Name}:
  ${toCharacterOverview}
  
  Current conversation: 
  ${chatHistory.join('\n')}

  ${character1Name}:`;

  let responseFromConvo = await callLLM(finalPrompt);
  let stopConvo: string = await reflectStoppingPoint(
    chatHistory.join('\n') + '\n' + responseFromConvo!.text,
  );

  if (stopConvo !== '0') {
    chatHistory.push(`${character1Name}: ${responseFromConvo!.text}`);
    return NextResponse.json({
      text: `${character1Name}: ${responseFromConvo!.text}`,
    });
  } else {
    console.log('sending stop signal');
    await memoryManager.summarizeAndStoreInVectorDB(
      chatHistory.join('\n'),
      character1Name,
      character2Name,
    );
    chatHistory = [];
    return NextResponse.json({
      text: `STOP`,
    });
  }
}

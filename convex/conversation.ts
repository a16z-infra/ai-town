import { Id } from './_generated/dataModel';
import { ActionCtx } from './_generated/server';
import { fetchEmbeddingWithCache } from './lib/cached_llm';
import { MemoryDB, filterMemoriesType } from './lib/memory';
import { LLMMessage, chatCompletion, fetchEmbedding } from './lib/openai';
import { Message } from './schema';

type Player = { id: Id<'players'>; name: string; identity: string };
type Relation = Player & { relationship: string };

export async function startConversation(
  ctx: ActionCtx,
  audience: Player[],
  memory: MemoryDB,
  player: Player,
) {
  const newFriendsNames = audience.map((p) => p.name);

  const { embedding } = await fetchEmbeddingWithCache(
    ctx,
    `What do you think about ${newFriendsNames.join(',')}?`,
    { write: true },
  );
  const memories = await memory.accessMemories(player.id, embedding);

  const convoMemories = filterMemoriesType(['conversation'], memories);

  const prompt: LLMMessage[] = [
    {
      role: 'user',
      content:
        `You are ${player.name}. You just saw ${newFriendsNames}. You should greet them and start a conversation with them. Below are some of your memories about ${newFriendsNames}:` +
        //relationships.map((r) => r.relationship).join('\n') +
        convoMemories.map((r) => r.memory.description).join('\n') +
        `\n${player.name}:`,
    },
  ];
  const stop = newFriendsNames.map((name) => name + ':');
  const { content } = await chatCompletion({ messages: prompt, max_tokens: 300, stop });
  return { content, memoryIds: memories.map((m) => m.memory._id) };
}

function messageContent(m: Message): string {
  switch (m.type) {
    case 'started':
      return `${m.fromName} started the conversation.`;
    case 'left':
      return `${m.fromName} left the conversation.`;
    case 'responded':
      return `${m.fromName} to ${m.toNames.join(',')}: ${m.content}\n`;
  }
}

export function chatHistoryFromMessages(messages: Message[]): LLMMessage[] {
  return (
    messages
      // For now, just use the message content.
      // However, we could give it context on who started / left the convo
      .filter((m) => m.type === 'responded')
      .map((m) => ({
        role: 'user',
        content: messageContent(m),
      }))
  );
}

export async function decideWhoSpeaksNext(
  players: Player[],
  chatHistory: LLMMessage[],
): Promise<Player> {
  if (players.length === 1) {
    return players[0];
  }

  const promptStr = `[no prose]\n [Output only JSON]

  ${JSON.stringify(players)}
  Here is a list of people in the conversation, return BOTH name and ID of the person who should speak next based on the chat history provided below.
  Return in JSON format, example: {"name": "Alex", id: "1234"}
  ${chatHistory.map((m) => m.content).join('\n')}`;
  const prompt: LLMMessage[] = [
    {
      role: 'user',
      content: promptStr,
    },
  ];
  const { content } = await chatCompletion({ messages: prompt, max_tokens: 300 });
  let speakerId: string;
  try {
    speakerId = JSON.parse(content).id;
  } catch (e) {
    console.error('error parsing speakerId: ', e);
  }
  const randomIdx = Math.floor(Math.random() * players.length);
  return players.find((p) => p.id.toString() === speakerId) || players[randomIdx];
}

export async function converse(
  ctx: ActionCtx,
  messages: LLMMessage[],
  player: Player,
  nearbyPlayers: Player[],
  memory: MemoryDB,
) {
  const nearbyPlayersNames = nearbyPlayers.join(', ');
  const lastMessage: string | null | undefined = messages?.at(-1)?.content;
  const { embedding } = await fetchEmbedding(lastMessage ? lastMessage : '');
  const memories = await memory.accessMemories(player.id, embedding);
  const conversationMemories = filterMemoriesType(['conversation'], memories);
  const lastConversationTs = conversationMemories[0]?.memory._creationTime;

  const stop = nearbyPlayers.join(':');
  const relevantMemories: string = conversationMemories
    .slice(0, 2) // only use the first 2 memories
    .map((r) => r.memory.description)
    .join('\n');

  // console.debug('relevantMemories: ', relevantMemories);

  let prefixPrompt = `Your name is ${player.name}. About you: ${player.identity}.
  You are talking to ${nearbyPlayersNames}, below are something about them: `;

  nearbyPlayers.forEach((p) => {
    prefixPrompt += `\nAbout ${p.name}: ${p.identity}\n`;
  });

  prefixPrompt += `Last time you chatted with some of ${nearbyPlayersNames} it was ${lastConversationTs}. It's now ${Date.now()}. You can cut this conversation short if you talked to this group of people within the last day. \n}`;

  prefixPrompt += `Below are relevant memories to this conversation you are having right now: ${relevantMemories}\n`;

  prefixPrompt +=
    'Below are the current chat history between you and the other folks mentioned above. DO NOT greet the other people more than once. Only greet ONCE. Do not use the word Hey too often. Response should be brief and within 200 characters: \n';

  const prompt: LLMMessage[] = [
    {
      role: 'user',
      content: prefixPrompt,
    },
    ...messages,
    {
      role: 'user',
      content: `${player.name}:`,
    },
  ];
  const { content } = await chatCompletion({ messages: prompt, max_tokens: 300, stop });
  // console.debug('converse result through chatgpt: ', content);
  return { content, memoryIds: memories.map((m) => m.memory._id) };
}

export async function walkAway(messages: LLMMessage[], player: Player): Promise<boolean> {
  const prompt: LLMMessage[] = [
    {
      role: 'user',
      content: `Below is a chat history among a few people who ran into each other. You are ${player.name}. You want to conclude this conversation when you think it's time to go.

      Return 1 if you want to walk away from the conversation and 0 if you want to continue to chat.`,
    },
    ...messages,
  ];
  const { content: description } = await chatCompletion({
    messages: prompt,
    max_tokens: 1,
    temperature: 0,
  });
  return description === '1';
}

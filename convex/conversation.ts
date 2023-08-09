import { MemoryDB, filterMemoriesType } from './lib/memory';
import { GPTMessage, chatGPTCompletion, fetchEmbedding } from './lib/openai';
import { Message, Player, Snapshot } from './schema';

export async function startConversation(
  relationships: { name: string; relationship: string }[],
  memory: MemoryDB,
  player: Player,
): Promise<string> {
  const newFriendsNames = relationships.map((r) => r.name);

  const { embedding } = await fetchEmbedding(
    `What do you think about ${newFriendsNames.join(',')}?`,
  );
  const memories = await memory.accessMemories(player.id, embedding);

  const convoMemories = filterMemoriesType(['conversation'], memories);

  const prompt: GPTMessage[] = [
    {
      role: 'user',
      content:
        `You are ${player.name}. You just saw ${newFriendsNames}. You should greet them and start a conversation with them. Below are some of your memories about ${newFriendsNames}:` +
        relationships.map((r) => r.relationship).join('\n') +
        convoMemories.map((r) => r.memory.description).join('\n') +
        `\n${player.name}:`,
    },
  ];
  const stop = newFriendsNames.map((name) => name + ':');
  const { content } = await chatGPTCompletion({ messages: prompt, max_tokens: 300, stop });
  return content;
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

export function chatHistoryFromMessages(messages: Message[]): GPTMessage[] {
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

export async function converse(
  messages: GPTMessage[],
  player: Player,
  nearbyPlaers: Snapshot['nearbyPlayers'],
  memory: MemoryDB,
): Promise<string> {
  const nearbyPlayersNames = nearbyPlaers.map((p) => p.player.name).join(', ');
  const lastMessage: string | null | undefined = messages?.at(-1)?.content;
  const { embedding } = await fetchEmbedding(lastMessage ? lastMessage : '');
  const memories = await memory.accessMemories(player.id, embedding);
  const conversationMemories = filterMemoriesType(['conversation'], memories);
  const lastConversationTs = conversationMemories[0]?.memory._creationTime;

  const stop = nearbyPlaers.map((p) => p.player.name + ':');
  const relevantMemories: string = conversationMemories
    .slice(0, 2) // only use the first 2 memories
    .map((r) => r.memory.description)
    .join('\n');

  console.log('relevantMemories: ', relevantMemories);

  let prefixPrompt = `Your name is ${player.name}. About you: ${player.identity}.
  You are talking to ${nearbyPlayersNames}, below are something about them: `;
  nearbyPlaers.forEach((p) => {
    prefixPrompt += `\nAbout ${p.player.name}: ${p.player.identity}\n`;
  });

  prefixPrompt += `Last time you chatted with some of ${nearbyPlayersNames} it was ${lastConversationTs}. It's now ${Date.now()}. You can cut this conversation short if you talked to this group of people within the last day. \n}`;

  prefixPrompt += `Below are relevant memories to this conversation you are having right now: ${relevantMemories}\n`;

  prefixPrompt +=
    'Below are the current chat history between you and the other folks mentioned above. DO NOT greet the other people more than once. Only greet ONCE. Response should be brief and within 200 characters: \n';

  const prompt: GPTMessage[] = [
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
  console.log('convers() stop: ', stop);
  const { content } = await chatGPTCompletion({ messages: prompt, max_tokens: 300, stop });
  // console.log('converse() prompt: ', prompt);
  console.log('converse result through chatgpt: ', content);
  return content;
}

export async function walkAway(messages: GPTMessage[], player: Player): Promise<boolean> {
  const prompt: GPTMessage[] = [
    {
      role: 'user',
      content: `Below is a chat history among a few people who ran into each other. You are ${player.name}. You want to conclude this conversation when you think it's time to go.

      Return 1 if you want to walk away from the conversation and 0 if you want to continue to chat.`,
    },
    ...messages,
  ];
  const { content: description } = await chatGPTCompletion({ messages: prompt, max_tokens: 2 });
  return description === '1';
}

import { Id } from './_generated/dataModel';
import { Message, chatGPTCompletion } from './lib/openai';
import { Player, Snapshot } from './types';

export async function converse(
  messages: Message[],
  player: Player,
  nearbyPlaers: Snapshot['nearbyPlayers'],
): Promise<string> {
  const nearbyPlayersNames = nearbyPlaers.map((p) => p.player.name).join(', ');
  const stop = nearbyPlaers.map((p) => p.player.name + ':');

  const prefixPrompt = `Your name is ${player.name}. About you: ${player.identity}. 
  You are talking to ${nearbyPlayersNames}, below are something about them: `;
  nearbyPlaers.forEach((p) => {
    prefixPrompt.concat(`\nAbout ${p.player.name}: ${p.player.identity}\n`);
  });

  prefixPrompt.concat(
    'Below are the current chat history between you and the other folks mentioned above. Response should be within two short sentences: ',
  );
  const prompt: Message[] = [
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
  const { content: description } = await chatGPTCompletion(prompt, 1000, stop);
  console.log('converse() prompt: ', prompt);
  console.log('converse result through chatgpt: ', description);
  return description;
}

export async function walkAway(messages: Message[], player: Player): Promise<boolean> {
  const prompt: Message[] = [
    {
      role: 'user',
      content: `Below is a chat history among a few people who ran into each other. You are ${player.name}. 
        Return 1 if you want to walk away from the conversation and 0 if you want to stay.`,
    },
    ...messages,
  ];
  console.log('walkAway prompt: ', prompt);
  const { content: description } = await chatGPTCompletion(prompt, 2);
  console.log('walkAway result: ', description);
  return description === '1';
}

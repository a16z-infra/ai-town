import { clientLLM } from './clientLLM';

export interface ConversationContext {
  worldId: string;
  playerId: string;
  playerName: string;
  playerIdentity: string;
  playerPlan: string;
  otherPlayerId: string;
  otherPlayerName: string;
  otherPlayerIdentity?: string;
  conversationId: string;
  conversationHistory: string[];
  memories: string[];
  lastConversationTime?: number;
}

export async function generateStartConversationMessage(
  context: ConversationContext
): Promise<string> {
  const { playerName, playerIdentity, playerPlan, otherPlayerName, otherPlayerIdentity, memories, lastConversationTime } = context;

  // Build the identity prompt similar to server-side version
  let identityPrompt = playerIdentity;
  if (playerPlan) {
    identityPrompt += ` Your goals for the conversation: ${playerPlan}`;
  }
  if (otherPlayerIdentity) {
    identityPrompt += ` About ${otherPlayerName}: ${otherPlayerIdentity}`;
  }

  // Add memory context if available
  if (memories.length > 0) {
    identityPrompt += ` Related memories: ${memories.slice(0, 3).join('. ')}`;
  }

  // Add last conversation context
  if (lastConversationTime) {
    const lastTime = new Date(lastConversationTime).toLocaleString();
    const now = new Date().toLocaleString();
    identityPrompt += ` Last time you chatted with ${otherPlayerName} it was ${lastTime}. It's now ${now}.`;
  }

  return await clientLLM.generateConversationMessage(
    playerName,
    identityPrompt,
    [],
    'start',
    otherPlayerName
  );
}

export async function generateContinueConversationMessage(
  context: ConversationContext
): Promise<string> {
  const { playerName, playerIdentity, playerPlan, otherPlayerName, otherPlayerIdentity, conversationHistory, memories } = context;

  // Build the identity prompt
  let identityPrompt = playerIdentity;
  if (playerPlan) {
    identityPrompt += ` Your goals for the conversation: ${playerPlan}`;
  }
  if (otherPlayerIdentity) {
    identityPrompt += ` About ${otherPlayerName}: ${otherPlayerIdentity}`;
  }

  // Add memory context
  if (memories.length > 0) {
    identityPrompt += ` Related memories: ${memories.slice(0, 3).join('. ')}`;
  }

  return await clientLLM.generateConversationMessage(
    playerName,
    identityPrompt,
    conversationHistory,
    'continue',
    otherPlayerName
  );
}

export async function generateLeaveConversationMessage(
  context: ConversationContext
): Promise<string> {
  const { playerName, playerIdentity, playerPlan, otherPlayerName, otherPlayerIdentity, conversationHistory } = context;

  // Build the identity prompt
  let identityPrompt = playerIdentity;
  if (playerPlan) {
    identityPrompt += ` Your goals for the conversation: ${playerPlan}`;
  }
  if (otherPlayerIdentity) {
    identityPrompt += ` About ${otherPlayerName}: ${otherPlayerIdentity}`;
  }

  return await clientLLM.generateConversationMessage(
    playerName,
    identityPrompt,
    conversationHistory,
    'leave',
    otherPlayerName
  );
}

export async function initializeClientLLM(): Promise<void> {
  await clientLLM.initialize();
}

export function getClientLLMStatus() {
  return clientLLM.getLoadingStatus();
}
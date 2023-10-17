import { engineTables } from '../engine/schema';
import { players } from './players';
import { locations } from './locations';
import { conversations } from './conversations';
import { conversationMembers } from './conversationMembers';
import { agents } from './agents';

export const gameTables = {
  players,
  locations,
  conversations,
  conversationMembers,
  agents,
  ...engineTables,
};

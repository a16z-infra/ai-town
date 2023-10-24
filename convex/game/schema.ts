import { engineTables } from '../engine/schema';
import { players } from './players';
import { locationTables } from './locations';
import { conversations } from './conversations';
import { conversationMembers } from './conversationMembers';
import { agents } from './agents';

export const gameTables = {
  players,
  ...locationTables,
  conversations,
  conversationMembers,
  agents,
  ...engineTables,
};

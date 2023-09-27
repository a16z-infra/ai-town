import { engineTables } from '../engine/schema';
import { players } from './players';
import { locations } from './location';
import { conversations } from './conversations';
import { conversationMembers } from './conversationMembers';

export const gameTables = {
  players: players,
  locations: locations,
  conversations: conversations,
  conversationMembers: conversationMembers,
  ...engineTables,
};

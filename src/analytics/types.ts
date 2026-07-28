import { FunctionReturnType } from 'convex/server';
import { api } from '../../convex/_generated/api';

export type Character = FunctionReturnType<typeof api.analytics.characters>['characters'][number];
export type ActiveConversation = FunctionReturnType<
  typeof api.analytics.activeConversations
>[number];
export type ConversationSummary = FunctionReturnType<
  typeof api.analytics.conversations
>['page'][number];
export type Transcript = FunctionReturnType<typeof api.analytics.transcript>;
export type TailMessage = FunctionReturnType<typeof api.analytics.recentMessages>[number];
export type Memory = FunctionReturnType<typeof api.analytics.memories>['page'][number];
export type Stats = FunctionReturnType<typeof api.analytics.stats>;

export type Tab = 'conversations' | 'live' | 'memories' | 'stats';

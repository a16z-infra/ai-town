import { api } from '../../convex/_generated/api';
import { makeUseSessionHooks } from './convex-sessions/client';

export const { SessionProvider, useSessionMutation, useSessionQuery } = makeUseSessionHooks(
  api.auth.createOrValidateSession,
  'ai-town-session-id',
  'localStorage',
);

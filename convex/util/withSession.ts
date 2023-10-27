import { DataModel } from '../_generated/dataModel';
import { makeSessionWrappers } from './convex-sessions/server';

export const {
  SessionMiddlewareValidator,
  OptionalSessionMiddlewareValidator,
  withSession,
  withOptionalSession,
  queryWithSession,
  mutationWithSession,
} = makeSessionWrappers<DataModel, 'sessions'>('sessions');

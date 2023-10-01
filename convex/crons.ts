import { cronJobs } from 'convex/server';
import { IDLE_WORLD_TIMEOUT } from './constants';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.interval(
  'stop inactive worlds',
  { seconds: IDLE_WORLD_TIMEOUT / 1000 },
  internal.world.stopInactiveWorlds,
);

export default crons;

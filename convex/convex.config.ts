import { defineApp } from 'convex/server';
import rag from '@convex-dev/rag/convex.config.js';

import aiBudget from '@convex-dev/ai-budget/convex.config.js';

const app = defineApp();
app.use(rag);
app.use(aiBudget);
export default app;

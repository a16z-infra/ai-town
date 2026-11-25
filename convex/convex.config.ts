import { defineApp } from 'convex/server';
import rag from '@convex-dev/rag/convex.config.js';

import migrations from '@convex-dev/migrations/convex.config.js';

const app = defineApp();
app.use(rag);
app.use(migrations);
export default app;

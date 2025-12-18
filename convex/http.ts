import { httpRouter } from 'convex/server';
import { handleReplicateWebhook } from './music';
import './websocket';

const http = httpRouter();
http.route({
  path: '/replicate_webhook',
  method: 'POST',
  handler: handleReplicateWebhook,
});
export default http;

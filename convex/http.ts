import { httpRouter } from "convex/server";
import { handleReplicateWebhook } from "./lib/replicate";

const http = httpRouter();

http.route({
    path: "/replicate_webhook",
    method: "POST",
    handler: handleReplicateWebhook,
});


// Convex expects the router to be the default export of `convex/http.js`.
export default http;
import { WebSocketServer, WebSocket } from 'ws';
import { subscribeToConversation } from './util/rabbitmq';

const wss = new WebSocketServer({ port: 3124 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            if (data.type === 'subscribe' && data.conversationId) {
                console.log(`Client subscribed to conversation ${data.conversationId}`);
                subscribeToConversation(data.conversationId, (msg) => {
                    ws.send(JSON.stringify(msg));
                });
            }
        } catch (error) {
            console.error('Failed to parse message or subscribe:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

console.log('WebSocket server started on port 3124');

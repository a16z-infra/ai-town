import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL ?? 'amqp://localhost';
const EXCHANGE_NAME = 'agent_messages';

let connection: amqp.Connection | null = null;
let channel: amqp.Channel | null = null;

async function connect() {
  if (channel) {
    return;
  }
  connection = await amqp.connect(RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: false });
}

// Ensure we connect when the module is loaded.
connect().catch((error) => {
    console.error('Error connecting to RabbitMQ:', error);
});

export async function publishMessage(conversationId: string, message: object) {
    if (!channel) {
        throw new Error('RabbitMQ channel is not available.');
    }
    const routingKey = `conversation.${conversationId}`;
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
}

export async function subscribeToConversation(conversationId: string, onMessage: (message: any) => void) {
    if (!channel) {
        throw new Error('RabbitMQ channel is not available.');
    }
    const q = await channel.assertQueue('', { exclusive: true });
    const routingKey = `conversation.${conversationId}`;
    await channel.bindQueue(q.queue, EXCHANGE_NAME, routingKey);
    channel.consume(q.queue, (msg) => {
        if (msg) {
            const content = JSON.parse(msg.content.toString());
            onMessage(content);
            channel?.ack(msg);
        }
    });
}

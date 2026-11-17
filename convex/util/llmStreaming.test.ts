import { ChatCompletionContent } from './llm';

function streamChunks(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
}

function event(content: string) {
  return `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
}

describe('ChatCompletionContent', () => {
  const encoder = new TextEncoder();

  test('preserves multibyte characters at every possible byte split', async () => {
    const text = '你好，café 👋';
    const bytes = encoder.encode(event(text) + 'data: [DONE]\n\n');

    for (let split = 1; split < bytes.length; split++) {
      const stream = streamChunks([bytes.slice(0, split), bytes.slice(split)]);
      const content = new ChatCompletionContent(stream, []);

      expect({ split, text: await content.readAll() }).toEqual({ split, text });
    }
  });

  test('handles one-byte chunks across multiple events and stop words', async () => {
    const bytes = encoder.encode(event('你好') + event('👋<ST') + event('OP>ignored'));
    const stream = streamChunks(Array.from(bytes, (byte) => Uint8Array.of(byte)));

    expect(await new ChatCompletionContent(stream, ['<STOP>']).readAll()).toBe('你好👋');
  });

  test('flushes a final event without a trailing separator', async () => {
    const bytes = encoder.encode(event('再见🌍').trimEnd());
    const stream = streamChunks(Array.from(bytes, (byte) => Uint8Array.of(byte)));

    expect(await new ChatCompletionContent(stream, []).readAll()).toBe('再见🌍');
    expect(stream.locked).toBe(false);
  });

  test('flushes incomplete UTF-8 at end of stream and releases the reader', async () => {
    const stream = streamChunks([encoder.encode('tail'), Uint8Array.of(0xe4)]);
    const content = new ChatCompletionContent(stream, []);
    const fragments: string[] = [];

    for await (const fragment of content.splitStream(stream)) fragments.push(fragment);

    expect(fragments).toEqual(['tail�']);
    expect(stream.locked).toBe(false);
  });
});

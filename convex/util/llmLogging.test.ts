import { jest } from '@jest/globals';
import { chatCompletion } from './llm';

describe('chatCompletion logging', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, LLM_PROVIDER: 'ollama' };
    delete process.env.DEBUG_LLM;
    delete process.env.TOGETHER_API_KEY;
    delete process.env.LLM_API_URL;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(
        new Response(JSON.stringify({ choices: [{ message: { content: 'Private reply' } }] })),
      );
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  test.each([undefined, 'false', '0'])('does not log content with DEBUG_LLM=%s', async (flag) => {
    if (flag !== undefined) process.env.DEBUG_LLM = flag;

    const result = await chatCompletion({
      messages: [{ role: 'user', content: 'Private prompt' }],
    });

    expect(result.content).toBe('Private reply');
    expect(console.log).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('logs requests and non-streaming replies when explicitly enabled', async () => {
    process.env.DEBUG_LLM = 'true';
    const messages = [{ role: 'user' as const, content: 'Private prompt' }];

    await chatCompletion({ messages });

    expect(console.log).toHaveBeenCalledWith(expect.objectContaining({ messages }));
    expect(console.log).toHaveBeenCalledWith('Private reply');
  });

  test('does not log streaming request content by default', async () => {
    jest
      .mocked(fetch)
      .mockResolvedValue(
        new Response('data: {"choices":[{"delta":{"content":"Streamed reply"}}]}\n\n'),
      );

    const { content } = await chatCompletion({
      messages: [{ role: 'user', content: 'Private prompt' }],
      stream: true,
    });

    expect(await content.readAll()).toBe('Streamed reply');
    expect(console.log).not.toHaveBeenCalled();
  });

  test('keeps error reporting enabled when content logging is disabled', async () => {
    jest.mocked(fetch).mockResolvedValue(new Response('Bad request', { status: 400 }));

    await expect(
      chatCompletion({ messages: [{ role: 'user', content: 'Private prompt' }] }),
    ).rejects.toThrow('Chat completion failed with code 400');

    expect(console.error).toHaveBeenCalledWith({ error: 'Bad request' });
    expect(console.log).not.toHaveBeenCalled();
  });
});

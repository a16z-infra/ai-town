import { asyncMap } from './asyncMap';

describe('asyncMap', () => {
  it('should map over a list asynchronously', async () => {
    const list = [1, 2, 3];
    const result = await asyncMap(list, async (item: number) => item * 2);
    expect(result).toEqual([2, 4, 6]);
  });

  it('should handle empty list input', async () => {
    const list: number[] = [];
    const result = await asyncMap(list, async (item: number) => item * 2);
    expect(result).toEqual([]);
  });
});
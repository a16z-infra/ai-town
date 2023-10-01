import { MinHeap } from './minheap';

describe('MinHeap', () => {
  const compareNumbers = (a: number, b: number): boolean => a > b;

  test('should initialize an empty heap', () => {
    const heap = MinHeap(compareNumbers);
    expect(heap.length()).toBe(0);
    expect(heap.peek()).toBeUndefined();
  });

  test('should insert values correctly and maintain the min property', () => {
    const heap = MinHeap(compareNumbers);
    heap.push(3);
    heap.push(1);
    heap.push(4);
    heap.push(2);

    expect(heap.peek()).toBe(1);
    expect(heap.length()).toBe(4);
  });

  test('should pop values correctly and maintain the min property', () => {
    const heap = MinHeap(compareNumbers);
    heap.push(3);
    heap.push(1);
    heap.push(4);
    heap.push(2);

    expect(heap.pop()).toBe(1);
    expect(heap.length()).toBe(3);
    expect(heap.peek()).toBe(2);

    expect(heap.pop()).toBe(2);
    expect(heap.length()).toBe(2);
    expect(heap.peek()).toBe(3);
  });

  test('should handle popping from an empty heap', () => {
    const heap = MinHeap(compareNumbers);
    expect(heap.pop()).toBeUndefined();
    expect(heap.length()).toBe(0);
    expect(heap.peek()).toBeUndefined();
  });

  test('should handle peeking from an empty heap', () => {
    const heap = MinHeap(compareNumbers);
    expect(heap.peek()).toBeUndefined();
  });

  test('should handle custom comparison functions', () => {
    const compareStringsByLength = (a: string, b: string): boolean => a.length > b.length;
    const heap = MinHeap(compareStringsByLength);
    heap.push('apple');
    heap.push('banana');
    heap.push('cherry');

    expect(heap.peek()).toBe('apple');
    heap.push('kiwi');
    expect(heap.peek()).toBe('kiwi');
  });
});

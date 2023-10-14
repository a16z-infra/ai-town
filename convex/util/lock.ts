export class Lock {
  acquired: boolean = false;
  waiters: (() => void)[] = [];

  async withLock<T>(f: () => Promise<T>): Promise<T> {
    while (true) {
      if (!this.acquired) {
        this.acquired = true;
        break;
      }
      await new Promise<void>((resolve) => {
        this.waiters.push(resolve);
      });
    }
    const result = await f();
    this.acquired = false;
    for (const waiter of this.waiters) {
      waiter();
    }
    this.waiters = [];
    return result;
  }
}

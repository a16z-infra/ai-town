'use node';

import { ConvexClient } from 'convex/browser';
import { DefaultFunctionArgs, FunctionReference } from 'convex/server';
import { sleep } from '../util/sleep';

export type HandlerReturn = undefined | { kind: 'sleepUntil'; when: number } | { kind: 'exit' };

export abstract class SubscriptionLoop<Args extends DefaultFunctionArgs, Value> {
  now: number;

  subscription?: () => void;
  nextValue?: Value;
  waiter?: () => void;

  constructor(
    public client: ConvexClient,
    public readonly deadline: number,
    private query: FunctionReference<'query', 'public', Args & { now: number }, Value>,
    private args: Args,
  ) {
    this.now = Date.now();
  }

  abstract handleValue(value: Value): Promise<HandlerReturn>;

  async run() {
    try {
      while (Date.now() < this.deadline) {
        // Create a subscription if we don't have one.
        if (!this.subscription) {
          // Advance time when creating a new subscription.
          this.now = Date.now();
          this.subscription = this.client.onUpdate(
            this.query,
            { now: this.now, ...this.args },
            (result) => this.setValue(result),
            (error) => {
              console.error('Failed to query next decision', error);
            },
          );
          continue;
        }
        // Wait until the value's ready if it's still loading.
        if (!this.nextValue) {
          await Promise.race([this.waitForNextValue(), sleep(this.deadline - Date.now())]);
          continue;
        }
        // Consume the next value.
        const value = this.nextValue;
        delete this.nextValue;
        const handlerReturn = await this.handleValue(value);
        if (handlerReturn === undefined) {
          continue;
        }
        if (handlerReturn.kind === 'exit') {
          return;
        }
        await this.waitForTimeout(handlerReturn.when);
      }
    } finally {
      if (this.subscription) {
        this.subscription();
        delete this.subscription;
      }
    }
  }

  private async waitForTimeout(timeoutExpired: number) {
    const now = Date.now();
    const valueChanged = this.waitForNextValue();
    const sleepUntil = Math.min(this.deadline, timeoutExpired);

    const why = await Promise.race([
      valueChanged.then(() => Promise.resolve('valueChanged')),
      sleep(sleepUntil - now).then(() => Promise.resolve('sleep')),
    ]);
    // Reset the subscription if we hit a timeout so we advance time.
    if (why == 'sleep' && this.subscription) {
      this.subscription();
      delete this.subscription;
    }
  }

  private setValue(value: Value) {
    if (this.waiter) {
      this.waiter();
      delete this.waiter;
    }
    this.nextValue = value;
  }

  private async waitForNextValue(): Promise<void> {
    return new Promise<void>((resolve) => {
      if (this.nextValue !== undefined) {
        resolve();
        return;
      }
      this.waiter = resolve;
      return;
    });
  }
}

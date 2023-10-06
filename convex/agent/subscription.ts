'use node';

import { ConvexClient } from 'convex/browser';
import { DefaultFunctionArgs, FunctionReference } from 'convex/server';
import { sleep } from '../util/sleep';

export type HandlerReturn = undefined | { kind: 'sleepUntil'; when: number } | { kind: 'exit' };

export abstract class SubscriptionLoop<Args extends DefaultFunctionArgs, Value> {
  now: number;

  subscription?: () => void;
  currentValue?: Value;
  waiter?: () => void;
  version: number = 0;

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
        if (!this.currentValue) {
          await Promise.race([this.waitForValue(), sleep(this.deadline - Date.now())]);
          continue;
        }
        // Process the value.
        const handledVersion = this.version;
        const handlerReturn = await this.handleValue(this.currentValue);
        if (typeof handlerReturn === 'undefined') {
          continue;
        }
        if (handlerReturn.kind === 'exit') {
          return;
        }
        await this.waitForTimeout(handlerReturn.when, handledVersion);
      }
    } finally {
      if (this.subscription) {
        this.subscription();
        delete this.subscription;
      }
    }
  }

  private async waitForTimeout(timeoutExpired: number, expectedVersion: number) {
    const now = Date.now();
    const valueChanged = this.waitForValue(expectedVersion);
    const sleepUntil = Math.min(this.deadline, timeoutExpired);

    let hitTimeout = false;
    if (now < sleepUntil) {
      const sleepFor = sleepUntil - now;
      console.log(`Sleeping for ${sleepFor}ms`);
      const why = await Promise.race([
        valueChanged.then(() => Promise.resolve('valueChanged')),
        sleep(sleepFor).then(() => Promise.resolve('sleep')),
      ]);
      if (why == 'sleep') {
        hitTimeout = true;
      }
    } else {
      hitTimeout = true;
    }
    // Reset the subscription if we hit a timeout so we advance time.
    if (hitTimeout) {
      if (this.subscription) {
        this.subscription();
        delete this.subscription;
      }
    }
  }

  private setValue(value: Value) {
    if (this.waiter) {
      this.waiter();
      delete this.waiter;
    }
    this.currentValue = value;
    this.version += 1;
  }

  private async waitForValue(expectedVersion?: number): Promise<void> {
    return new Promise<void>((resolve) => {
      if (expectedVersion !== undefined && expectedVersion !== this.version) {
        resolve();
        return;
      }
      if (this.currentValue) {
        resolve();
        return;
      }
      this.waiter = resolve;
    });
  }
}

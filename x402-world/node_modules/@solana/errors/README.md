[![npm][npm-image]][npm-url]
[![npm-downloads][npm-downloads-image]][npm-url]
[![semantic-release][semantic-release-image]][semantic-release-url]
<br />
[![code-style-prettier][code-style-prettier-image]][code-style-prettier-url]

[code-style-prettier-image]: https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square
[code-style-prettier-url]: https://github.com/prettier/prettier
[npm-downloads-image]: https://img.shields.io/npm/dm/@solana/errors/rc.svg?style=flat
[npm-image]: https://img.shields.io/npm/v/@solana/errors/rc.svg?style=flat
[npm-url]: https://www.npmjs.com/package/@solana/errors/v/rc
[semantic-release-image]: https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg
[semantic-release-url]: https://github.com/semantic-release/semantic-release

# @solana/errors

This package brings together every error message across all Solana JavaScript modules.

## Reading error messages

### In development mode

When your bundler sets the constant `__DEV__` to `true`, every error message will be included in the bundle. As such, you will be able to read them in plain language wherever they appear.

> [!WARNING]
> The size of your JavaScript bundle will increase significantly with the inclusion of every error message in development mode. Be sure to build your bundle with `__DEV__` set to `false` when you go to production.

### In production mode

When your bundler sets the constant `__DEV__` to `false`, error messages will be stripped from the bundle to save space. Only the error code will appear when an error is encountered. Follow the instructions in the error message to convert the error code back to the human-readable error message.

For instance, to recover the error text for the error with code `123`:

```shell
npx @solana/errors decode -- 123
```

## Adding a new error

1. Add a new exported error code constant to `src/codes.ts`.
2. Add that new constant to the `SolanaErrorCode` union in `src/codes.ts`.
3. If you would like the new error to encapsulate context about the error itself (eg. the public keys for which a transaction is missing signatures) define the shape of that context in `src/context.ts`.
4. Add the error's message to `src/messages.ts`. Any context values that you defined above will be interpolated into the message wherever you write `$key`, where `key` is the index of a value in the context (eg. ``'Missing a signature for account `$address`'``).
5. Publish a new version of `@solana/errors`.
6. Bump the version of `@solana/errors` in the package from which the error is thrown.

## Removing an error message

-   Don't remove errors.
-   Don't change the meaning of an error message.
-   Don't change or reorder error codes.
-   Don't change or remove members of an error's context.

When an older client throws an error, we want to make sure that they can always decode the error. If you make any of the changes above, old clients will, by definition, not have received your changes. This could make the errors that they throw impossible to decode going forward.

## Catching errors

When you catch a `SolanaError` and assert its error code using `isSolanaError()`, TypeScript will refine the error's context to the type associated with that error code. You can use that context to render useful error messages, or to make context-aware decisions that help your application to recover from the error.

```ts
import {
    SOLANA_ERROR__TRANSACTION__MISSING_SIGNATURE,
    SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING,
    isSolanaError,
} from '@solana/errors';
import { assertTransactionIsFullySigned, getSignatureFromTransaction } from '@solana/transactions';

try {
    const transactionSignature = getSignatureFromTransaction(tx);
    assertTransactionIsFullySigned(tx);
    /* ... */
} catch (e) {
    if (isSolanaError(e, SOLANA_ERROR__TRANSACTION__SIGNATURES_MISSING)) {
        displayError(
            "We can't send this transaction without signatures for these addresses:\n- %s",
            // The type of the `context` object is now refined to contain `addresses`.
            e.context.addresses.join('\n- '),
        );
        return;
    } else if (isSolanaError(e, SOLANA_ERROR__TRANSACTION__FEE_PAYER_SIGNATURE_MISSING)) {
        if (!tx.feePayer) {
            displayError('Choose a fee payer for this transaction before sending it');
        } else {
            displayError('The fee payer still needs to sign for this transaction');
        }
        return;
    }
    throw e;
}
```

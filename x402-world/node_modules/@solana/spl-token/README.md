# `@solana/spl-token`

A TypeScript library for interacting with the SPL Token and Token-2022 programs.

> [!IMPORTANT]  
> If you are using [@solana/web3.js version 2](https://github.com/solana-labs/solana-web3.js/?tab=readme-ov-file#whats-new-in-version-20)
> , you should use the `@solana-program/token` and `@solana-program/token-2022` 
> packages instead.

## Links

- [TypeScript Docs](https://solana-labs.github.io/solana-program-library/token/js/)
- [FAQs (Frequently Asked Questions)](#faqs)
- [Install](#install)
- [Build from Source](#build-from-source)

## FAQs

### How can I get support?

Please ask questions in the Solana Stack Exchange: https://solana.stackexchange.com/

If you've found a bug or you'd like to request a feature, please
[open an issue](https://github.com/solana-labs/solana-program-library/issues/new).

### No export named Token

Please see [upgrading from 0.1.x](#upgrading-from-01x).

## Install

```shell
npm install --save @solana/spl-token @solana/web3.js@1
```
_OR_
```shell
yarn add @solana/spl-token @solana/web3.js@1
```

## Build from Source

0. Prerequisites

* Node 16+
* PNPM

If you have Node 16+, you can [activate PNPM with Corepack](https://pnpm.io/installation#using-corepack).

1. Clone the project:
```shell
git clone https://github.com/solana-labs/solana-program-library.git
```

2. Navigate to the root of the repository:
```shell
cd solana-program-library
```

3. Install the dependencies:
```shell
pnpm install
```

4. Build the libraries in the repository:
```shell
pnpm run build
```

5. Navigate to the SPL Token library:
```shell
cd token/js
```

6. Build the on-chain programs:
```shell
pnpm run test:build-programs
```

7. Run the tests:
```shell
pnpm run test
```

8. Run the example:
```shell
pnpm run example
```

## Upgrading

### Upgrading from 0.2.0

There are no breaking changes from 0.2.0, only new functionality for Token-2022.

### Upgrading from 0.1.x

When upgrading from spl-token 0.1.x, you may see the following error in your code:

```
import {TOKEN_PROGRAM_ID, Token, AccountLayout} from '@solana/spl-token';
                          ^^^^^
SyntaxError: The requested module '@solana/spl-token' does not provide an export named 'Token'
```

The `@solana/spl-token` library as of version 0.2.0 does not have the `Token`
class. Instead the actions are split up and exported separately.

To use the old version, install it with:

```
npm install @solana/spl-token@0.1.8
```

Otherwise you can find documentation on how to use new versions on the
[SPL docs](https://spl.solana.com/token) or
[Solana Cookbook](https://solanacookbook.com/references/token.html).

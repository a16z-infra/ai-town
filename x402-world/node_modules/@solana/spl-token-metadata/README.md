# `@solana/spl-token-metadata`

A TypeScript interface describing the instructions required for a program to implement to be considered a "token-metadata" program for SPL token mints. The interface can be implemented by any program.

## Links

- [TypeScript Docs](https://solana-labs.github.io/solana-program-library/token-metadata/js/)
- [FAQs (Frequently Asked Questions)](#faqs)
- [Install](#install)
- [Build from Source](#build-from-source)

## FAQs

### How can I get support?

Please ask questions in the Solana Stack Exchange: https://solana.stackexchange.com/

If you've found a bug or you'd like to request a feature, please
[open an issue](https://github.com/solana-labs/solana-program-library/issues/new).

## Install

```shell
npm install --save @solana/spl-token-metadata @solana/web3.js
```
_OR_
```shell
yarn add @solana/spl-token-metadata @solana/web3.js
```

## Build from Source

0. Prerequisites

* Node 16+
* NPM 8+

1. Clone the project:
```shell
git clone https://github.com/solana-labs/solana-program-library.git
```

2. Navigate to the library:
```shell
cd solana-program-library/token-metadata/js
```

3. Install the dependencies:
```shell
npm install
```

4. Build the library:
```shell
npm run build
```

5. Build the on-chain programs:
```shell
npm run test:build-programs
```

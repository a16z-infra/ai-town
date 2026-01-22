import type { AccountMeta, Connection } from '@solana/web3.js';
import { TokenTransferHookAccountDataNotFound, TokenTransferHookInvalidSeed } from '../../errors.js';

interface Seed {
    data: Buffer;
    packedLength: number;
}

const DISCRIMINATOR_SPAN = 1;
const LITERAL_LENGTH_SPAN = 1;
const INSTRUCTION_ARG_OFFSET_SPAN = 1;
const INSTRUCTION_ARG_LENGTH_SPAN = 1;
const ACCOUNT_KEY_INDEX_SPAN = 1;
const ACCOUNT_DATA_ACCOUNT_INDEX_SPAN = 1;
const ACCOUNT_DATA_OFFSET_SPAN = 1;
const ACCOUNT_DATA_LENGTH_SPAN = 1;

function unpackSeedLiteral(seeds: Uint8Array): Seed {
    if (seeds.length < 1) {
        throw new TokenTransferHookInvalidSeed();
    }
    const [length, ...rest] = seeds;
    if (rest.length < length) {
        throw new TokenTransferHookInvalidSeed();
    }
    return {
        data: Buffer.from(rest.slice(0, length)),
        packedLength: DISCRIMINATOR_SPAN + LITERAL_LENGTH_SPAN + length,
    };
}

function unpackSeedInstructionArg(seeds: Uint8Array, instructionData: Buffer): Seed {
    if (seeds.length < 2) {
        throw new TokenTransferHookInvalidSeed();
    }
    const [index, length] = seeds;
    if (instructionData.length < length + index) {
        throw new TokenTransferHookInvalidSeed();
    }
    return {
        data: instructionData.subarray(index, index + length),
        packedLength: DISCRIMINATOR_SPAN + INSTRUCTION_ARG_OFFSET_SPAN + INSTRUCTION_ARG_LENGTH_SPAN,
    };
}

function unpackSeedAccountKey(seeds: Uint8Array, previousMetas: AccountMeta[]): Seed {
    if (seeds.length < 1) {
        throw new TokenTransferHookInvalidSeed();
    }
    const [index] = seeds;
    if (previousMetas.length <= index) {
        throw new TokenTransferHookInvalidSeed();
    }
    return {
        data: previousMetas[index].pubkey.toBuffer(),
        packedLength: DISCRIMINATOR_SPAN + ACCOUNT_KEY_INDEX_SPAN,
    };
}

async function unpackSeedAccountData(
    seeds: Uint8Array,
    previousMetas: AccountMeta[],
    connection: Connection,
): Promise<Seed> {
    if (seeds.length < 3) {
        throw new TokenTransferHookInvalidSeed();
    }
    const [accountIndex, dataIndex, length] = seeds;
    if (previousMetas.length <= accountIndex) {
        throw new TokenTransferHookInvalidSeed();
    }
    const accountInfo = await connection.getAccountInfo(previousMetas[accountIndex].pubkey);
    if (accountInfo == null) {
        throw new TokenTransferHookAccountDataNotFound();
    }
    if (accountInfo.data.length < dataIndex + length) {
        throw new TokenTransferHookInvalidSeed();
    }
    return {
        data: accountInfo.data.subarray(dataIndex, dataIndex + length),
        packedLength:
            DISCRIMINATOR_SPAN + ACCOUNT_DATA_ACCOUNT_INDEX_SPAN + ACCOUNT_DATA_OFFSET_SPAN + ACCOUNT_DATA_LENGTH_SPAN,
    };
}

async function unpackFirstSeed(
    seeds: Uint8Array,
    previousMetas: AccountMeta[],
    instructionData: Buffer,
    connection: Connection,
): Promise<Seed | null> {
    const [discriminator, ...rest] = seeds;
    const remaining = new Uint8Array(rest);
    switch (discriminator) {
        case 0:
            return null;
        case 1:
            return unpackSeedLiteral(remaining);
        case 2:
            return unpackSeedInstructionArg(remaining, instructionData);
        case 3:
            return unpackSeedAccountKey(remaining, previousMetas);
        case 4:
            return unpackSeedAccountData(remaining, previousMetas, connection);
        default:
            throw new TokenTransferHookInvalidSeed();
    }
}

export async function unpackSeeds(
    seeds: Uint8Array,
    previousMetas: AccountMeta[],
    instructionData: Buffer,
    connection: Connection,
): Promise<Buffer[]> {
    const unpackedSeeds: Buffer[] = [];
    let i = 0;
    while (i < 32) {
        const seed = await unpackFirstSeed(seeds.slice(i), previousMetas, instructionData, connection);
        if (seed == null) {
            break;
        }
        unpackedSeeds.push(seed.data);
        i += seed.packedLength;
    }
    return unpackedSeeds;
}

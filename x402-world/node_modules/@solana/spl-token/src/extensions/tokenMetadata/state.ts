import type { Commitment, Connection } from '@solana/web3.js';
import type { PublicKey } from '@solana/web3.js';
import type { TokenMetadata } from '@solana/spl-token-metadata';
import { Field, unpack } from '@solana/spl-token-metadata';

import { TOKEN_2022_PROGRAM_ID } from '../../constants.js';
import { ExtensionType, getExtensionData } from '../extensionType.js';
import { getMint } from '../../state/mint.js';

const getNormalizedTokenMetadataField = (field: Field | string): string => {
    if (field === Field.Name || field === 'Name' || field === 'name') {
        return 'name';
    }

    if (field === Field.Symbol || field === 'Symbol' || field === 'symbol') {
        return 'symbol';
    }

    if (field === Field.Uri || field === 'Uri' || field === 'uri') {
        return 'uri';
    }

    return field;
};

export function updateTokenMetadata(current: TokenMetadata, key: Field | string, value: string): TokenMetadata {
    const field = getNormalizedTokenMetadataField(key);

    if (field === 'mint' || field === 'updateAuthority') {
        throw new Error(`Cannot update ${field} via this instruction`);
    }

    // Handle updates to default keys
    if (['name', 'symbol', 'uri'].includes(field)) {
        return {
            ...current,
            [field]: value,
        };
    }

    // Avoid mutating input, make a shallow copy
    const additionalMetadata = [...current.additionalMetadata];

    const i = current.additionalMetadata.findIndex(x => x[0] === field);

    if (i === -1) {
        // Key was not found, add it
        additionalMetadata.push([field, value]);
    } else {
        // Key was found, change value
        additionalMetadata[i] = [field, value];
    }

    return {
        ...current,
        additionalMetadata,
    };
}

/**
 * Retrieve Token Metadata Information
 *
 * @param connection Connection to use
 * @param address    Mint account
 * @param commitment Desired level of commitment for querying the state
 * @param programId  SPL Token program account
 *
 * @return Token Metadata information
 */
export async function getTokenMetadata(
    connection: Connection,
    address: PublicKey,
    commitment?: Commitment,
    programId = TOKEN_2022_PROGRAM_ID,
): Promise<TokenMetadata | null> {
    const mintInfo = await getMint(connection, address, commitment, programId);
    const data = getExtensionData(ExtensionType.TokenMetadata, mintInfo.tlvData);

    if (data === null) {
        return null;
    }

    return unpack(data);
}

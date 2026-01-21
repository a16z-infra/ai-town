import { blob, greedy, seq, struct, u32, u8 } from '@solana/buffer-layout';
import { ExtensionType, getExtensionData } from '../extensionType.js';
import { PublicKey } from '@solana/web3.js';
import { bool, publicKey, u64 } from '@solana/buffer-layout-utils';
import { TokenTransferHookAccountNotFound } from '../../errors.js';
import { unpackSeeds } from './seeds.js';
import { unpackPubkeyData } from './pubkeyData.js';
/** Buffer layout for de/serializing a transfer hook extension */
export const TransferHookLayout = struct([publicKey('authority'), publicKey('programId')]);
export const TRANSFER_HOOK_SIZE = TransferHookLayout.span;
export function getTransferHook(mint) {
    const extensionData = getExtensionData(ExtensionType.TransferHook, mint.tlvData);
    if (extensionData !== null) {
        return TransferHookLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
/** Buffer layout for de/serializing a transfer hook account extension */
export const TransferHookAccountLayout = struct([bool('transferring')]);
export const TRANSFER_HOOK_ACCOUNT_SIZE = TransferHookAccountLayout.span;
export function getTransferHookAccount(account) {
    const extensionData = getExtensionData(ExtensionType.TransferHookAccount, account.tlvData);
    if (extensionData !== null) {
        return TransferHookAccountLayout.decode(extensionData);
    }
    else {
        return null;
    }
}
export function getExtraAccountMetaAddress(mint, programId) {
    const seeds = [Buffer.from('extra-account-metas'), mint.toBuffer()];
    return PublicKey.findProgramAddressSync(seeds, programId)[0];
}
/** Buffer layout for de/serializing an ExtraAccountMeta */
export const ExtraAccountMetaLayout = struct([
    u8('discriminator'),
    blob(32, 'addressConfig'),
    bool('isSigner'),
    bool('isWritable'),
]);
/** Buffer layout for de/serializing a list of ExtraAccountMeta prefixed by a u32 length */
export const ExtraAccountMetaListLayout = struct([
    u32('count'),
    seq(ExtraAccountMetaLayout, greedy(ExtraAccountMetaLayout.span), 'extraAccounts'),
]);
/** Buffer layout for de/serializing an ExtraAccountMetaAccountData */
export const ExtraAccountMetaAccountDataLayout = struct([
    u64('instructionDiscriminator'),
    u32('length'),
    ExtraAccountMetaListLayout.replicate('extraAccountsList'),
]);
/** Unpack an extra account metas account and parse the data into a list of ExtraAccountMetas */
export function getExtraAccountMetas(account) {
    const extraAccountsList = ExtraAccountMetaAccountDataLayout.decode(account.data).extraAccountsList;
    return extraAccountsList.extraAccounts.slice(0, extraAccountsList.count);
}
/** Take an ExtraAccountMeta and construct that into an actual AccountMeta */
export async function resolveExtraAccountMeta(connection, extraMeta, previousMetas, instructionData, transferHookProgramId) {
    if (extraMeta.discriminator === 0) {
        return {
            pubkey: new PublicKey(extraMeta.addressConfig),
            isSigner: extraMeta.isSigner,
            isWritable: extraMeta.isWritable,
        };
    }
    else if (extraMeta.discriminator === 2) {
        const pubkey = await unpackPubkeyData(extraMeta.addressConfig, previousMetas, instructionData, connection);
        return {
            pubkey,
            isSigner: extraMeta.isSigner,
            isWritable: extraMeta.isWritable,
        };
    }
    let programId = PublicKey.default;
    if (extraMeta.discriminator === 1) {
        programId = transferHookProgramId;
    }
    else {
        const accountIndex = extraMeta.discriminator - (1 << 7);
        if (previousMetas.length <= accountIndex) {
            throw new TokenTransferHookAccountNotFound();
        }
        programId = previousMetas[accountIndex].pubkey;
    }
    const seeds = await unpackSeeds(extraMeta.addressConfig, previousMetas, instructionData, connection);
    const pubkey = PublicKey.findProgramAddressSync(seeds, programId)[0];
    return { pubkey, isSigner: extraMeta.isSigner, isWritable: extraMeta.isWritable };
}
//# sourceMappingURL=state.js.map
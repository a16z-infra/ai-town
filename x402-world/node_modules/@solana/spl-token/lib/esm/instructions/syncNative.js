import { struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const syncNativeInstructionData = struct([u8('instruction')]);
/**
 * Construct a SyncNative instruction
 *
 * @param account   Native account to sync lamports from
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createSyncNativeInstruction(account, programId = TOKEN_PROGRAM_ID) {
    const keys = [{ pubkey: account, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(syncNativeInstructionData.span);
    syncNativeInstructionData.encode({ instruction: TokenInstruction.SyncNative }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a SyncNative instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeSyncNativeInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== syncNativeInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account }, data, } = decodeSyncNativeInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.SyncNative)
        throw new TokenInvalidInstructionTypeError();
    if (!account)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
        },
        data,
    };
}
/**
 * Decode a SyncNative instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeSyncNativeInstructionUnchecked({ programId, keys: [account], data, }) {
    return {
        programId,
        keys: {
            account,
        },
        data: syncNativeInstructionData.decode(data),
    };
}
//# sourceMappingURL=syncNative.js.map
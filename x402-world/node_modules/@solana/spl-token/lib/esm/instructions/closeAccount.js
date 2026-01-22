import { struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { addSigners } from './internal.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const closeAccountInstructionData = struct([u8('instruction')]);
/**
 * Construct a CloseAccount instruction
 *
 * @param account      Account to close
 * @param destination  Account to receive the remaining balance of the closed account
 * @param authority    Account close authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createCloseAccountInstruction(account, destination, authority, multiSigners = [], programId = TOKEN_PROGRAM_ID) {
    const keys = addSigners([
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
    ], authority, multiSigners);
    const data = Buffer.alloc(closeAccountInstructionData.span);
    closeAccountInstructionData.encode({ instruction: TokenInstruction.CloseAccount }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a CloseAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeCloseAccountInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== closeAccountInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account, destination, authority, multiSigners }, data, } = decodeCloseAccountInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.CloseAccount)
        throw new TokenInvalidInstructionTypeError();
    if (!account || !destination || !authority)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            destination,
            authority,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode a CloseAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeCloseAccountInstructionUnchecked({ programId, keys: [account, destination, authority, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            account,
            destination,
            authority,
            multiSigners,
        },
        data: closeAccountInstructionData.decode(data),
    };
}
//# sourceMappingURL=closeAccount.js.map
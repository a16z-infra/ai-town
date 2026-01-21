import { struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { addSigners } from './internal.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const thawAccountInstructionData = struct([u8('instruction')]);
/**
 * Construct a ThawAccount instruction
 *
 * @param account      Account to thaw
 * @param mint         Mint account
 * @param authority    Mint freeze authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createThawAccountInstruction(account, mint, authority, multiSigners = [], programId = TOKEN_PROGRAM_ID) {
    const keys = addSigners([
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
    ], authority, multiSigners);
    const data = Buffer.alloc(thawAccountInstructionData.span);
    thawAccountInstructionData.encode({ instruction: TokenInstruction.ThawAccount }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a ThawAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeThawAccountInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== thawAccountInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account, mint, authority, multiSigners }, data, } = decodeThawAccountInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.ThawAccount)
        throw new TokenInvalidInstructionTypeError();
    if (!account || !mint || !authority)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            mint,
            authority,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode a ThawAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeThawAccountInstructionUnchecked({ programId, keys: [account, mint, authority, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            account,
            mint,
            authority,
            multiSigners,
        },
        data: thawAccountInstructionData.decode(data),
    };
}
//# sourceMappingURL=thawAccount.js.map
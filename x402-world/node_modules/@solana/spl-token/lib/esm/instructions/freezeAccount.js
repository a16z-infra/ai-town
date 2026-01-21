import { struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { addSigners } from './internal.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const freezeAccountInstructionData = struct([u8('instruction')]);
/**
 * Construct a FreezeAccount instruction
 *
 * @param account      Account to freeze
 * @param mint         Mint account
 * @param authority    Mint freeze authority
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createFreezeAccountInstruction(account, mint, authority, multiSigners = [], programId = TOKEN_PROGRAM_ID) {
    const keys = addSigners([
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
    ], authority, multiSigners);
    const data = Buffer.alloc(freezeAccountInstructionData.span);
    freezeAccountInstructionData.encode({ instruction: TokenInstruction.FreezeAccount }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a FreezeAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeFreezeAccountInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== freezeAccountInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account, mint, authority, multiSigners }, data, } = decodeFreezeAccountInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.FreezeAccount)
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
 * Decode a FreezeAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeFreezeAccountInstructionUnchecked({ programId, keys: [account, mint, authority, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            account,
            mint,
            authority,
            multiSigners,
        },
        data: freezeAccountInstructionData.decode(data),
    };
}
//# sourceMappingURL=freezeAccount.js.map
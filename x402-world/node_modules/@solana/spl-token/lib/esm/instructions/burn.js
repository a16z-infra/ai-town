import { struct, u8 } from '@solana/buffer-layout';
import { u64 } from '@solana/buffer-layout-utils';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { addSigners } from './internal.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const burnInstructionData = struct([u8('instruction'), u64('amount')]);
/**
 * Construct a Burn instruction
 *
 * @param account      Account to burn tokens from
 * @param mint         Mint for the account
 * @param owner        Owner of the account
 * @param amount       Number of tokens to burn
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createBurnInstruction(account, mint, owner, amount, multiSigners = [], programId = TOKEN_PROGRAM_ID) {
    const keys = addSigners([
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: true },
    ], owner, multiSigners);
    const data = Buffer.alloc(burnInstructionData.span);
    burnInstructionData.encode({
        instruction: TokenInstruction.Burn,
        amount: BigInt(amount),
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a Burn instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeBurnInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== burnInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account, mint, owner, multiSigners }, data, } = decodeBurnInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.Burn)
        throw new TokenInvalidInstructionTypeError();
    if (!account || !mint || !owner)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            mint,
            owner,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode a Burn instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeBurnInstructionUnchecked({ programId, keys: [account, mint, owner, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            account,
            mint,
            owner,
            multiSigners,
        },
        data: burnInstructionData.decode(data),
    };
}
//# sourceMappingURL=burn.js.map
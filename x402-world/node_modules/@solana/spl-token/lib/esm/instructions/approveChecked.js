import { struct, u8 } from '@solana/buffer-layout';
import { u64 } from '@solana/buffer-layout-utils';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { addSigners } from './internal.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const approveCheckedInstructionData = struct([
    u8('instruction'),
    u64('amount'),
    u8('decimals'),
]);
/**
 * Construct an ApproveChecked instruction
 *
 * @param account      Account to set the delegate for
 * @param mint         Mint account
 * @param delegate     Account authorized to transfer of tokens from the account
 * @param owner        Owner of the account
 * @param amount       Maximum number of tokens the delegate may transfer
 * @param decimals     Number of decimals in approve amount
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createApproveCheckedInstruction(account, mint, delegate, owner, amount, decimals, multiSigners = [], programId = TOKEN_PROGRAM_ID) {
    const keys = addSigners([
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: delegate, isSigner: false, isWritable: false },
    ], owner, multiSigners);
    const data = Buffer.alloc(approveCheckedInstructionData.span);
    approveCheckedInstructionData.encode({
        instruction: TokenInstruction.ApproveChecked,
        amount: BigInt(amount),
        decimals,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an ApproveChecked instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeApproveCheckedInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== approveCheckedInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account, mint, delegate, owner, multiSigners }, data, } = decodeApproveCheckedInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.ApproveChecked)
        throw new TokenInvalidInstructionTypeError();
    if (!account || !mint || !delegate || !owner)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            mint,
            delegate,
            owner,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode an ApproveChecked instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeApproveCheckedInstructionUnchecked({ programId, keys: [account, mint, delegate, owner, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            account,
            mint,
            delegate,
            owner,
            multiSigners,
        },
        data: approveCheckedInstructionData.decode(data),
    };
}
//# sourceMappingURL=approveChecked.js.map
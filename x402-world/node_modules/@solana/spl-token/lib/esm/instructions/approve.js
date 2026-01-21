import { struct, u8 } from '@solana/buffer-layout';
import { u64 } from '@solana/buffer-layout-utils';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { addSigners } from './internal.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const approveInstructionData = struct([u8('instruction'), u64('amount')]);
/**
 * Construct an Approve instruction
 *
 * @param account      Account to set the delegate for
 * @param delegate     Account authorized to transfer tokens from the account
 * @param owner        Owner of the account
 * @param amount       Maximum number of tokens the delegate may transfer
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createApproveInstruction(account, delegate, owner, amount, multiSigners = [], programId = TOKEN_PROGRAM_ID) {
    const keys = addSigners([
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: delegate, isSigner: false, isWritable: false },
    ], owner, multiSigners);
    const data = Buffer.alloc(approveInstructionData.span);
    approveInstructionData.encode({
        instruction: TokenInstruction.Approve,
        amount: BigInt(amount),
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an Approve instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeApproveInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== approveInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account, delegate, owner, multiSigners }, data, } = decodeApproveInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.Approve)
        throw new TokenInvalidInstructionTypeError();
    if (!account || !delegate || !owner)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            delegate,
            owner,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode an Approve instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeApproveInstructionUnchecked({ programId, keys: [account, delegate, owner, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            account,
            delegate,
            owner,
            multiSigners,
        },
        data: approveInstructionData.decode(data),
    };
}
//# sourceMappingURL=approve.js.map
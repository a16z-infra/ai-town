import { struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { addSigners } from './internal.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const revokeInstructionData = struct([u8('instruction')]);
/**
 * Construct a Revoke instruction
 *
 * @param account      Address of the token account
 * @param owner        Owner of the account
 * @param multiSigners Signing accounts if `owner` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createRevokeInstruction(account, owner, multiSigners = [], programId = TOKEN_PROGRAM_ID) {
    const keys = addSigners([{ pubkey: account, isSigner: false, isWritable: true }], owner, multiSigners);
    const data = Buffer.alloc(revokeInstructionData.span);
    revokeInstructionData.encode({ instruction: TokenInstruction.Revoke }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a Revoke instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeRevokeInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== revokeInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account, owner, multiSigners }, data, } = decodeRevokeInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.Revoke)
        throw new TokenInvalidInstructionTypeError();
    if (!account || !owner)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            owner,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode a Revoke instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeRevokeInstructionUnchecked({ programId, keys: [account, owner, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            account,
            owner,
            multiSigners,
        },
        data: revokeInstructionData.decode(data),
    };
}
//# sourceMappingURL=revoke.js.map
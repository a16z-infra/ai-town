import { struct, u8 } from '@solana/buffer-layout';
import { SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const initializeAccountInstructionData = struct([u8('instruction')]);
/**
 * Construct an InitializeAccount instruction
 *
 * @param account   New token account
 * @param mint      Mint account
 * @param owner     Owner of the new account
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeAccountInstruction(account, mint, owner, programId = TOKEN_PROGRAM_ID) {
    const keys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: mint, isSigner: false, isWritable: false },
        { pubkey: owner, isSigner: false, isWritable: false },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];
    const data = Buffer.alloc(initializeAccountInstructionData.span);
    initializeAccountInstructionData.encode({ instruction: TokenInstruction.InitializeAccount }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an InitializeAccount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeInitializeAccountInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== initializeAccountInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account, mint, owner, rent }, data, } = decodeInitializeAccountInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.InitializeAccount)
        throw new TokenInvalidInstructionTypeError();
    if (!account || !mint || !owner || !rent)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            mint,
            owner,
            rent,
        },
        data,
    };
}
/**
 * Decode an InitializeAccount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeInitializeAccountInstructionUnchecked({ programId, keys: [account, mint, owner, rent], data, }) {
    return {
        programId,
        keys: {
            account,
            mint,
            owner,
            rent,
        },
        data: initializeAccountInstructionData.decode(data),
    };
}
//# sourceMappingURL=initializeAccount.js.map
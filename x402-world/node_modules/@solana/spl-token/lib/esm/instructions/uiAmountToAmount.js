import { blob, struct, u8 } from '@solana/buffer-layout';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
/**
 * Construct a UiAmountToAmount instruction
 *
 * @param mint         Public key of the mint
 * @param amount       UiAmount of tokens to be converted to Amount
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createUiAmountToAmountInstruction(mint, amount, programId = TOKEN_PROGRAM_ID) {
    const keys = [{ pubkey: mint, isSigner: false, isWritable: false }];
    const buf = Buffer.from(amount, 'utf8');
    const uiAmountToAmountInstructionData = struct([
        u8('instruction'),
        blob(buf.length, 'amount'),
    ]);
    const data = Buffer.alloc(uiAmountToAmountInstructionData.span);
    uiAmountToAmountInstructionData.encode({
        instruction: TokenInstruction.UiAmountToAmount,
        amount: buf,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a UiAmountToAmount instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeUiAmountToAmountInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    const uiAmountToAmountInstructionData = struct([
        u8('instruction'),
        blob(instruction.data.length - 1, 'amount'),
    ]);
    if (instruction.data.length !== uiAmountToAmountInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { mint }, data, } = decodeUiAmountToAmountInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.UiAmountToAmount)
        throw new TokenInvalidInstructionTypeError();
    if (!mint)
        throw new TokenInvalidInstructionKeysError();
    return {
        programId,
        keys: {
            mint,
        },
        data,
    };
}
/**
 * Decode a UiAmountToAmount instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeUiAmountToAmountInstructionUnchecked({ programId, keys: [mint], data, }) {
    const uiAmountToAmountInstructionData = struct([
        u8('instruction'),
        blob(data.length - 1, 'amount'),
    ]);
    return {
        programId,
        keys: {
            mint,
        },
        data: uiAmountToAmountInstructionData.decode(data),
    };
}
//# sourceMappingURL=uiAmountToAmount.js.map
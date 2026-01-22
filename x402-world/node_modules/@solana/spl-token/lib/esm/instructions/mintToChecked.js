import { struct, u8 } from '@solana/buffer-layout';
import { u64 } from '@solana/buffer-layout-utils';
import { TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { addSigners } from './internal.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const mintToCheckedInstructionData = struct([
    u8('instruction'),
    u64('amount'),
    u8('decimals'),
]);
/**
 * Construct a MintToChecked instruction
 *
 * @param mint         Public key of the mint
 * @param destination  Address of the token account to mint to
 * @param authority    The mint authority
 * @param amount       Amount to mint
 * @param decimals     Number of decimals in amount to mint
 * @param multiSigners Signing accounts if `authority` is a multisig
 * @param programId    SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createMintToCheckedInstruction(mint, destination, authority, amount, decimals, multiSigners = [], programId = TOKEN_PROGRAM_ID) {
    const keys = addSigners([
        { pubkey: mint, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
    ], authority, multiSigners);
    const data = Buffer.alloc(mintToCheckedInstructionData.span);
    mintToCheckedInstructionData.encode({
        instruction: TokenInstruction.MintToChecked,
        amount: BigInt(amount),
        decimals,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode a MintToChecked instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeMintToCheckedInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== mintToCheckedInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { mint, destination, authority, multiSigners }, data, } = decodeMintToCheckedInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.MintToChecked)
        throw new TokenInvalidInstructionTypeError();
    if (!mint || !destination || !authority)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            mint,
            destination,
            authority,
            multiSigners,
        },
        data,
    };
}
/**
 * Decode a MintToChecked instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeMintToCheckedInstructionUnchecked({ programId, keys: [mint, destination, authority, ...multiSigners], data, }) {
    return {
        programId,
        keys: {
            mint,
            destination,
            authority,
            multiSigners,
        },
        data: mintToCheckedInstructionData.decode(data),
    };
}
//# sourceMappingURL=mintToChecked.js.map
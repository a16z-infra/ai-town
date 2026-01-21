import { struct, u8 } from '@solana/buffer-layout';
import { PublicKey, SYSVAR_RENT_PUBKEY, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionKeysError, TokenInvalidInstructionProgramError, TokenInvalidInstructionTypeError, } from '../errors.js';
import { TokenInstruction } from './types.js';
/** TODO: docs */
export const initializeMultisigInstructionData = struct([
    u8('instruction'),
    u8('m'),
]);
/**
 * Construct an InitializeMultisig instruction
 *
 * @param account   Multisig account
 * @param signers   Full set of signers
 * @param m         Number of required signatures
 * @param programId SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeMultisigInstruction(account, signers, m, programId = TOKEN_PROGRAM_ID) {
    const keys = [
        { pubkey: account, isSigner: false, isWritable: true },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ];
    for (const signer of signers) {
        keys.push({
            pubkey: signer instanceof PublicKey ? signer : signer.publicKey,
            isSigner: false,
            isWritable: false,
        });
    }
    const data = Buffer.alloc(initializeMultisigInstructionData.span);
    initializeMultisigInstructionData.encode({
        instruction: TokenInstruction.InitializeMultisig,
        m,
    }, data);
    return new TransactionInstruction({ keys, programId, data });
}
/**
 * Decode an InitializeMultisig instruction and validate it
 *
 * @param instruction Transaction instruction to decode
 * @param programId   SPL Token program account
 *
 * @return Decoded, valid instruction
 */
export function decodeInitializeMultisigInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.programId.equals(programId))
        throw new TokenInvalidInstructionProgramError();
    if (instruction.data.length !== initializeMultisigInstructionData.span)
        throw new TokenInvalidInstructionDataError();
    const { keys: { account, rent, signers }, data, } = decodeInitializeMultisigInstructionUnchecked(instruction);
    if (data.instruction !== TokenInstruction.InitializeMultisig)
        throw new TokenInvalidInstructionTypeError();
    if (!account || !rent || !signers.length)
        throw new TokenInvalidInstructionKeysError();
    // TODO: key checks?
    return {
        programId,
        keys: {
            account,
            rent,
            signers,
        },
        data,
    };
}
/**
 * Decode an InitializeMultisig instruction without validating it
 *
 * @param instruction Transaction instruction to decode
 *
 * @return Decoded, non-validated instruction
 */
export function decodeInitializeMultisigInstructionUnchecked({ programId, keys: [account, rent, ...signers], data, }) {
    return {
        programId,
        keys: {
            account,
            rent,
            signers,
        },
        data: initializeMultisigInstructionData.decode(data),
    };
}
//# sourceMappingURL=initializeMultisig.js.map
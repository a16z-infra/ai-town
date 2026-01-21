import { struct, u8 } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, programSupportsExtensions } from '../../constants.js';
import { TokenUnsupportedInstructionError } from '../../errors.js';
import { TokenInstruction } from '../../instructions/types.js';
import { addSigners } from '../../instructions/internal.js';
export var MetadataPointerInstruction;
(function (MetadataPointerInstruction) {
    MetadataPointerInstruction[MetadataPointerInstruction["Initialize"] = 0] = "Initialize";
    MetadataPointerInstruction[MetadataPointerInstruction["Update"] = 1] = "Update";
})(MetadataPointerInstruction || (MetadataPointerInstruction = {}));
export const initializeMetadataPointerData = struct([
    // prettier-ignore
    u8('instruction'),
    u8('metadataPointerInstruction'),
    publicKey('authority'),
    publicKey('metadataAddress'),
]);
/**
 * Construct an Initialize MetadataPointer instruction
 *
 * @param mint            Token mint account
 * @param authority       Optional Authority that can set the metadata address
 * @param metadataAddress Optional Account address that holds the metadata
 * @param programId       SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
export function createInitializeMetadataPointerInstruction(mint, authority, metadataAddress, programId) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(initializeMetadataPointerData.span);
    initializeMetadataPointerData.encode({
        instruction: TokenInstruction.MetadataPointerExtension,
        metadataPointerInstruction: MetadataPointerInstruction.Initialize,
        authority: authority ?? PublicKey.default,
        metadataAddress: metadataAddress ?? PublicKey.default,
    }, data);
    return new TransactionInstruction({ keys, programId, data: data });
}
export const updateMetadataPointerData = struct([
    // prettier-ignore
    u8('instruction'),
    u8('metadataPointerInstruction'),
    publicKey('metadataAddress'),
]);
export function createUpdateMetadataPointerInstruction(mint, authority, metadataAddress, multiSigners = [], programId = TOKEN_2022_PROGRAM_ID) {
    if (!programSupportsExtensions(programId)) {
        throw new TokenUnsupportedInstructionError();
    }
    const keys = addSigners([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(updateMetadataPointerData.span);
    updateMetadataPointerData.encode({
        instruction: TokenInstruction.MetadataPointerExtension,
        metadataPointerInstruction: MetadataPointerInstruction.Update,
        metadataAddress: metadataAddress ?? PublicKey.default,
    }, data);
    return new TransactionInstruction({ keys, programId, data: data });
}
//# sourceMappingURL=instructions.js.map
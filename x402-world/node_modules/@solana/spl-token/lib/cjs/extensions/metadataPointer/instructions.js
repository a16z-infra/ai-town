"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMetadataPointerData = exports.initializeMetadataPointerData = exports.MetadataPointerInstruction = void 0;
exports.createInitializeMetadataPointerInstruction = createInitializeMetadataPointerInstruction;
exports.createUpdateMetadataPointerInstruction = createUpdateMetadataPointerInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../../constants.js");
const errors_js_1 = require("../../errors.js");
const types_js_1 = require("../../instructions/types.js");
const internal_js_1 = require("../../instructions/internal.js");
var MetadataPointerInstruction;
(function (MetadataPointerInstruction) {
    MetadataPointerInstruction[MetadataPointerInstruction["Initialize"] = 0] = "Initialize";
    MetadataPointerInstruction[MetadataPointerInstruction["Update"] = 1] = "Update";
})(MetadataPointerInstruction || (exports.MetadataPointerInstruction = MetadataPointerInstruction = {}));
exports.initializeMetadataPointerData = (0, buffer_layout_1.struct)([
    // prettier-ignore
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('metadataPointerInstruction'),
    (0, buffer_layout_utils_1.publicKey)('authority'),
    (0, buffer_layout_utils_1.publicKey)('metadataAddress'),
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
function createInitializeMetadataPointerInstruction(mint, authority, metadataAddress, programId) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.initializeMetadataPointerData.span);
    exports.initializeMetadataPointerData.encode({
        instruction: types_js_1.TokenInstruction.MetadataPointerExtension,
        metadataPointerInstruction: MetadataPointerInstruction.Initialize,
        authority: authority !== null && authority !== void 0 ? authority : web3_js_1.PublicKey.default,
        metadataAddress: metadataAddress !== null && metadataAddress !== void 0 ? metadataAddress : web3_js_1.PublicKey.default,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data: data });
}
exports.updateMetadataPointerData = (0, buffer_layout_1.struct)([
    // prettier-ignore
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('metadataPointerInstruction'),
    (0, buffer_layout_utils_1.publicKey)('metadataAddress'),
]);
function createUpdateMetadataPointerInstruction(mint, authority, metadataAddress, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = (0, internal_js_1.addSigners)([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(exports.updateMetadataPointerData.span);
    exports.updateMetadataPointerData.encode({
        instruction: types_js_1.TokenInstruction.MetadataPointerExtension,
        metadataPointerInstruction: MetadataPointerInstruction.Update,
        metadataAddress: metadataAddress !== null && metadataAddress !== void 0 ? metadataAddress : web3_js_1.PublicKey.default,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data: data });
}
//# sourceMappingURL=instructions.js.map
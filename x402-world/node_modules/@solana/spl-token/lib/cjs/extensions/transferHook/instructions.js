"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTransferHookInstructionData = exports.initializeTransferHookInstructionData = exports.TransferHookInstruction = void 0;
exports.createInitializeTransferHookInstruction = createInitializeTransferHookInstruction;
exports.createUpdateTransferHookInstruction = createUpdateTransferHookInstruction;
exports.createExecuteInstruction = createExecuteInstruction;
exports.addExtraAccountMetasForExecute = addExtraAccountMetasForExecute;
exports.createTransferCheckedWithTransferHookInstruction = createTransferCheckedWithTransferHookInstruction;
exports.createTransferCheckedWithFeeAndTransferHookInstruction = createTransferCheckedWithFeeAndTransferHookInstruction;
const buffer_layout_1 = require("@solana/buffer-layout");
const web3_js_1 = require("@solana/web3.js");
const constants_js_1 = require("../../constants.js");
const errors_js_1 = require("../../errors.js");
const internal_js_1 = require("../../instructions/internal.js");
const types_js_1 = require("../../instructions/types.js");
const buffer_layout_utils_1 = require("@solana/buffer-layout-utils");
const transferChecked_js_1 = require("../../instructions/transferChecked.js");
const instructions_js_1 = require("../transferFee/instructions.js");
const mint_js_1 = require("../../state/mint.js");
const state_js_1 = require("./state.js");
var TransferHookInstruction;
(function (TransferHookInstruction) {
    TransferHookInstruction[TransferHookInstruction["Initialize"] = 0] = "Initialize";
    TransferHookInstruction[TransferHookInstruction["Update"] = 1] = "Update";
})(TransferHookInstruction || (exports.TransferHookInstruction = TransferHookInstruction = {}));
/** The struct that represents the instruction data as it is read by the program */
exports.initializeTransferHookInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('transferHookInstruction'),
    (0, buffer_layout_utils_1.publicKey)('authority'),
    (0, buffer_layout_utils_1.publicKey)('transferHookProgramId'),
]);
/**
 * Construct an InitializeTransferHook instruction
 *
 * @param mint                  Token mint account
 * @param authority             Transfer hook authority account
 * @param transferHookProgramId Transfer hook program account
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createInitializeTransferHookInstruction(mint, authority, transferHookProgramId, programId) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = [{ pubkey: mint, isSigner: false, isWritable: true }];
    const data = Buffer.alloc(exports.initializeTransferHookInstructionData.span);
    exports.initializeTransferHookInstructionData.encode({
        instruction: types_js_1.TokenInstruction.TransferHookExtension,
        transferHookInstruction: TransferHookInstruction.Initialize,
        authority,
        transferHookProgramId,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/** The struct that represents the instruction data as it is read by the program */
exports.updateTransferHookInstructionData = (0, buffer_layout_1.struct)([
    (0, buffer_layout_1.u8)('instruction'),
    (0, buffer_layout_1.u8)('transferHookInstruction'),
    (0, buffer_layout_utils_1.publicKey)('transferHookProgramId'),
]);
/**
 * Construct an UpdateTransferHook instruction
 *
 * @param mint                  Mint to update
 * @param authority             The mint's transfer hook authority
 * @param transferHookProgramId The new transfer hook program account
 * @param signers               The signer account(s) for a multisig
 * @param tokenProgramId        SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createUpdateTransferHookInstruction(mint, authority, transferHookProgramId, multiSigners = [], programId = constants_js_1.TOKEN_2022_PROGRAM_ID) {
    if (!(0, constants_js_1.programSupportsExtensions)(programId)) {
        throw new errors_js_1.TokenUnsupportedInstructionError();
    }
    const keys = (0, internal_js_1.addSigners)([{ pubkey: mint, isSigner: false, isWritable: true }], authority, multiSigners);
    const data = Buffer.alloc(exports.updateTransferHookInstructionData.span);
    exports.updateTransferHookInstructionData.encode({
        instruction: types_js_1.TokenInstruction.TransferHookExtension,
        transferHookInstruction: TransferHookInstruction.Update,
        transferHookProgramId,
    }, data);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
function deEscalateAccountMeta(accountMeta, accountMetas) {
    const maybeHighestPrivileges = accountMetas
        .filter(x => x.pubkey.equals(accountMeta.pubkey))
        .reduce((acc, x) => {
        if (!acc)
            return { isSigner: x.isSigner, isWritable: x.isWritable };
        return { isSigner: acc.isSigner || x.isSigner, isWritable: acc.isWritable || x.isWritable };
    }, undefined);
    if (maybeHighestPrivileges) {
        const { isSigner, isWritable } = maybeHighestPrivileges;
        if (!isSigner && isSigner !== accountMeta.isSigner) {
            accountMeta.isSigner = false;
        }
        if (!isWritable && isWritable !== accountMeta.isWritable) {
            accountMeta.isWritable = false;
        }
    }
    return accountMeta;
}
/**
 * Construct an `ExecuteInstruction` for a transfer hook program, without the
 * additional accounts
 *
 * @param programId             The program ID of the transfer hook program
 * @param source                The source account
 * @param mint                  The mint account
 * @param destination           The destination account
 * @param owner                 Owner of the source account
 * @param validateStatePubkey   The validate state pubkey
 * @param amount                The amount of tokens to transfer
 * @returns Instruction to add to a transaction
 */
function createExecuteInstruction(programId, source, mint, destination, owner, validateStatePubkey, amount) {
    const keys = [source, mint, destination, owner, validateStatePubkey].map(pubkey => ({
        pubkey,
        isSigner: false,
        isWritable: false,
    }));
    const data = Buffer.alloc(16);
    data.set(Buffer.from([105, 37, 101, 197, 75, 251, 102, 26]), 0); // `ExecuteInstruction` discriminator
    data.writeBigUInt64LE(BigInt(amount), 8);
    return new web3_js_1.TransactionInstruction({ keys, programId, data });
}
/**
 * Adds all the extra accounts needed for a transfer hook to an instruction.
 *
 * Note this will modify the instruction passed in.
 *
 * @param connection            Connection to use
 * @param instruction           The instruction to add accounts to
 * @param programId             Transfer hook program ID
 * @param source                The source account
 * @param mint                  The mint account
 * @param destination           The destination account
 * @param owner                 Owner of the source account
 * @param amount                The amount of tokens to transfer
 * @param commitment            Commitment to use
 */
function addExtraAccountMetasForExecute(connection, instruction, programId, source, mint, destination, owner, amount, commitment) {
    return __awaiter(this, void 0, void 0, function* () {
        const validateStatePubkey = (0, state_js_1.getExtraAccountMetaAddress)(mint, programId);
        const validateStateAccount = yield connection.getAccountInfo(validateStatePubkey, commitment);
        if (validateStateAccount == null) {
            return instruction;
        }
        const validateStateData = (0, state_js_1.getExtraAccountMetas)(validateStateAccount);
        // Check to make sure the provided keys are in the instruction
        if (![source, mint, destination, owner].every(key => instruction.keys.some(meta => meta.pubkey.equals(key)))) {
            throw new Error('Missing required account in instruction');
        }
        const executeInstruction = createExecuteInstruction(programId, source, mint, destination, owner, validateStatePubkey, BigInt(amount));
        for (const extraAccountMeta of validateStateData) {
            executeInstruction.keys.push(deEscalateAccountMeta(yield (0, state_js_1.resolveExtraAccountMeta)(connection, extraAccountMeta, executeInstruction.keys, executeInstruction.data, executeInstruction.programId), executeInstruction.keys));
        }
        // Add only the extra accounts resolved from the validation state
        instruction.keys.push(...executeInstruction.keys.slice(5));
        // Add the transfer hook program ID and the validation state account
        instruction.keys.push({ pubkey: programId, isSigner: false, isWritable: false });
        instruction.keys.push({ pubkey: validateStatePubkey, isSigner: false, isWritable: false });
    });
}
/**
 * Construct an transferChecked instruction with extra accounts for transfer hook
 *
 * @param connection            Connection to use
 * @param source                Source account
 * @param mint                  Mint to update
 * @param destination           Destination account
 * @param owner                 Owner of the source account
 * @param amount                The amount of tokens to transfer
 * @param decimals              Number of decimals in transfer amount
 * @param multiSigners          The signer account(s) for a multisig
 * @param commitment            Commitment to use
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createTransferCheckedWithTransferHookInstruction(connection_1, source_1, mint_1, destination_1, owner_1, amount_1, decimals_1) {
    return __awaiter(this, arguments, void 0, function* (connection, source, mint, destination, owner, amount, decimals, multiSigners = [], commitment, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const instruction = (0, transferChecked_js_1.createTransferCheckedInstruction)(source, mint, destination, owner, amount, decimals, multiSigners, programId);
        const mintInfo = yield (0, mint_js_1.getMint)(connection, mint, commitment, programId);
        const transferHook = (0, state_js_1.getTransferHook)(mintInfo);
        if (transferHook) {
            yield addExtraAccountMetasForExecute(connection, instruction, transferHook.programId, source, mint, destination, owner, amount, commitment);
        }
        return instruction;
    });
}
/**
 * Construct an transferChecked instruction with extra accounts for transfer hook
 *
 * @param connection            Connection to use
 * @param source                Source account
 * @param mint                  Mint to update
 * @param destination           Destination account
 * @param owner                 Owner of the source account
 * @param amount                The amount of tokens to transfer
 * @param decimals              Number of decimals in transfer amount
 * @param fee                   The calculated fee for the transfer fee extension
 * @param multiSigners          The signer account(s) for a multisig
 * @param commitment            Commitment to use
 * @param programId             SPL Token program account
 *
 * @return Instruction to add to a transaction
 */
function createTransferCheckedWithFeeAndTransferHookInstruction(connection_1, source_1, mint_1, destination_1, owner_1, amount_1, decimals_1, fee_1) {
    return __awaiter(this, arguments, void 0, function* (connection, source, mint, destination, owner, amount, decimals, fee, multiSigners = [], commitment, programId = constants_js_1.TOKEN_PROGRAM_ID) {
        const instruction = (0, instructions_js_1.createTransferCheckedWithFeeInstruction)(source, mint, destination, owner, amount, decimals, fee, multiSigners, programId);
        const mintInfo = yield (0, mint_js_1.getMint)(connection, mint, commitment, programId);
        const transferHook = (0, state_js_1.getTransferHook)(mintInfo);
        if (transferHook) {
            yield addExtraAccountMetasForExecute(connection, instruction, transferHook.programId, source, mint, destination, owner, amount, commitment);
        }
        return instruction;
    });
}
//# sourceMappingURL=instructions.js.map
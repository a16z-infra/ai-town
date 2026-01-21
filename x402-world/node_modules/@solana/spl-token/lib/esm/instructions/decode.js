import { u8 } from '@solana/buffer-layout';
import { TOKEN_PROGRAM_ID } from '../constants.js';
import { TokenInvalidInstructionDataError, TokenInvalidInstructionTypeError } from '../errors.js';
import { decodeAmountToUiAmountInstruction } from './amountToUiAmount.js';
import { decodeApproveInstruction } from './approve.js';
import { decodeApproveCheckedInstruction } from './approveChecked.js';
import { decodeBurnInstruction } from './burn.js';
import { decodeBurnCheckedInstruction } from './burnChecked.js';
import { decodeCloseAccountInstruction } from './closeAccount.js';
import { decodeFreezeAccountInstruction } from './freezeAccount.js';
import { decodeInitializeAccountInstruction } from './initializeAccount.js';
import { decodeInitializeAccount2Instruction } from './initializeAccount2.js';
import { decodeInitializeAccount3Instruction } from './initializeAccount3.js';
import { decodeInitializeMintInstruction } from './initializeMint.js';
import { decodeInitializeMint2Instruction } from './initializeMint2.js';
import { decodeInitializeMultisigInstruction } from './initializeMultisig.js';
import { decodeMintToInstruction } from './mintTo.js';
import { decodeMintToCheckedInstruction } from './mintToChecked.js';
import { decodeRevokeInstruction } from './revoke.js';
import { decodeSetAuthorityInstruction } from './setAuthority.js';
import { decodeSyncNativeInstruction } from './syncNative.js';
import { decodeThawAccountInstruction } from './thawAccount.js';
import { decodeTransferInstruction } from './transfer.js';
import { decodeTransferCheckedInstruction } from './transferChecked.js';
import { TokenInstruction } from './types.js';
import { decodeUiAmountToAmountInstruction } from './uiAmountToAmount.js';
/** TODO: docs */
export function decodeInstruction(instruction, programId = TOKEN_PROGRAM_ID) {
    if (!instruction.data.length)
        throw new TokenInvalidInstructionDataError();
    const type = u8().decode(instruction.data);
    if (type === TokenInstruction.InitializeMint)
        return decodeInitializeMintInstruction(instruction, programId);
    if (type === TokenInstruction.InitializeAccount)
        return decodeInitializeAccountInstruction(instruction, programId);
    if (type === TokenInstruction.InitializeMultisig)
        return decodeInitializeMultisigInstruction(instruction, programId);
    if (type === TokenInstruction.Transfer)
        return decodeTransferInstruction(instruction, programId);
    if (type === TokenInstruction.Approve)
        return decodeApproveInstruction(instruction, programId);
    if (type === TokenInstruction.Revoke)
        return decodeRevokeInstruction(instruction, programId);
    if (type === TokenInstruction.SetAuthority)
        return decodeSetAuthorityInstruction(instruction, programId);
    if (type === TokenInstruction.MintTo)
        return decodeMintToInstruction(instruction, programId);
    if (type === TokenInstruction.Burn)
        return decodeBurnInstruction(instruction, programId);
    if (type === TokenInstruction.CloseAccount)
        return decodeCloseAccountInstruction(instruction, programId);
    if (type === TokenInstruction.FreezeAccount)
        return decodeFreezeAccountInstruction(instruction, programId);
    if (type === TokenInstruction.ThawAccount)
        return decodeThawAccountInstruction(instruction, programId);
    if (type === TokenInstruction.TransferChecked)
        return decodeTransferCheckedInstruction(instruction, programId);
    if (type === TokenInstruction.ApproveChecked)
        return decodeApproveCheckedInstruction(instruction, programId);
    if (type === TokenInstruction.MintToChecked)
        return decodeMintToCheckedInstruction(instruction, programId);
    if (type === TokenInstruction.BurnChecked)
        return decodeBurnCheckedInstruction(instruction, programId);
    if (type === TokenInstruction.InitializeAccount2)
        return decodeInitializeAccount2Instruction(instruction, programId);
    if (type === TokenInstruction.SyncNative)
        return decodeSyncNativeInstruction(instruction, programId);
    if (type === TokenInstruction.InitializeAccount3)
        return decodeInitializeAccount3Instruction(instruction, programId);
    if (type === TokenInstruction.InitializeMint2)
        return decodeInitializeMint2Instruction(instruction, programId);
    if (type === TokenInstruction.AmountToUiAmount)
        return decodeAmountToUiAmountInstruction(instruction, programId);
    if (type === TokenInstruction.UiAmountToAmount)
        return decodeUiAmountToAmountInstruction(instruction, programId);
    // TODO: implement
    if (type === TokenInstruction.InitializeMultisig2)
        throw new TokenInvalidInstructionTypeError();
    throw new TokenInvalidInstructionTypeError();
}
/** TODO: docs */
export function isInitializeMintInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.InitializeMint;
}
/** TODO: docs */
export function isInitializeAccountInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.InitializeAccount;
}
/** TODO: docs */
export function isInitializeMultisigInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.InitializeMultisig;
}
/** TODO: docs */
export function isTransferInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.Transfer;
}
/** TODO: docs */
export function isApproveInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.Approve;
}
/** TODO: docs */
export function isRevokeInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.Revoke;
}
/** TODO: docs */
export function isSetAuthorityInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.SetAuthority;
}
/** TODO: docs */
export function isMintToInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.MintTo;
}
/** TODO: docs */
export function isBurnInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.Burn;
}
/** TODO: docs */
export function isCloseAccountInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.CloseAccount;
}
/** TODO: docs */
export function isFreezeAccountInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.FreezeAccount;
}
/** TODO: docs */
export function isThawAccountInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.ThawAccount;
}
/** TODO: docs */
export function isTransferCheckedInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.TransferChecked;
}
/** TODO: docs */
export function isApproveCheckedInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.ApproveChecked;
}
/** TODO: docs */
export function isMintToCheckedInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.MintToChecked;
}
/** TODO: docs */
export function isBurnCheckedInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.BurnChecked;
}
/** TODO: docs */
export function isInitializeAccount2Instruction(decoded) {
    return decoded.data.instruction === TokenInstruction.InitializeAccount2;
}
/** TODO: docs */
export function isSyncNativeInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.SyncNative;
}
/** TODO: docs */
export function isInitializeAccount3Instruction(decoded) {
    return decoded.data.instruction === TokenInstruction.InitializeAccount3;
}
/** TODO: docs, implement */
// export function isInitializeMultisig2Instruction(
//     decoded: DecodedInstruction
// ): decoded is DecodedInitializeMultisig2Instruction {
//     return decoded.data.instruction === TokenInstruction.InitializeMultisig2;
// }
/** TODO: docs */
export function isInitializeMint2Instruction(decoded) {
    return decoded.data.instruction === TokenInstruction.InitializeMint2;
}
/** TODO: docs */
export function isAmountToUiAmountInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.AmountToUiAmount;
}
/** TODO: docs */
export function isUiamountToAmountInstruction(decoded) {
    return decoded.data.instruction === TokenInstruction.UiAmountToAmount;
}
//# sourceMappingURL=decode.js.map
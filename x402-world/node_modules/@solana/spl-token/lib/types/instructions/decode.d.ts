import type { TransactionInstruction } from '@solana/web3.js';
import type { DecodedAmountToUiAmountInstruction } from './amountToUiAmount.js';
import type { DecodedApproveInstruction } from './approve.js';
import type { DecodedApproveCheckedInstruction } from './approveChecked.js';
import type { DecodedBurnInstruction } from './burn.js';
import type { DecodedBurnCheckedInstruction } from './burnChecked.js';
import type { DecodedCloseAccountInstruction } from './closeAccount.js';
import type { DecodedFreezeAccountInstruction } from './freezeAccount.js';
import type { DecodedInitializeAccountInstruction } from './initializeAccount.js';
import type { DecodedInitializeAccount2Instruction } from './initializeAccount2.js';
import type { DecodedInitializeAccount3Instruction } from './initializeAccount3.js';
import type { DecodedInitializeMintInstruction } from './initializeMint.js';
import type { DecodedInitializeMint2Instruction } from './initializeMint2.js';
import type { DecodedInitializeMultisigInstruction } from './initializeMultisig.js';
import type { DecodedMintToInstruction } from './mintTo.js';
import type { DecodedMintToCheckedInstruction } from './mintToChecked.js';
import type { DecodedRevokeInstruction } from './revoke.js';
import type { DecodedSetAuthorityInstruction } from './setAuthority.js';
import type { DecodedSyncNativeInstruction } from './syncNative.js';
import type { DecodedThawAccountInstruction } from './thawAccount.js';
import type { DecodedTransferInstruction } from './transfer.js';
import type { DecodedTransferCheckedInstruction } from './transferChecked.js';
import type { DecodedUiAmountToAmountInstruction } from './uiAmountToAmount.js';
/** TODO: docs */
export type DecodedInstruction = DecodedInitializeMintInstruction | DecodedInitializeAccountInstruction | DecodedInitializeMultisigInstruction | DecodedTransferInstruction | DecodedApproveInstruction | DecodedRevokeInstruction | DecodedSetAuthorityInstruction | DecodedMintToInstruction | DecodedBurnInstruction | DecodedCloseAccountInstruction | DecodedFreezeAccountInstruction | DecodedThawAccountInstruction | DecodedTransferCheckedInstruction | DecodedApproveCheckedInstruction | DecodedMintToCheckedInstruction | DecodedBurnCheckedInstruction | DecodedInitializeAccount2Instruction | DecodedSyncNativeInstruction | DecodedInitializeAccount3Instruction | DecodedInitializeMint2Instruction | DecodedAmountToUiAmountInstruction | DecodedUiAmountToAmountInstruction | never;
/** TODO: docs */
export declare function decodeInstruction(instruction: TransactionInstruction, programId?: import("@solana/web3.js").PublicKey): DecodedInstruction;
/** TODO: docs */
export declare function isInitializeMintInstruction(decoded: DecodedInstruction): decoded is DecodedInitializeMintInstruction;
/** TODO: docs */
export declare function isInitializeAccountInstruction(decoded: DecodedInstruction): decoded is DecodedInitializeAccountInstruction;
/** TODO: docs */
export declare function isInitializeMultisigInstruction(decoded: DecodedInstruction): decoded is DecodedInitializeMultisigInstruction;
/** TODO: docs */
export declare function isTransferInstruction(decoded: DecodedInstruction): decoded is DecodedTransferInstruction;
/** TODO: docs */
export declare function isApproveInstruction(decoded: DecodedInstruction): decoded is DecodedApproveInstruction;
/** TODO: docs */
export declare function isRevokeInstruction(decoded: DecodedInstruction): decoded is DecodedRevokeInstruction;
/** TODO: docs */
export declare function isSetAuthorityInstruction(decoded: DecodedInstruction): decoded is DecodedSetAuthorityInstruction;
/** TODO: docs */
export declare function isMintToInstruction(decoded: DecodedInstruction): decoded is DecodedMintToInstruction;
/** TODO: docs */
export declare function isBurnInstruction(decoded: DecodedInstruction): decoded is DecodedBurnInstruction;
/** TODO: docs */
export declare function isCloseAccountInstruction(decoded: DecodedInstruction): decoded is DecodedCloseAccountInstruction;
/** TODO: docs */
export declare function isFreezeAccountInstruction(decoded: DecodedInstruction): decoded is DecodedFreezeAccountInstruction;
/** TODO: docs */
export declare function isThawAccountInstruction(decoded: DecodedInstruction): decoded is DecodedThawAccountInstruction;
/** TODO: docs */
export declare function isTransferCheckedInstruction(decoded: DecodedInstruction): decoded is DecodedTransferCheckedInstruction;
/** TODO: docs */
export declare function isApproveCheckedInstruction(decoded: DecodedInstruction): decoded is DecodedApproveCheckedInstruction;
/** TODO: docs */
export declare function isMintToCheckedInstruction(decoded: DecodedInstruction): decoded is DecodedMintToCheckedInstruction;
/** TODO: docs */
export declare function isBurnCheckedInstruction(decoded: DecodedInstruction): decoded is DecodedBurnCheckedInstruction;
/** TODO: docs */
export declare function isInitializeAccount2Instruction(decoded: DecodedInstruction): decoded is DecodedInitializeAccount2Instruction;
/** TODO: docs */
export declare function isSyncNativeInstruction(decoded: DecodedInstruction): decoded is DecodedSyncNativeInstruction;
/** TODO: docs */
export declare function isInitializeAccount3Instruction(decoded: DecodedInstruction): decoded is DecodedInitializeAccount3Instruction;
/** TODO: docs, implement */
/** TODO: docs */
export declare function isInitializeMint2Instruction(decoded: DecodedInstruction): decoded is DecodedInitializeMint2Instruction;
/** TODO: docs */
export declare function isAmountToUiAmountInstruction(decoded: DecodedInstruction): decoded is DecodedAmountToUiAmountInstruction;
/** TODO: docs */
export declare function isUiamountToAmountInstruction(decoded: DecodedInstruction): decoded is DecodedUiAmountToAmountInstruction;
//# sourceMappingURL=decode.d.ts.map
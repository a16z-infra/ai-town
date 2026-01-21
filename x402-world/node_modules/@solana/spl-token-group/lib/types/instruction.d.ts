import type { PublicKey } from '@solana/web3.js';
import { TransactionInstruction } from '@solana/web3.js';
export interface InitializeGroupInstruction {
    programId: PublicKey;
    group: PublicKey;
    mint: PublicKey;
    mintAuthority: PublicKey;
    updateAuthority: PublicKey | null;
    maxSize: bigint;
}
export declare function createInitializeGroupInstruction(args: InitializeGroupInstruction): TransactionInstruction;
export interface UpdateGroupMaxSize {
    programId: PublicKey;
    group: PublicKey;
    updateAuthority: PublicKey;
    maxSize: bigint;
}
export declare function createUpdateGroupMaxSizeInstruction(args: UpdateGroupMaxSize): TransactionInstruction;
export interface UpdateGroupAuthority {
    programId: PublicKey;
    group: PublicKey;
    currentAuthority: PublicKey;
    newAuthority: PublicKey | null;
}
export declare function createUpdateGroupAuthorityInstruction(args: UpdateGroupAuthority): TransactionInstruction;
export interface InitializeMember {
    programId: PublicKey;
    member: PublicKey;
    memberMint: PublicKey;
    memberMintAuthority: PublicKey;
    group: PublicKey;
    groupUpdateAuthority: PublicKey;
}
export declare function createInitializeMemberInstruction(args: InitializeMember): TransactionInstruction;
//# sourceMappingURL=instruction.d.ts.map
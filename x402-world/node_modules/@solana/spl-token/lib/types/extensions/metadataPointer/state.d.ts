import { PublicKey } from '@solana/web3.js';
import type { Mint } from '../../state/mint.js';
/** MetadataPointer as stored by the program */
export interface MetadataPointer {
    /** Optional authority that can set the metadata address */
    authority: PublicKey | null;
    /** Optional Account Address that holds the metadata */
    metadataAddress: PublicKey | null;
}
/** Buffer layout for de/serializing a Metadata Pointer extension */
export declare const MetadataPointerLayout: import("@solana/buffer-layout").Structure<{
    authority: PublicKey;
    metadataAddress: PublicKey;
}>;
export declare const METADATA_POINTER_SIZE: number;
export declare function getMetadataPointerState(mint: Mint): Partial<MetadataPointer> | null;
//# sourceMappingURL=state.d.ts.map
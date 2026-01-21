import { Layout } from '@solana/buffer-layout';
import type { PublicKey } from '@solana/web3.js';
export declare class COptionPublicKeyLayout extends Layout<PublicKey | null> {
    private publicKeyLayout;
    constructor(property?: string | undefined);
    decode(buffer: Uint8Array, offset?: number): PublicKey | null;
    encode(src: PublicKey | null, buffer: Uint8Array, offset?: number): number;
    getSpan(buffer?: Uint8Array, offset?: number): number;
}
//# sourceMappingURL=serialization.d.ts.map
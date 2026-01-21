import { blob } from '@solana/buffer-layout';
import { PublicKey } from '@solana/web3.js';
import { encodeDecode } from './base.mjs';
export const publicKey = (property) => {
    const layout = blob(32, property);
    const { encode, decode } = encodeDecode(layout);
    const publicKeyLayout = layout;
    publicKeyLayout.decode = (buffer, offset) => {
        const src = decode(buffer, offset);
        return new PublicKey(src);
    };
    publicKeyLayout.encode = (publicKey, buffer, offset) => {
        const src = publicKey.toBuffer();
        return encode(src, buffer, offset);
    };
    return publicKeyLayout;
};
//# sourceMappingURL=web3.js.map
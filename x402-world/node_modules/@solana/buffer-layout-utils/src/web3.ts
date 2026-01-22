import { blob, Layout } from '@solana/buffer-layout';
import { PublicKey } from '@solana/web3.js';
import { encodeDecode } from './base';

export const publicKey = (property?: string): Layout<PublicKey> => {
    const layout = blob(32, property);
    const { encode, decode } = encodeDecode(layout);

    const publicKeyLayout = layout as Layout<unknown> as Layout<PublicKey>;

    publicKeyLayout.decode = (buffer: Buffer, offset: number) => {
        const src = decode(buffer, offset);
        return new PublicKey(src);
    };

    publicKeyLayout.encode = (publicKey: PublicKey, buffer: Buffer, offset: number) => {
        const src = publicKey.toBuffer();
        return encode(src, buffer, offset);
    };

    return publicKeyLayout;
};

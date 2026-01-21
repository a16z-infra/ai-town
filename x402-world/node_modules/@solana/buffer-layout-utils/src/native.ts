import { Layout, u8 } from '@solana/buffer-layout';
import { encodeDecode } from './base';

export const bool = (property?: string): Layout<boolean> => {
    const layout = u8(property);
    const { encode, decode } = encodeDecode(layout);

    const boolLayout = layout as Layout<unknown> as Layout<boolean>;

    boolLayout.decode = (buffer: Buffer, offset: number) => {
        const src = decode(buffer, offset);
        return !!src;
    };

    boolLayout.encode = (bool: boolean, buffer: Buffer, offset: number) => {
        const src = Number(bool);
        return encode(src, buffer, offset);
    };

    return boolLayout;
};

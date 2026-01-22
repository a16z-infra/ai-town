import { u8 } from '@solana/buffer-layout';
import { encodeDecode } from './base.mjs';
export const bool = (property) => {
    const layout = u8(property);
    const { encode, decode } = encodeDecode(layout);
    const boolLayout = layout;
    boolLayout.decode = (buffer, offset) => {
        const src = decode(buffer, offset);
        return !!src;
    };
    boolLayout.encode = (bool, buffer, offset) => {
        const src = Number(bool);
        return encode(src, buffer, offset);
    };
    return boolLayout;
};
//# sourceMappingURL=native.js.map
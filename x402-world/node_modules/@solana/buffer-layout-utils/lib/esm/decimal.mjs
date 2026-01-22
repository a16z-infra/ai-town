import BigNumber from 'bignumber.js';
import { encodeDecode } from './base.mjs';
import { u128 } from './bigint.mjs';
export const WAD = new BigNumber('1e+18');
export const decimal = (property) => {
    const layout = u128(property);
    const { encode, decode } = encodeDecode(layout);
    const decimalLayout = layout;
    decimalLayout.decode = (buffer, offset) => {
        const src = decode(buffer, offset).toString();
        return new BigNumber(src).div(WAD);
    };
    decimalLayout.encode = (decimal, buffer, offset) => {
        const src = BigInt(decimal.times(WAD).integerValue().toString());
        return encode(src, buffer, offset);
    };
    return decimalLayout;
};
//# sourceMappingURL=decimal.js.map
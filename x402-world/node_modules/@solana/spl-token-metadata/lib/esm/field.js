import { addCodecSizePrefix, getU32Codec, getUtf8Codec, getStructCodec, getTupleCodec, getUnitCodec, } from '@solana/codecs';
export var Field;
(function (Field) {
    Field[Field["Name"] = 0] = "Name";
    Field[Field["Symbol"] = 1] = "Symbol";
    Field[Field["Uri"] = 2] = "Uri";
})(Field || (Field = {}));
export const getFieldCodec = () => [
    ['Name', getUnitCodec()],
    ['Symbol', getUnitCodec()],
    ['Uri', getUnitCodec()],
    ['Key', getStructCodec([['value', getTupleCodec([addCodecSizePrefix(getUtf8Codec(), getU32Codec())])]])],
];
export function getFieldConfig(field) {
    if (field === Field.Name || field === 'Name' || field === 'name') {
        return { __kind: 'Name' };
    }
    else if (field === Field.Symbol || field === 'Symbol' || field === 'symbol') {
        return { __kind: 'Symbol' };
    }
    else if (field === Field.Uri || field === 'Uri' || field === 'uri') {
        return { __kind: 'Uri' };
    }
    else {
        return { __kind: 'Key', value: [field] };
    }
}
//# sourceMappingURL=field.js.map
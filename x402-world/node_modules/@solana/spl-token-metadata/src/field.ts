import type { Codec } from '@solana/codecs';
import {
    addCodecSizePrefix,
    getU32Codec,
    getUtf8Codec,
    getStructCodec,
    getTupleCodec,
    getUnitCodec,
} from '@solana/codecs';

export enum Field {
    Name,
    Symbol,
    Uri,
}

type FieldLayout = { __kind: 'Name' } | { __kind: 'Symbol' } | { __kind: 'Uri' } | { __kind: 'Key'; value: [string] };

export const getFieldCodec = () =>
    [
        ['Name', getUnitCodec()],
        ['Symbol', getUnitCodec()],
        ['Uri', getUnitCodec()],
        ['Key', getStructCodec([['value', getTupleCodec([addCodecSizePrefix(getUtf8Codec(), getU32Codec())])]])],
    ] as const;

export function getFieldConfig(field: Field | string): FieldLayout {
    if (field === Field.Name || field === 'Name' || field === 'name') {
        return { __kind: 'Name' };
    } else if (field === Field.Symbol || field === 'Symbol' || field === 'symbol') {
        return { __kind: 'Symbol' };
    } else if (field === Field.Uri || field === 'Uri' || field === 'uri') {
        return { __kind: 'Uri' };
    } else {
        return { __kind: 'Key', value: [field] };
    }
}

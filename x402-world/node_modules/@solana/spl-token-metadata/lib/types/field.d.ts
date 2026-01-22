export declare enum Field {
    Name = 0,
    Symbol = 1,
    Uri = 2
}
type FieldLayout = {
    __kind: 'Name';
} | {
    __kind: 'Symbol';
} | {
    __kind: 'Uri';
} | {
    __kind: 'Key';
    value: [string];
};
export declare const getFieldCodec: () => readonly [readonly ["Name", import("@solana/codecs").FixedSizeCodec<void, void, 0>], readonly ["Symbol", import("@solana/codecs").FixedSizeCodec<void, void, 0>], readonly ["Uri", import("@solana/codecs").FixedSizeCodec<void, void, 0>], readonly ["Key", import("@solana/codecs").VariableSizeCodec<{
    value: readonly [string];
}, {
    value: readonly [string];
} & {
    value: readonly [string];
}>]];
export declare function getFieldConfig(field: Field | string): FieldLayout;
export {};
//# sourceMappingURL=field.d.ts.map
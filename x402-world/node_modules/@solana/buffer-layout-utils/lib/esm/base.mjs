export const encodeDecode = (layout) => {
    const decode = layout.decode.bind(layout);
    const encode = layout.encode.bind(layout);
    return { decode, encode };
};
//# sourceMappingURL=base.js.map
import {Buffer} from 'buffer';
import {blob, Layout} from '@solana/buffer-layout';
import {getU64Codec} from '@solana/codecs-numbers';

export function u64(property?: string): Layout<bigint> {
  const layout = blob(8 /* bytes */, property);
  const decode = layout.decode.bind(layout);
  const encode = layout.encode.bind(layout);

  const bigIntLayout = layout as Layout<unknown> as Layout<bigint>;
  const codec = getU64Codec();

  bigIntLayout.decode = (buffer: Buffer, offset: number) => {
    const src = decode(buffer as Uint8Array, offset);
    return codec.decode(src);
  };

  bigIntLayout.encode = (bigInt: bigint, buffer: Buffer, offset: number) => {
    const src = codec.encode(bigInt) as Uint8Array;
    return encode(src, buffer as Uint8Array, offset);
  };

  return bigIntLayout;
}

import { ns64, s16, struct } from '@solana/buffer-layout';
import { publicKey } from '@solana/buffer-layout-utils';
import { ExtensionType, getExtensionData } from '../extensionType.js';
export const InterestBearingMintConfigStateLayout = struct([
    publicKey('rateAuthority'),
    ns64('initializationTimestamp'),
    s16('preUpdateAverageRate'),
    ns64('lastUpdateTimestamp'),
    s16('currentRate'),
]);
export const INTEREST_BEARING_MINT_CONFIG_STATE_SIZE = InterestBearingMintConfigStateLayout.span;
export function getInterestBearingMintConfigState(mint) {
    const extensionData = getExtensionData(ExtensionType.InterestBearingConfig, mint.tlvData);
    if (extensionData !== null) {
        return InterestBearingMintConfigStateLayout.decode(extensionData);
    }
    return null;
}
//# sourceMappingURL=state.js.map
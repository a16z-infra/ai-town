import { PUBLIC_KEY_LENGTH, PublicKey } from '@solana/web3.js';
import { TokenTransferHookAccountDataNotFound, TokenTransferHookInvalidPubkeyData, TokenTransferHookPubkeyDataTooSmall, TokenTransferHookAccountNotFound, } from '../../errors.js';
export async function unpackPubkeyData(keyDataConfig, previousMetas, instructionData, connection) {
    const [discriminator, ...rest] = keyDataConfig;
    const remaining = new Uint8Array(rest);
    switch (discriminator) {
        case 1:
            return unpackPubkeyDataFromInstructionData(remaining, instructionData);
        case 2:
            return unpackPubkeyDataFromAccountData(remaining, previousMetas, connection);
        default:
            throw new TokenTransferHookInvalidPubkeyData();
    }
}
function unpackPubkeyDataFromInstructionData(remaining, instructionData) {
    if (remaining.length < 1) {
        throw new TokenTransferHookInvalidPubkeyData();
    }
    const dataIndex = remaining[0];
    if (instructionData.length < dataIndex + PUBLIC_KEY_LENGTH) {
        throw new TokenTransferHookPubkeyDataTooSmall();
    }
    return new PublicKey(instructionData.subarray(dataIndex, dataIndex + PUBLIC_KEY_LENGTH));
}
async function unpackPubkeyDataFromAccountData(remaining, previousMetas, connection) {
    if (remaining.length < 2) {
        throw new TokenTransferHookInvalidPubkeyData();
    }
    const [accountIndex, dataIndex] = remaining;
    if (previousMetas.length <= accountIndex) {
        throw new TokenTransferHookAccountDataNotFound();
    }
    const accountInfo = await connection.getAccountInfo(previousMetas[accountIndex].pubkey);
    if (accountInfo == null) {
        throw new TokenTransferHookAccountNotFound();
    }
    if (accountInfo.data.length < dataIndex + PUBLIC_KEY_LENGTH) {
        throw new TokenTransferHookPubkeyDataTooSmall();
    }
    return new PublicKey(accountInfo.data.subarray(dataIndex, dataIndex + PUBLIC_KEY_LENGTH));
}
//# sourceMappingURL=pubkeyData.js.map
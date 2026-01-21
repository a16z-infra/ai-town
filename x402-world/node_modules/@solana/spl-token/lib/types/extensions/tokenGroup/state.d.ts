import { type TokenGroup, type TokenGroupMember } from '@solana/spl-token-group';
import type { Mint } from '../../state/mint.js';
export { TOKEN_GROUP_SIZE, TOKEN_GROUP_MEMBER_SIZE } from '@solana/spl-token-group';
export declare function getTokenGroupState(mint: Mint): Partial<TokenGroup> | null;
export declare function getTokenGroupMemberState(mint: Mint): Partial<TokenGroupMember> | null;
//# sourceMappingURL=state.d.ts.map
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import closeImg from '../../assets/close.svg';
import { SelectElement } from './Player';
import { Messages } from './Messages';
import { toastOnError } from '../toasts';
import { useSendInput } from '../hooks/sendInput';
import { Player } from '../../convex/aiTown/player';
import { GameId } from '../../convex/aiTown/ids';
import { ServerGame } from '../hooks/serverGame';
import { useState } from 'react';

export default function PlayerDetails({
  worldId,
  engineId,
  game,
  playerId,
  setSelectedElement,
  scrollViewRef,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  game: ServerGame;
  playerId?: GameId<'players'>;
  setSelectedElement: SelectElement;
  scrollViewRef: React.RefObject<HTMLDivElement>;
}) {
  const humanTokenIdentifier = useQuery(api.world.userStatus, { worldId });

  const players = [...game.world.players.values()];
  const humanPlayer = players.find((p) => p.human === humanTokenIdentifier);
  const humanConversation = humanPlayer ? game.world.playerConversation(humanPlayer) : undefined;
  // Always select the other player if we're in a conversation with them.
  let resolvedPlayerId = playerId;
  if (humanPlayer && humanConversation) {
    const otherPlayerIds = [...humanConversation.participants.keys()].filter(
      (p) => p !== humanPlayer.id,
    );
    resolvedPlayerId = otherPlayerIds[0];
  }

  const player = resolvedPlayerId && game.world.players.get(resolvedPlayerId);
  const playerConversation = player && game.world.playerConversation(player);

  const previousConversation = useQuery(
    api.world.previousConversation,
    resolvedPlayerId ? { worldId, playerId: resolvedPlayerId } : 'skip',
  );

  const playerDescription = resolvedPlayerId && game.playerDescriptions.get(resolvedPlayerId);

  const startConversation = useSendInput(engineId, 'startConversation');
  const acceptInvite = useSendInput(engineId, 'acceptInvite');
  const rejectInvite = useSendInput(engineId, 'rejectInvite');
  const leaveConversation = useSendInput(engineId, 'leaveConversation');

  if (!resolvedPlayerId) {
    return (
      <div className="h-full text-xl flex text-center items-center p-4">
        Click on an agent on the map to see chat history.
      </div>
    );
  }
  if (!player) {
    return null;
  }
  const isMe = humanPlayer && player.id === humanPlayer.id;
  const canInvite = !isMe && !playerConversation && humanPlayer && !humanConversation;
  const sameConversation =
    !isMe &&
    humanPlayer &&
    humanConversation &&
    playerConversation &&
    humanConversation.id === playerConversation.id;

  const humanStatus =
    humanPlayer && humanConversation && humanConversation.participants.get(humanPlayer.id)?.status;
  const playerStatus = playerConversation && playerConversation.participants.get(resolvedPlayerId)?.status;

  const haveInvite = sameConversation && humanStatus?.kind === 'invited';
  const waitingForAccept =
    sameConversation && playerConversation.participants.get(resolvedPlayerId)?.status.kind === 'invited';
  const waitingForNearby =
    sameConversation && playerStatus?.kind === 'walkingOver' && humanStatus?.kind === 'walkingOver';

  const inConversationWithMe =
    sameConversation &&
    playerStatus?.kind === 'participating' &&
    humanStatus?.kind === 'participating';

  const onStartConversation = async () => {
    if (!humanPlayer || !resolvedPlayerId) {
      return;
    }
    console.log(`Starting conversation`);
    await toastOnError(startConversation({ playerId: humanPlayer.id, invitee: resolvedPlayerId }));
  };
  const onAcceptInvite = async () => {
    if (!humanPlayer || !humanConversation || !resolvedPlayerId) {
      return;
    }
    await toastOnError(
      acceptInvite({
        playerId: humanPlayer.id,
        conversationId: humanConversation.id,
      }),
    );
  };
  const onRejectInvite = async () => {
    if (!humanPlayer || !humanConversation) {
      return;
    }
    await toastOnError(
      rejectInvite({
        playerId: humanPlayer.id,
        conversationId: humanConversation.id,
      }),
    );
  };
  const onLeaveConversation = async () => {
    if (!humanPlayer || !inConversationWithMe || !humanConversation) {
      return;
    }
    await toastOnError(
      leaveConversation({
        playerId: humanPlayer.id,
        conversationId: humanConversation.id,
      }),
    );
  };
  // const pendingSuffix = (inputName: string) =>
  //   [...inflightInputs.values()].find((i) => i.name === inputName) ? ' opacity-50' : '';

  const pendingSuffix = (s: string) => '';
  return (
    <>
      <div className="flex gap-4">
        <div className="box w-3/4 sm:w-full mr-auto">
          <h2 className="bg-brown-700 p-2 font-display text-2xl sm:text-4xl tracking-wider shadow-solid text-center">
            {playerDescription?.name}
          </h2>
        </div>
        <a
          className="button text-white shadow-solid text-2xl cursor-pointer pointer-events-auto"
          onClick={() => setSelectedElement(undefined)}
        >
          <h2 className="h-full bg-clay-700">
            <img className="w-4 h-4 sm:w-5 sm:h-5" src={closeImg} />
          </h2>
        </a>
      </div>
      {canInvite && (
        <a
          className={
            'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
            pendingSuffix('startConversation')
          }
          onClick={onStartConversation}
        >
          <div className="h-full bg-clay-700 text-center">
            <span>Start conversation</span>
          </div>
        </a>
      )}
      {waitingForAccept && (
        <a className="mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto opacity-50">
          <div className="h-full bg-clay-700 text-center">
            <span>Waiting for accept...</span>
          </div>
        </a>
      )}
      {waitingForNearby && (
        <a className="mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto opacity-50">
          <div className="h-full bg-clay-700 text-center">
            <span>Walking over...</span>
          </div>
        </a>
      )}
      {inConversationWithMe && (
        <a
          className={
            'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
            pendingSuffix('leaveConversation')
          }
          onClick={onLeaveConversation}
        >
          <div className="h-full bg-clay-700 text-center">
            <span>Leave conversation</span>
          </div>
        </a>
      )}
      {haveInvite && (
        <>
          <a
            className={
              'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
              pendingSuffix('acceptInvite')
            }
            onClick={onAcceptInvite}
          >
            <div className="h-full bg-clay-700 text-center">
              <span>Accept</span>
            </div>
          </a>
          <a
            className={
              'mt-6 button text-white shadow-solid text-xl cursor-pointer pointer-events-auto' +
              pendingSuffix('rejectInvite')
            }
            onClick={onRejectInvite}
          >
            <div className="h-full bg-clay-700 text-center">
              <span>Reject</span>
            </div>
          </a>
        </>
      )}
      {!playerConversation && player.activity && player.activity.until > Date.now() && (
        <div className="box flex-grow mt-6">
          <h2 className="bg-brown-700 text-base sm:text-lg text-center">
            {player.activity.description}
          </h2>
        </div>
      )}
      <div className="desc my-6">
        <p className="leading-tight -m-4 bg-brown-700 text-base sm:text-sm">
          {!isMe && playerDescription?.description}
          {isMe && <i>This is you!</i>}
          {!isMe && inConversationWithMe && (
            <>
              <br />
              <br />(<i>Conversing with you!</i>)
            </>
          )}
        </p>
      </div>
      {!isMe && resolvedPlayerId && (
        <EditAgentSection worldId={worldId} game={game} playerId={resolvedPlayerId} />
      )}
      {!isMe && playerConversation && playerStatus?.kind === 'participating' && (
        <Messages
          worldId={worldId}
          engineId={engineId}
          inConversationWithMe={inConversationWithMe ?? false}
          conversation={{ kind: 'active', doc: playerConversation }}
          humanPlayer={humanPlayer}
          scrollViewRef={scrollViewRef}
        />
      )}
      {!playerConversation && previousConversation && (
        <>
          <div className="box flex-grow">
            <h2 className="bg-brown-700 text-lg text-center">Previous conversation</h2>
          </div>
          <Messages
            worldId={worldId}
            engineId={engineId}
            inConversationWithMe={false}
            conversation={{ kind: 'archived', doc: previousConversation }}
            humanPlayer={humanPlayer}
            scrollViewRef={scrollViewRef}
          />
        </>
      )}
      {!isMe && <UserPromptSection worldId={worldId} playerId={resolvedPlayerId} />}
      {!isMe && resolvedPlayerId && (
        <SixDimStats game={game} playerId={resolvedPlayerId} />
      )}
      {!isMe && resolvedPlayerId && (
        <MemoryPanel worldId={worldId} playerId={resolvedPlayerId} />
      )}
      {!isMe && resolvedPlayerId && (
        <InventoryPanel game={game} playerId={resolvedPlayerId} />
      )}
      {!isMe && resolvedPlayerId && (
        <FuturePlansPanel worldId={worldId} playerId={resolvedPlayerId} />
      )}
      {!isMe && resolvedPlayerId && (
        <NearbyPanel game={game} playerId={resolvedPlayerId} />
      )}
    </>
  );
}

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const;

function EditAgentSection({
  worldId,
  game,
  playerId,
}: {
  worldId: Id<'worlds'>;
  game: ServerGame;
  playerId: GameId<'players'>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const agent = [...game.world.agents.values()].find((a) => a.playerId === playerId);
  const agentDesc = agent ? game.agentDescriptions.get(agent.id) : undefined;

  const [identity, setIdentity] = useState('');
  const [plan, setPlan] = useState('');
  const [mbti, setMbti] = useState('');
  const [background, setBackground] = useState('');
  const [synced, setSynced] = useState(false);

  // Sync local state when agentDesc loads or changes (only when not yet synced or panel reopened)
  if (agentDesc && !synced) {
    setIdentity(agentDesc.identity ?? '');
    setPlan(agentDesc.plan ?? '');
    setMbti(agentDesc.mbti ?? '');
    setBackground(agentDesc.personality?.background ?? '');
    setSynced(true);
  }

  const updateAgent = useMutation(api.townNews.updateAgentDescription);

  const onSave = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      await updateAgent({
        worldId,
        agentId: agent.id,
        identity: identity || undefined,
        plan: plan || undefined,
        mbti: mbti || undefined,
        background: background || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!agent || !agentDesc) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#181425',
    border: '1px solid #3A4466',
    borderRadius: '6px',
    padding: '6px 10px',
    color: '#C0CBDC',
    fontSize: '12px',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    color: '#8B9BB4',
    marginBottom: '2px',
    fontWeight: 'bold',
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <h3
        className="bg-brown-700 font-display shadow-solid"
        onClick={() => {
          if (!open) setSynced(false); // re-sync on open
          setOpen(!open);
        }}
        style={{
          padding: '6px 8px',
          fontSize: '16px',
          letterSpacing: '1px',
          textAlign: 'center',
          marginBottom: open ? '8px' : '0',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        Edit Agent {open ? '\u25BE' : '\u25B8'}
      </h3>
      {open && (
        <div style={{
          backgroundColor: '#181425',
          borderRadius: '6px',
          padding: '10px',
          border: '1px solid #3A4466',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div>
            <div style={labelStyle}>Identity</div>
            <textarea
              rows={3}
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <div style={labelStyle}>Plan / Goal</div>
            <textarea
              rows={2}
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <div style={labelStyle}>MBTI</div>
            <select
              value={mbti}
              onChange={(e) => setMbti(e.target.value)}
              style={{
                ...inputStyle,
                resize: 'none',
                appearance: 'auto',
              }}
            >
              <option value="">-- Select --</option>
              {MBTI_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <div style={labelStyle}>Background</div>
            <textarea
              rows={2}
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              style={inputStyle}
            />
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            style={{
              backgroundColor: saving ? '#374151' : '#1d4ed8',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: saving ? 'default' : 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              alignSelf: 'flex-end',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  );
}

// Six-dimensional stats display
function SixDimStats({ game, playerId }: { game: ServerGame; playerId: GameId<'players'> }) {
  const agent = [...game.world.agents.values()].find((a) => a.playerId === playerId);
  const agentDesc = agent ? game.agentDescriptions.get(agent.id) : undefined;
  const stats = agentDesc?.stats;
  if (!stats) return null;

  const dims = [
    { label: 'Sociability', value: stats.sociability, color: '#ec4899' },
    { label: 'Diligence', value: stats.diligence, color: '#22c55e' },
    { label: 'Cunning', value: stats.cunning, color: '#ef4444' },
    { label: 'Justice', value: stats.justice, color: '#3b82f6' },
    { label: 'Creativity', value: stats.creativity ?? 5, color: '#f59e0b' },
    { label: 'Resilience', value: stats.resilience ?? 5, color: '#8b5cf6' },
  ];

  return (
    <div style={{ marginTop: '16px' }}>
      <h3
        className="bg-brown-700 font-display shadow-solid"
        style={{ padding: '6px 8px', fontSize: '16px', letterSpacing: '1px', textAlign: 'center', marginBottom: '8px' }}
      >
        Attributes
      </h3>
      <div style={{ backgroundColor: '#181425', borderRadius: '6px', padding: '8px 10px' }}>
        {dims.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', marginTop: '3px' }}>
            <span style={{ width: '72px', textAlign: 'right', color: '#E4A672' }}>{d.label}</span>
            <div style={{ flex: 1, height: '8px', backgroundColor: '#3F2832', borderRadius: '4px', overflow: 'hidden', border: '1px solid #5A6988' }}>
              <div style={{ height: '100%', width: `${d.value * 10}%`, backgroundColor: d.color, borderRadius: '4px', transition: 'width 0.5s' }} />
            </div>
            <span style={{ width: '20px', textAlign: 'right', fontFamily: 'monospace', color: '#C0CBDC' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Memory panel — shows short-term memories
function MemoryPanel({ worldId, playerId }: { worldId: Id<'worlds'>; playerId: string }) {
  const [open, setOpen] = useState(false);
  const memories = useQuery(api.townNews.getShortTermMemoriesPublic, { playerId });

  return (
    <div style={{ marginTop: '16px' }}>
      <h3
        className="bg-brown-700 font-display shadow-solid"
        style={{ padding: '6px 8px', fontSize: '16px', letterSpacing: '1px', textAlign: 'center', marginBottom: '8px', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        Memory {open ? '▾' : '▸'}
      </h3>
      {open && (
        <div style={{ backgroundColor: '#181425', borderRadius: '6px', padding: '8px 10px', maxHeight: '200px', overflowY: 'auto' }}>
          {(!memories || memories.length === 0) && (
            <div style={{ color: '#5A6988', fontSize: '11px', textAlign: 'center' }}>No memories yet</div>
          )}
          {memories?.map((m, i) => (
            <div key={i} style={{ fontSize: '11px', marginBottom: '4px', borderBottom: '1px solid #262040', paddingBottom: '3px' }}>
              <span style={{ color: '#8B9BB4' }}>
                [{m.type}]
              </span>{' '}
              <span style={{ color: '#C0CBDC' }}>{m.content}</span>
              <span style={{ color: '#5A6988', marginLeft: '4px', fontSize: '9px' }}>
                imp:{m.importance}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Inventory panel
function InventoryPanel({ game, playerId }: { game: ServerGame; playerId: GameId<'players'> }) {
  const player = game.world.players.get(playerId);
  if (!player) return null;
  const inv = player.inventory ?? { wood: 0, ore: 0, herbs: 0, food: 0 };
  const totalRes = Object.values(inv).reduce((a, b) => a + (b ?? 0), 0);
  if (totalRes === 0 && (player.influence ?? 0) === 0) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <h3
        className="bg-brown-700 font-display shadow-solid"
        style={{ padding: '6px 8px', fontSize: '16px', letterSpacing: '1px', textAlign: 'center', marginBottom: '8px' }}
      >
        Inventory & Influence
      </h3>
      <div style={{ backgroundColor: '#181425', borderRadius: '6px', padding: '8px 10px', fontSize: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', color: '#C0CBDC' }}>
          {inv.wood > 0 && <span>🪵 Wood: {inv.wood}</span>}
          {inv.ore > 0 && <span>⛏️ Ore: {inv.ore}</span>}
          {inv.herbs > 0 && <span>🌿 Herbs: {inv.herbs}</span>}
          {inv.food > 0 && <span>🍎 Food: {inv.food}</span>}
        </div>
        {(player.influence ?? 0) > 0 && (
          <div style={{ marginTop: '4px', color: '#f59e0b' }}>
            ⭐ Influence: {player.influence}
          </div>
        )}
      </div>
    </div>
  );
}

// Future plans panel — LLM-generated agent plans
function FuturePlansPanel({ worldId, playerId }: { worldId: Id<'worlds'>; playerId: string }) {
  const plans = useQuery(api.townNews.getAgentPlans, { worldId, playerId });
  if (!plans || plans.plans.length === 0) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <h3
        className="bg-brown-700 font-display shadow-solid"
        style={{ padding: '6px 8px', fontSize: '16px', letterSpacing: '1px', textAlign: 'center', marginBottom: '8px' }}
      >
        Future Plans
      </h3>
      <div style={{ backgroundColor: '#181425', borderRadius: '6px', padding: '8px 10px' }}>
        {plans.plans.map((plan, i) => (
          <div key={i} style={{ fontSize: '12px', color: '#C0CBDC', marginBottom: '3px' }}>
            <span style={{ color: '#f59e0b' }}>{i + 1}.</span> {plan}
          </div>
        ))}
        <div style={{ fontSize: '9px', color: '#5A6988', marginTop: '4px' }}>
          Updated {new Date(plans.generatedAt).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

// Nearby agents & POIs — environment perception
function NearbyPanel({ game, playerId }: { game: ServerGame; playerId: GameId<'players'> }) {
  const player = game.world.players.get(playerId);
  if (!player) return null;

  const PERCEPTION_RADIUS = 10;
  const nearby = [...game.world.players.values()]
    .filter((p) => p.id !== playerId && !p.human)
    .map((p) => {
      const dx = p.position.x - player.position.x;
      const dy = p.position.y - player.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return { player: p, dist };
    })
    .filter((n) => n.dist < PERCEPTION_RADIUS)
    .sort((a, b) => a.dist - b.dist);

  if (nearby.length === 0) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <h3
        className="bg-brown-700 font-display shadow-solid"
        style={{ padding: '6px 8px', fontSize: '16px', letterSpacing: '1px', textAlign: 'center', marginBottom: '8px' }}
      >
        Nearby ({PERCEPTION_RADIUS} tiles)
      </h3>
      <div style={{ backgroundColor: '#181425', borderRadius: '6px', padding: '8px 10px' }}>
        {nearby.map((n) => {
          const desc = game.playerDescriptions.get(n.player.id);
          return (
            <div key={n.player.id} style={{ fontSize: '12px', color: '#C0CBDC', marginBottom: '2px' }}>
              <span style={{ color: '#8B9BB4' }}>{desc?.name ?? '???'}</span>
              <span style={{ color: '#5A6988', marginLeft: '8px' }}>
                {n.dist.toFixed(1)} tiles away
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PROMPT_STATUS_STYLES: Record<string, { color: string; label: string }> = {
  active: { color: '#22c55e', label: 'ACTIVE' },
  executing: { color: '#3b82f6', label: 'EXECUTING' },
  rejected: { color: '#ef4444', label: 'REJECTED' },
  replaced: { color: '#6b7280', label: 'REPLACED' },
};

function UserPromptSection({ worldId, playerId }: { worldId: Id<'worlds'>; playerId: string }) {
  const [input, setInput] = useState('');
  const prompts = useQuery(api.townNews.getUserPrompts, { worldId, playerId });
  const setPrompt = useMutation(api.townNews.setUserPrompt);

  const onSubmit = async () => {
    if (!input.trim()) return;
    await setPrompt({ worldId, playerId, prompt: input.trim() });
    setInput('');
  };

  const latestPrompt = prompts?.[0];
  const statusStyle = latestPrompt
    ? PROMPT_STATUS_STYLES[latestPrompt.status] ?? { color: '#6b7280', label: latestPrompt.status.toUpperCase() }
    : null;

  return (
    <div style={{ marginTop: '16px' }}>
      <h3
        className="bg-brown-700 font-display shadow-solid"
        style={{ padding: '6px 8px', fontSize: '16px', letterSpacing: '1px', textAlign: 'center', marginBottom: '8px' }}
      >
        Set Life Goal
      </h3>
      {latestPrompt && statusStyle && (
        <div style={{
          backgroundColor: '#181425', borderRadius: '6px', padding: '8px 10px',
          border: `1px solid ${statusStyle.color}40`, marginBottom: '8px', fontSize: '12px',
        }}>
          <span style={{ color: '#E4A672' }}>Goal: </span>
          <span style={{ color: '#C0CBDC' }}>"{latestPrompt.prompt}"</span>
          <span style={{ marginLeft: '8px', color: statusStyle.color, fontSize: '10px', fontWeight: 'bold' }}>
            {statusStyle.label}
          </span>
          {latestPrompt.status === 'rejected' && latestPrompt.rejectReason && (
            <div style={{ marginTop: '4px', color: '#ef4444', fontSize: '11px', fontStyle: 'italic' }}>
              Reason: {latestPrompt.rejectReason}
            </div>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: '6px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
          placeholder="e.g. Make more friends, Earn 100 gold..."
          style={{
            flex: 1, backgroundColor: '#181425', border: '1px solid #3A4466',
            borderRadius: '6px', padding: '6px 10px', color: '#C0CBDC',
            fontSize: '12px', outline: 'none',
          }}
        />
        <button
          onClick={onSubmit}
          style={{
            backgroundColor: '#1d4ed8', color: 'white', border: 'none',
            borderRadius: '6px', padding: '6px 12px', cursor: 'pointer',
            fontSize: '12px', fontWeight: 'bold',
          }}
        >
          Set
        </button>
      </div>
      <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {['Earn more gold', 'Make friends', 'Rest and recover', 'Work harder'].map((t) => (
          <button
            key={t}
            onClick={() => setInput(t)}
            style={{
              backgroundColor: '#262040', color: '#8B9BB4', border: '1px solid #3A4466',
              borderRadius: '12px', padding: '2px 8px', cursor: 'pointer', fontSize: '10px',
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

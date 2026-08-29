import { useEffect, useMemo, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { assignColors } from './palette';
import { Tab } from './types';
import CharacterSidebar from './components/CharacterSidebar';
import ConversationsView from './components/ConversationsView';
import LiveView from './components/LiveView';
import MemoriesView from './components/MemoriesView';
import StatsView from './components/StatsView';

const TABS: { id: Tab; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'conversations', label: 'Conversations' },
  { id: 'memories', label: 'Memories' },
  { id: 'stats', label: 'Stats' },
];

// Views that open as a whole-town overview. Arriving at one drops any character filter, so the
// sidebar selection never sits there claiming to narrow something it isn't narrowing yet.
const CLEARS_SELECTION_ON_OPEN: Tab[] = ['live', 'stats'];

// Stats is town-wide by construction, so the sidebar is inert there rather than misleadingly live.
const IGNORES_SELECTION: Tab[] = ['stats'];

export default function App() {
  const worlds = useQuery(api.analytics.worlds);
  const [worldId, setWorldId] = useState<Id<'worlds'> | undefined>();
  const [tab, setTab] = useState<Tab>('live');
  const [playerId, setPlayerId] = useState<string | undefined>();
  const [conversationId, setConversationId] = useState<string | undefined>();

  // Default to the world the game itself shows.
  useEffect(() => {
    if (!worldId && worlds && worlds.length > 0) {
      setWorldId(worlds[0].worldId);
    }
  }, [worlds, worldId]);

  const charactersResult = useQuery(api.analytics.characters, worldId ? { worldId } : 'skip');
  const characters = charactersResult?.characters;

  const colors = useMemo(
    () => assignColors((characters ?? []).map((c) => c.playerId)),
    [characters],
  );

  const selectCharacter = (id: string | undefined) => {
    setPlayerId(id);
    // A conversation opened from another character's history would no longer be in the list.
    setConversationId(undefined);
  };

  const selectTab = (next: Tab) => {
    setTab(next);
    if (CLEARS_SELECTION_ON_OPEN.includes(next)) {
      selectCharacter(undefined);
    }
  };

  // Following a link to a transcript keeps whatever filter is in play — it isn't "opening" the
  // Conversations tab in the sense above, it's jumping to a specific conversation.
  const openConversation = (id: string) => {
    setConversationId(id);
    setTab('conversations');
  };

  if (worlds && worlds.length === 0) {
    return (
      <div className="h-full grid place-items-center p-8 text-center">
        <div>
          <h1 className="text-xl mb-2">No worlds yet</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Run <code>npx convex run init</code> to create one, then reload.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <header
        className="flex items-center gap-4 px-4 py-3 flex-wrap"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-1)' }}
      >
        <h1 className="text-base font-semibold whitespace-nowrap">
          AI Town <span style={{ color: 'var(--text-muted)' }}>Analytics</span>
        </h1>

        <nav className="flex gap-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              className="tab"
              aria-selected={tab === t.id}
              onClick={() => selectTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {charactersResult?.truncated && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              showing the most recent 2,000 conversations
            </span>
          )}
          {worlds && worlds.length > 1 && (
            <select
              className="field text-xs"
              value={worldId ?? ''}
              onChange={(e) => {
                setWorldId(e.target.value as Id<'worlds'>);
                selectCharacter(undefined);
              }}
            >
              {worlds.map((w) => (
                <option key={w.worldId} value={w.worldId}>
                  {w.isDefault ? 'default' : w.worldId.slice(0, 8)} · {w.status}
                </option>
              ))}
            </select>
          )}
          <a
            href="./"
            className="text-xs"
            style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}
          >
            Back to town
          </a>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <CharacterSidebar
          characters={characters}
          colors={colors}
          selected={playerId}
          onSelect={selectCharacter}
          disabled={IGNORES_SELECTION.includes(tab)}
        />

        <main className="flex-1 min-w-0 flex">
          {!worldId ? (
            <div className="flex-1 grid place-items-center" style={{ color: 'var(--text-muted)' }}>
              Loading…
            </div>
          ) : tab === 'conversations' ? (
            <ConversationsView
              worldId={worldId}
              playerId={playerId}
              colors={colors}
              conversationId={conversationId}
              onOpenConversation={setConversationId}
            />
          ) : tab === 'live' ? (
            <LiveView
              worldId={worldId}
              colors={colors}
              playerId={playerId}
              characterName={characters?.find((c) => c.playerId === playerId)?.name}
              onOpenConversation={openConversation}
              onSelectCharacter={selectCharacter}
            />
          ) : tab === 'memories' ? (
            <MemoriesView
              worldId={worldId}
              playerId={playerId}
              characters={characters}
              colors={colors}
              onOpenConversation={openConversation}
            />
          ) : (
            <StatsView worldId={worldId} colors={colors} />
          )}
        </main>
      </div>
    </div>
  );
}

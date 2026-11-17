import { Character } from '../types';
import { compact } from '../format';
import Swatch from './Swatch';

export default function CharacterSidebar({
  characters,
  colors,
  selected,
  onSelect,
  disabled = false,
}: {
  characters: Character[] | undefined;
  colors: Map<string, string>;
  selected: string | undefined;
  onSelect: (playerId: string | undefined) => void;
  /** Set on views that are town-wide by nature, where filtering by character means nothing. */
  disabled?: boolean;
}) {
  return (
    <aside
      className="w-64 shrink-0 flex flex-col"
      style={{ borderRight: '1px solid var(--border)', background: 'var(--surface-1)' }}
    >
      <div
        className="px-3 py-2 text-xs uppercase tracking-wide flex items-center justify-between"
        style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
      >
        <span>Characters</span>
        {selected && !disabled && (
          <button
            className="normal-case tracking-normal"
            style={{ color: 'var(--accent)' }}
            onClick={() => onSelect(undefined)}
          >
            clear
          </button>
        )}
      </div>

      <div
        className="scroll-y flex-1"
        style={disabled ? { opacity: 0.45, pointerEvents: 'none' } : undefined}
        aria-disabled={disabled}
      >
        {characters === undefined && (
          <div className="p-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            Loading…
          </div>
        )}
        {characters?.map((character) => (
          <button
            key={character.playerId}
            className="row-button"
            aria-selected={selected === character.playerId}
            disabled={disabled}
            tabIndex={disabled ? -1 : undefined}
            onClick={() =>
              onSelect(selected === character.playerId ? undefined : character.playerId)
            }
            title={character.identity ?? character.description}
          >
            <div className="flex items-center gap-2">
              <Swatch color={colors.get(character.playerId)} />
              <span className="font-medium truncate">{character.name}</span>
              {character.isActive && (
                <span
                  className="text-[10px] px-1.5 rounded-full shrink-0"
                  style={{ background: 'rgba(12,163,12,0.18)', color: '#0ca30c' }}
                  title="Currently in the world"
                >
                  live
                </span>
              )}
            </div>
            <div className="text-xs tabular mt-0.5 pl-5" style={{ color: 'var(--text-muted)' }}>
              {compact(character.conversations)} convos · {compact(character.messages)} msgs
            </div>
          </button>
        ))}
      </div>

      <div
        className="px-3 py-2 text-xs"
        style={{ color: 'var(--text-muted)', borderTop: '1px solid var(--border)' }}
      >
        {disabled
          ? 'Stats cover the whole town'
          : selected
            ? 'Filtering by this character'
            : 'Select one to filter'}
      </div>
    </aside>
  );
}

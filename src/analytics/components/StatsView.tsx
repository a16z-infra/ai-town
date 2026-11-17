import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { compact, dayLabel, duration } from '../format';
import { SEQUENTIAL, SERIES, inkOn, sequentialStep } from '../palette';
import { useTooltip } from './Tooltip';
import Swatch from './Swatch';

export default function StatsView({
  worldId,
  colors,
}: {
  worldId: Id<'worlds'>;
  colors: Map<string, string>;
}) {
  const stats = useQuery(api.analytics.stats, { worldId });
  const charactersResult = useQuery(api.analytics.characters, { worldId });
  const { bind, node: tooltipNode } = useTooltip();

  if (stats === undefined || charactersResult === undefined) {
    return (
      <div className="flex-1 grid place-items-center" style={{ color: 'var(--text-muted)' }}>
        Loading…
      </div>
    );
  }

  const characters = charactersResult.characters.filter((c) => c.conversations > 0);
  const maxMessages = Math.max(1, ...characters.map((c) => c.messages));

  return (
    <div className="scroll-y flex-1 p-4">
      {tooltipNode}

      <section
        className="grid gap-3 mb-6"
        style={{ gridTemplateColumns: 'repeat(4, minmax(0,1fr))' }}
      >
        <StatTile label="Conversations" value={compact(stats.totals.conversations)} />
        <StatTile label="Messages" value={compact(stats.totals.messages)} />
        <StatTile label="Median length" value={duration(stats.totals.medianDurationMs)} />
        <StatTile
          label="Ended with no messages"
          value={compact(stats.totals.emptyConversations)}
          hint={
            stats.totals.conversations > 0
              ? `${Math.round(
                  (stats.totals.emptyConversations / stats.totals.conversations) * 100,
                )}% of all conversations`
              : undefined
          }
        />
      </section>

      {stats.truncated && (
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Aggregates cover the most recent 2,000 conversations.
        </p>
      )}

      <section className="panel p-4 mb-4">
        <h2 className="text-sm font-medium mb-1">Messages sent, by character</h2>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Totals across every conversation on record.
        </p>
        {characters.length === 0 ? (
          <Empty />
        ) : (
          <div className="flex flex-col gap-0.5">
            {characters.map((character) => (
              <div
                key={character.playerId}
                className="flex items-center gap-2 py-0.5 rounded"
                {...bind(
                  <>
                    <strong>{character.name}</strong>
                    <br />
                    {character.messages.toLocaleString()} messages in{' '}
                    {character.conversations.toLocaleString()} conversations
                  </>,
                )}
              >
                <span className="w-24 shrink-0 text-xs truncate flex items-center gap-1.5">
                  <Swatch color={colors.get(character.playerId)} size={8} />
                  {character.name}
                </span>
                <span className="flex-1 min-w-0">
                  {/* One series, one colour: the bar encodes magnitude only. Identity is carried
                      by the name and its chip in the row label. */}
                  <span
                    className="block h-4"
                    style={{
                      width: `${Math.max(1, (character.messages / maxMessages) * 100)}%`,
                      background: SERIES[0],
                      borderRadius: '0 4px 4px 0',
                    }}
                  />
                </span>
                <span
                  className="w-12 shrink-0 text-xs tabular text-right"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {compact(character.messages)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section
        className="grid gap-4 mb-4"
        style={{ gridTemplateColumns: 'repeat(2, minmax(0,1fr))' }}
      >
        <DailyChart
          title="Messages per day"
          data={stats.daily.map((d) => ({ day: d.day, value: d.messages }))}
          color="#3987e5"
          bind={bind}
          unit="messages"
        />
        <DailyChart
          title="Conversations per day"
          data={stats.daily.map((d) => ({ day: d.day, value: d.conversations }))}
          color="#d95926"
          bind={bind}
          unit="conversations"
        />
      </section>

      <PairMatrix
        pairs={stats.pairs}
        characters={characters.map((c) => ({ playerId: c.playerId, name: c.name }))}
        colors={colors}
        bind={bind}
      />
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="panel p-3">
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div className="text-2xl mt-0.5">{value}</div>
      {hint && (
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Empty() {
  return (
    <p className="text-sm py-4" style={{ color: 'var(--text-muted)' }}>
      Not enough data yet.
    </p>
  );
}

function DailyChart({
  title,
  data,
  color,
  unit,
  bind,
}: {
  title: string;
  data: { day: number; value: number }[];
  color: string;
  unit: string;
  bind: ReturnType<typeof useTooltip>['bind'];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="panel p-4">
      <h2 className="text-sm font-medium mb-3">{title}</h2>
      {data.length === 0 ? (
        <Empty />
      ) : (
        <>
          <div className="relative" style={{ height: 140 }}>
            {/* Recessive gridlines at 0/50/100% of the scale. */}
            {[0, 0.5, 1].map((t) => (
              <div
                key={t}
                className="absolute left-0 right-0"
                style={{
                  bottom: `${t * 100}%`,
                  borderTop: `1px solid ${t === 0 ? 'var(--baseline)' : 'var(--gridline)'}`,
                }}
              />
            ))}
            {/* Bars stretch to fill, but cap their width so a world only one day old shows a
                single readable column rather than one panel-wide slab. */}
            <div className="absolute inset-0 flex items-end gap-0.5">
              {data.map((point) => (
                <div
                  key={point.day}
                  className="flex-1 h-full flex items-end"
                  style={{ maxWidth: 56 }}
                  {...bind(
                    <>
                      <strong>{dayLabel(point.day)}</strong>
                      <br />
                      {point.value.toLocaleString()} {unit}
                    </>,
                  )}
                >
                  <div
                    className="w-full"
                    style={{
                      height: `${Math.max(1, (point.value / max) * 100)}%`,
                      background: color,
                      borderRadius: '4px 4px 0 0',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div
            className="flex justify-between text-xs tabular mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>{dayLabel(data[0].day)}</span>
            <span>peak {compact(max)}</span>
            {data.length > 1 && <span>{dayLabel(data[data.length - 1].day)}</span>}
          </div>
        </>
      )}
    </div>
  );
}

function PairMatrix({
  pairs,
  characters,
  colors,
  bind,
}: {
  pairs: {
    a: string;
    b: string;
    aName: string;
    bName: string;
    conversations: number;
    messages: number;
  }[];
  characters: { playerId: string; name: string }[];
  colors: Map<string, string>;
  bind: ReturnType<typeof useTooltip>['bind'];
}) {
  const [metric, setMetric] = useState<'messages' | 'conversations'>('messages');

  const lookup = new Map<string, { conversations: number; messages: number }>();
  for (const pair of pairs) {
    lookup.set(`${pair.a} ${pair.b}`, pair);
  }
  const valueFor = (a: string, b: string) => {
    const key = a < b ? `${a} ${b}` : `${b} ${a}`;
    return lookup.get(key)?.[metric] ?? 0;
  };

  const max = Math.max(1, ...pairs.map((p) => p[metric]));

  if (characters.length < 2) {
    return null;
  }

  return (
    <section className="panel p-4">
      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <h2 className="text-sm font-medium">Who talks to whom</h2>
        <div className="flex gap-1 ml-auto">
          {(['messages', 'conversations'] as const).map((m) => (
            <button
              key={m}
              className="tab text-xs"
              aria-selected={metric === m}
              onClick={() => setMetric(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        Darker cells mean more {metric} exchanged. The grid is symmetric, so each pair appears
        twice.
      </p>

      <div className="overflow-x-auto">
        <table className="border-separate" style={{ borderSpacing: 2 }}>
          <thead>
            <tr>
              <th />
              {characters.map((character) => (
                <th
                  key={character.playerId}
                  className="text-xs font-normal align-bottom px-1"
                  style={{ color: 'var(--text-muted)', height: 70 }}
                >
                  <span
                    className="inline-block whitespace-nowrap"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    {character.name}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {characters.map((row) => (
              <tr key={row.playerId}>
                <th
                  className="text-xs font-normal text-right pr-2 whitespace-nowrap"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Swatch color={colors.get(row.playerId)} size={8} />
                    {row.name}
                  </span>
                </th>
                {characters.map((column) => {
                  if (row.playerId === column.playerId) {
                    return (
                      <td
                        key={column.playerId}
                        style={{
                          width: 34,
                          height: 28,
                          background: 'var(--raised)',
                          borderRadius: 4,
                        }}
                      />
                    );
                  }
                  const value = valueFor(row.playerId, column.playerId);
                  const step = sequentialStep(value, max);
                  return (
                    <td
                      key={column.playerId}
                      className="text-xs tabular text-center"
                      style={{
                        width: 34,
                        height: 28,
                        borderRadius: 4,
                        background: value === 0 ? 'var(--raised)' : step,
                        color: value === 0 ? 'var(--text-muted)' : inkOn(step),
                      }}
                      {...bind(
                        <>
                          <strong>
                            {row.name} ↔ {column.name}
                          </strong>
                          <br />
                          {value.toLocaleString()} {metric}
                        </>,
                      )}
                    >
                      {value === 0 ? '·' : compact(value)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span>0</span>
        <span className="flex" style={{ gap: 2 }}>
          {SEQUENTIAL.map((step) => (
            <span key={step} style={{ width: 16, height: 10, background: step, borderRadius: 2 }} />
          ))}
        </span>
        <span>
          {compact(max)} {metric}
        </span>
      </div>
    </section>
  );
}

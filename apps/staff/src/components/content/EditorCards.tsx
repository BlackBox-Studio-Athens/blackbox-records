import { useCallback, useState, type ReactNode } from 'react';
import { DraftProblemContext } from '../fields/draft-problems';
import { Check, ChevronDown, Minus } from 'lucide-react';
import type { ContentValidation } from '../publication/content-validation';
import { cn } from '../ui/utils';
import { at } from './collection-cards';

export type CardState = 'done' | 'missing' | 'optional' | 'problem';

export type EditorCard = {
  id: string;
  title: string;
  /** Stored field paths this card edits; validation messages under them belong to the card. */
  paths: readonly string[];
  /** One plain-language line describing the stored values. */
  summary: string;
  content: ReactNode;
};

const stateText: Record<CardState, string> = {
  done: 'Done',
  missing: 'Required, missing',
  optional: 'Optional',
  problem: 'Needs attention',
};

const isEmpty = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === '' ||
  (Array.isArray(value) && value.length === 0) ||
  (typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length === 0);

/**
 * A card with validation messages is a problem once anything in it is filled, and required-and-missing while
 * it is still empty. Without messages it is done when filled and optional when empty.
 */
export function cardState(
  paths: readonly string[],
  data: Record<string, unknown>,
  validation: Pick<ContentValidation, 'byPath'>,
): CardState {
  const filled = paths.some((path) => !isEmpty(at(data, path)));
  const failing = Object.keys(validation.byPath).some((key) =>
    paths.some((path) => key === path || key.startsWith(`${path}.`)),
  );
  if (failing) return filled ? 'problem' : 'missing';
  return filled ? 'done' : 'optional';
}

function StateMark({ state }: { state: CardState }) {
  const base = 'inline-flex size-5 shrink-0 items-center justify-center rounded-full';
  if (state === 'done')
    return (
      <span aria-hidden="true" className={cn(base, 'bg-[oklch(0.3_0.06_150)] text-[oklch(0.88_0.1_150)]')}>
        <Check className="size-3" strokeWidth={3} />
      </span>
    );
  if (state === 'missing')
    return <span aria-hidden="true" className={cn(base, 'border-[1.5px] border-dashed border-input')} />;
  if (state === 'optional')
    return (
      <span aria-hidden="true" className={cn(base, 'bg-secondary text-muted-foreground')}>
        <Minus className="size-3" />
      </span>
    );
  return (
    <span
      aria-hidden="true"
      className={cn(base, 'bg-[oklch(0.32_0.08_25)] text-xs font-bold text-[oklch(0.88_0.08_25)]')}
    >
      !
    </span>
  );
}

/**
 * An editor as an ordered stack of task cards. Each card is a native `<details>` in one exclusive group,
 * so at most one is open, Enter and Space toggle it, and the shared focus-first-invalid step can open it.
 * Every card body stays mounted; cards hold no draft values, only the messages fields report about them.
 */
export default function EditorCards({
  name,
  cards,
  data,
  validation,
}: {
  /** Groups the cards so opening one closes the other. */
  name: string;
  cards: readonly EditorCard[];
  data: Record<string, unknown>;
  validation: Pick<ContentValidation, 'byPath'>;
}) {
  return (
    <div className="col-span-full grid min-w-0 gap-2.5" data-editor-cards={name}>
      {cards.map((card) => (
        <Card key={card.id} name={name} card={card} stored={cardState(card.paths, data, validation)} />
      ))}
    </div>
  );
}

/** One card. Typed text a field cannot store yet turns the card into a problem with that field's message. */
function Card({ name, card, stored }: { name: string; card: EditorCard; stored: CardState }) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const report = useCallback(
    (key: string, message: string) =>
      setDrafts((current) => {
        if ((current[key] ?? '') === message) return current;
        const next = { ...current };
        if (message) next[key] = message;
        else delete next[key];
        return next;
      }),
    [],
  );
  const draftMessage = Object.values(drafts)[0];
  const state: CardState = draftMessage ? 'problem' : stored;
  const summary = draftMessage ?? card.summary;
  return (
    <details
      name={name}
      data-editor-card={card.id}
      data-state={state}
      className={cn(
        'group min-w-0 rounded-lg border border-border bg-card open:border-primary',
        state === 'problem' && 'open:border-destructive',
      )}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || !event.currentTarget.open) return;
        event.preventDefault();
        event.currentTarget.open = false;
        event.currentTarget.querySelector('summary')?.focus();
      }}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2.5 rounded-lg px-3.5 py-2.5 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-details-marker]:hidden">
        <StateMark state={state} />
        <span className="shrink-0 font-semibold">{card.title}</span>
        <span className="sr-only">, {stateText[state]}, </span>
        <span
          className={cn(
            'ml-auto min-w-0 truncate text-right text-sm text-muted-foreground',
            state === 'missing' && 'text-[var(--warning,oklch(0.84_0.13_85))]',
            state === 'problem' && 'text-destructive',
          )}
        >
          {summary}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div className="grid min-w-0 gap-6 border-t border-border px-3.5 pt-4 pb-5 @2xl:grid-cols-2">
        <DraftProblemContext.Provider value={report}>{card.content}</DraftProblemContext.Provider>
      </div>
    </details>
  );
}

import { BandcampPage, BandcampRecording } from '@blackbox/content-model';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'lucide-react';
import { editorialRequest } from '../../lib/backend/editorial-api';
import { bandcampRecordingFromInput } from '../publication/content-validation';
import { Button } from '../ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';

export type BandcampInput =
  | { status: 'empty'; text: string }
  | { status: 'editing' | 'resolving'; text: string; page: BandcampPage }
  | { status: 'resolved'; text: string; recording: BandcampRecording }
  | { status: 'failed'; text: string; message: string };

export function bandcampInput(text: string): BandcampInput {
  if (!text.trim()) return { status: 'empty', text };
  const recording = bandcampRecordingFromInput(text);
  if (recording) return { status: 'resolved', text, recording };
  const page = BandcampPage.parse(text);
  if (page) return { status: 'editing', text, page };
  return { status: 'failed', text, message: 'Use a Bandcamp album or track URL, or its Share/Embed code.' };
}

export function bandcampInputPending(input: BandcampInput) {
  return input.status !== 'empty' && input.status !== 'resolved';
}

export default function BandcampField({
  stored,
  base,
  disabled,
  errors,
  onChange,
  onPendingChange,
}: {
  stored: string;
  base: string;
  disabled: boolean;
  errors: string[];
  onChange(value: string): void;
  onPendingChange?: ((pending: boolean) => void) | undefined;
}) {
  const [input, setInput] = useState<BandcampInput>(() => bandcampInput(stored));
  const text = input.text;
  const page = 'page' in input ? input.page : null;
  const callbacks = useRef({ onChange, onPendingChange });
  callbacks.current = { onChange, onPendingChange };
  const request = useRef<AbortController | null>(null);
  const pending = bandcampInputPending(input);

  useEffect(() => {
    callbacks.current.onPendingChange?.(pending);
  }, [pending]);
  useEffect(
    () => () => {
      request.current?.abort();
      callbacks.current.onPendingChange?.(false);
    },
    [],
  );

  useEffect(() => {
    if (!page) return;
    const controller = new AbortController();
    request.current = controller;
    const timer = window.setTimeout(() => {
      setInput({ status: 'resolving', text, page });
      void editorialRequest<unknown>(base, 'blackbox/bandcamp/resolve', { url: page.url }, 'POST', controller.signal)
        .then((result) => {
          if (controller.signal.aborted) return;
          const recording = BandcampRecording.parse(result);
          if (!recording || recording.kind !== page.kind)
            throw new Error('Bandcamp returned an invalid player. Retry or paste its Share/Embed code.');
          setInput({ status: 'resolved', text, recording });
          callbacks.current.onChange(recording.player.embedUrl);
          callbacks.current.onPendingChange?.(false);
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return;
          setInput({
            status: 'failed',
            text,
            message:
              error instanceof Error ? error.message : 'Bandcamp lookup failed. Retry or paste its Share/Embed code.',
          });
        });
    }, 750);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // Resolving retains the page value; new input and Retry create a new one.
  }, [text, page, base]);

  function change(text: string, commit = true) {
    request.current?.abort();
    const next = bandcampInput(text);
    setInput(next);
    callbacks.current.onPendingChange?.(bandcampInputPending(next));
    if (commit && next.status === 'empty') callbacks.current.onChange('');
    if (commit && next.status === 'resolved') callbacks.current.onChange(next.recording.player.embedUrl);
  }

  const invalid = input.status === 'failed' || errors.length > 0;
  const id = 'content-bandcamp_embed_url';
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={id} icon={Link}>
        Bandcamp player
      </FieldLabel>
      <Input
        id={id}
        data-content-path="bandcamp_embed_url"
        value={input.text}
        disabled={disabled}
        aria-invalid={invalid}
        aria-busy={input.status === 'resolving'}
        aria-describedby={`${id}-help ${id}-status ${id}-error`}
        onChange={(event) => change(event.target.value)}
      />
      <FieldDescription id={`${id}-help`}>
        Optional. Paste a Bandcamp album or track URL, or its Share/Embed code.
      </FieldDescription>
      <p id={`${id}-status`} role="status" className="text-sm text-muted-foreground">
        {input.status === 'editing' || input.status === 'resolving'
          ? 'Finding the Bandcamp player. Saving waits until it is resolved.'
          : input.status === 'resolved'
            ? 'Bandcamp player ready.'
            : input.status === 'failed'
              ? 'Resolve, revert or clear this field before saving.'
              : ''}
      </p>
      <FieldError id={`${id}-error`}>{input.status === 'failed' ? input.message : errors.join(' ')}</FieldError>
      {pending && (
        <div className="flex flex-wrap gap-2">
          {input.status === 'failed' && BandcampPage.parse(input.text) && (
            <Button type="button" variant="outline" disabled={disabled} onClick={() => change(input.text, false)}>
              Retry
            </Button>
          )}
          <Button type="button" variant="outline" disabled={disabled} onClick={() => change(stored, false)}>
            Revert
          </Button>
          <Button type="button" variant="ghost" disabled={disabled} onClick={() => change('')}>
            Clear
          </Button>
        </div>
      )}
    </Field>
  );
}

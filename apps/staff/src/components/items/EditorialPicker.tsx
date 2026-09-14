import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  editorialRequest,
  uploadArtwork,
  type EditorialList,
  type EditorialMedia,
  type EditorialRecord,
} from '../../lib/backend/editorial-api';

type Choice = EditorialRecord | EditorialMedia;
export default function EditorialPicker({
  base,
  collection,
  label,
  value,
  selectedLabel,
  onSelect,
}: {
  base: string;
  collection: 'artists' | 'releases' | 'distro' | 'media';
  label: string;
  value: string;
  selectedLabel?: string;
  onSelect(item: Choice): void;
}) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Choice[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [preview, setPreview] = useState('');
  const name = (item: Choice) => ('filename' in item ? item.filename : String(item.data.title ?? item.slug));
  async function search(next?: string) {
    setBusy(true);
    setMessage('');
    try {
      const params = new URLSearchParams({ limit: '25' });
      if (query.trim()) params.set('q', query.trim());
      if (next) params.set('cursor', next);
      if (collection === 'media') params.set('mimeType', 'image/jpeg,image/png,image/webp,image/avif');
      const page = await editorialRequest<EditorialList<Choice>>(
        base,
        `${collection === 'media' ? 'media' : `content/${collection}`}?${params}`,
      );
      setItems((previous) => (next ? [...previous, ...page.items] : page.items));
      setCursor(page.nextCursor);
      if (!page.items.length) setMessage('No matching records.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not load records.');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    void search();
  }, []);
  function select(item: Choice) {
    setSelectedName(name(item));
    onSelect(item);
    if ('url' in item) {
      const origin = new URL(base || window.location.origin).origin;
      const url = new URL(item.url, origin);
      setPreview(url.origin === origin && url.pathname.startsWith('/_emdash/api/media/file/') ? url.href : '');
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage('');
    try {
      const item = await uploadArtwork(base, file);
      setItems((previous) => [item, ...previous.filter((row) => row.id !== item.id)]);
      select(item);
      setMessage('Image uploaded.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not upload the image.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid min-w-0 gap-3">
      <label className="grid gap-2">
        Search {label.toLowerCase()}
        <Input
          value={query}
          maxLength={200}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (!busy) void search();
            }
          }}
        />
      </label>
      <Button type="button" disabled={busy} onClick={() => void search()}>
        Search {label.toLowerCase()}
      </Button>
      <label className="grid gap-2">
        {label}
        <select
          className="min-h-11 w-full min-w-0 border border-border bg-background p-2"
          value={value}
          disabled={busy}
          onChange={(event) => {
            const item = items.find((row) => row.id === event.target.value);
            if (item) select(item);
          }}
          required
        >
          <option value="">Choose {label.toLowerCase()}</option>
          {value && !items.some((row) => row.id === value) && (
            <option value={value}>{selectedLabel || selectedName}</option>
          )}
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {name(item)}
            </option>
          ))}
        </select>
      </label>
      {preview && <img src={preview} alt="Selected artwork" className="max-h-48 max-w-full object-contain" />}
      {cursor && (
        <Button type="button" disabled={busy} onClick={() => void search(cursor)}>
          Show more
        </Button>
      )}
      {collection === 'media' && (
        <label className="grid gap-2">
          Or upload an image
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            disabled={busy}
            onChange={(event) => void upload(event.target.files?.[0])}
          />
          <span className="text-sm text-muted-foreground">JPG, PNG, WebP or AVIF, up to 20 MB.</span>
        </label>
      )}
      {(busy || message) && (
        <p role="status" className="text-sm">
          {busy ? 'Loading…' : message}
        </p>
      )}
    </div>
  );
}

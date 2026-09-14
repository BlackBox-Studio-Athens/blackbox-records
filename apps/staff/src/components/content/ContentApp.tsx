import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import ContentFields, { contentSections, type ContentSection, type ContentData } from './ContentFields';
import ContentPreview from './ContentPreview';
import {
  EditorialApiError,
  editorialRequest,
  editorialSlug,
  editorialWriteData,
  type EditorialList,
  type EditorialRecord,
} from '../../lib/backend/editorial-api';

type Document = { item: EditorialRecord; _rev: string };
function contentSave(document: Document, data: ContentData) {
  if (!document._rev) throw new Error('Load the saved version before saving.');
  // The saved slug and identity remain unchanged when the member renames a title.
  return { _rev: document._rev, data: editorialWriteData(data) };
}

export default function ContentApp({ backendBaseUrl: base }: { backendBaseUrl: string }) {
  const [collection, setCollection] = useState<ContentSection>('artists');
  const [items, setItems] = useState<EditorialRecord[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [query, setQuery] = useState('');
  const [document, setDocument] = useState<Document | null>(null);
  const [data, setData] = useState<ContentData>({});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pendingNew, setPendingNew] = useState<ContentData | null>(null);
  const pendingKey = `blackbox-content-create:${base}`;

  async function list(section = collection, next?: string, search = query) {
    setBusy(true);
    try {
      const params = new URLSearchParams({ limit: '25' });
      if (search.trim()) params.set('q', search.trim());
      if (next) params.set('cursor', next);
      const page = await editorialRequest<EditorialList<EditorialRecord>>(base, `content/${section}?${params}`);
      setItems((previous) => (next ? [...previous, ...page.items] : page.items));
      setCursor(page.nextCursor);
    } catch {
      setMessage('We could not load the content. Select Search to try again.');
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    setReady(true);
    const pending = sessionStorage.getItem(pendingKey);
    if (pending) {
      try {
        const saved = JSON.parse(pending) as { collection: ContentSection; slug: string; data: ContentData };
        if (!['news', 'socials'].includes(saved.collection)) throw new Error('Unsupported section');
        setCollection(saved.collection);
        setDocument({ item: { id: '', slug: saved.slug, data: saved.data }, _rev: '' });
        setData(saved.data);
        setPendingNew(saved.data);
        setMessage('Check the last save before creating another record.');
        void list(saved.collection);
      } catch {
        setMessage('The last save could not be read. Ask a label administrator for help.');
      }
    } else void list();
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  function mayLeave() {
    return !dirty || window.confirm('Discard your unsaved changes?');
  }
  async function open(item: EditorialRecord, replace = false) {
    if (!replace && !mayLeave()) return;
    setBusy(true);
    setMessage('');
    try {
      const loaded = await editorialRequest<Document>(base, `content/${collection}/${encodeURIComponent(item.id)}`);
      setDocument(loaded);
      setData(loaded.item.data);
      setDirty(false);
      setConflict(false);
    } catch {
      setMessage('We could not load this record. Try again.');
    } finally {
      setBusy(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!document || busy || conflict) return;
    setBusy(true);
    setMessage('');
    try {
      const saved = await editorialRequest<Document>(
        base,
        `content/${collection}/${encodeURIComponent(document.item.id)}`,
        contentSave(document, data),
        'PUT',
      );
      setDocument(saved);
      setData(saved.item.data);
      setDirty(false);
      setItems((items) => items.map((item) => (item.id === saved.item.id ? saved.item : item)));
      setMessage('Draft saved. The public site has not changed.');
    } catch (error) {
      setConflict(error instanceof EditorialApiError && error.status === 409);
      setMessage(error instanceof Error ? error.message : 'We could not confirm the save. Your text is still here.');
    } finally {
      setBusy(false);
    }
  }
  async function create() {
    if (!mayLeave() || !['news', 'socials'].includes(collection)) return;
    // Start locally. The server receives the first write only after the form is valid.
    setDocument({ item: { id: '', slug: editorialSlug(collection, crypto.randomUUID()), data: {} }, _rev: '' });
    setData(
      collection === 'news'
        ? { title: '', date: '', summary: '', image: null, image_alt: '', body: [] }
        : { title: '', url: '', order: 0 },
    );
    setDirty(false);
    setConflict(false);
    setMessage('');
  }
  async function saveNew(event: React.FormEvent) {
    if (document?.item.id) return save(event);
    event.preventDefault();
    if (!document || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const commandData = pendingNew ?? editorialWriteData(data);
      sessionStorage.setItem(pendingKey, JSON.stringify({ collection, slug: document.item.slug, data: commandData }));
      setPendingNew(commandData);
      let saved: Document;
      try {
        saved = await editorialRequest<Document>(base, `content/${collection}/${document.item.slug}`);
      } catch (error) {
        if (!(error instanceof EditorialApiError) || error.status !== 404) throw error;
        saved = await editorialRequest<Document>(base, `content/${collection}`, {
          slug: document.item.slug,
          data: commandData,
        });
      }
      sessionStorage.removeItem(pendingKey);
      setPendingNew(null);
      setDocument(saved);
      setData(saved.item.data);
      setItems((items) => [saved.item, ...items.filter((item) => item.id !== saved.item.id)]);
      setDirty(false);
      setMessage('Draft created. The public site has not changed.');
    } catch (error) {
      if (error instanceof EditorialApiError && [400, 422].includes(error.status)) {
        sessionStorage.removeItem(pendingKey);
        setPendingNew(null);
      }
      setMessage(error instanceof Error ? error.message : 'We could not confirm the save. Your text is still here.');
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!document?.item.id || busy || !['news', 'socials'].includes(collection)) return;
    if (!window.confirm(`Move ${String(document.item.data.title)} to trash?`)) return;
    setBusy(true);
    try {
      await editorialRequest(
        base,
        `content/${collection}/${encodeURIComponent(document.item.id)}`,
        { _rev: document._rev, confirm: true },
        'DELETE',
      );
      setItems((items) => items.filter((item) => item.id !== document.item.id));
      setDocument(null);
      setDirty(false);
      setMessage('Moved to trash. The public site has not changed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not confirm the change.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 sm:px-8">
      <header>
        <h1 className="text-3xl font-semibold">Content</h1>
        <p className="mt-3 text-muted-foreground">Edit the label’s pages and save a draft.</p>
      </header>
      <fieldset disabled={!ready || busy || !!pendingNew} className="grid min-w-0 gap-4">
        <label className="grid gap-2">
          Section
          <select
            className="min-h-11 w-full border border-border bg-background p-2"
            value={collection}
            onChange={(event) => {
              if (!mayLeave()) return;
              const section = event.target.value as ContentSection;
              setCollection(section);
              setQuery('');
              setDocument(null);
              setDirty(false);
              setMessage('');
              void list(section, undefined, '');
            }}
          >
            {Object.entries(contentSections).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void list();
          }}
        >
          <label className="grid min-w-0 flex-1 gap-2">
            Search content
            <Input value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <Button type="submit">Search</Button>
        </form>
        {['news', 'socials'].includes(collection) && (
          <Button type="button" variant="outline" onClick={() => void create()}>
            Add {collection === 'news' ? 'news' : 'social link'}
          </Button>
        )}
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className="min-h-11 w-full p-3 text-left underline underline-offset-4"
                onClick={() => void open(item)}
              >
                {String(item.data.title ?? contentSections[collection])}
              </button>
            </li>
          ))}
        </ul>
        {!items.length && <p>{busy ? 'Loading content…' : 'No matching content.'}</p>}
        {cursor && (
          <Button type="button" variant="outline" onClick={() => void list(collection, cursor)}>
            Show more
          </Button>
        )}
      </fieldset>
      {message && (
        <p role={conflict ? 'alert' : 'status'} className="whitespace-pre-wrap border border-border p-4">
          {message}
        </p>
      )}
      {document && (
        <form onSubmit={saveNew} className="grid min-w-0 gap-6">
          <h2 className="break-words text-2xl font-semibold">
            {String(document.item.data.title ?? contentSections[collection])}
          </h2>
          <fieldset disabled={busy || !!pendingNew} className="grid min-w-0 gap-6">
            <ContentFields
              key={`${document.item.id || document.item.slug}:${document._rev}`}
              collection={collection}
              data={data}
              base={base}
              disabled={busy || !!pendingNew}
              onChange={(next) => {
                setData(next);
                setDirty(true);
              }}
            />
          </fieldset>
          <div className="flex flex-wrap gap-3">
            {document.item.id && ['news', 'socials'].includes(collection) && (
              <Button type="button" variant="outline" disabled={busy || dirty} onClick={() => void remove()}>
                Move to trash
              </Button>
            )}
            {['home', 'about', 'services', 'artists', 'releases', 'distro', 'news'].includes(collection) && (
              <Button type="button" variant="outline" onClick={() => setPreview(!preview)}>
                {preview ? 'Hide preview' : 'Preview draft'}
              </Button>
            )}
            <Button type="submit" disabled={busy || conflict}>
              {busy ? 'Saving…' : pendingNew ? 'Check last save' : 'Save draft'}
            </Button>
            {document.item.id && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  if (mayLeave()) void open(document.item, true);
                }}
              >
                Load saved version
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{dirty ? 'You have unsaved changes.' : 'No unsaved changes.'}</p>
          {preview && <ContentPreview collection={collection} data={data} base={base} />}
        </form>
      )}
    </div>
  );
}

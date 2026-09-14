import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import ContentFields, { contentSections, type ContentSection, type ContentData } from './ContentFields';
import ContentPreview from './ContentPreview';
import {
  readContentPublications,
  requestContentPublication,
  type ContentPublication,
  type PublicationRequest,
} from '../../lib/backend/content-publication-api';
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
  const [confirmReload, setConfirmReload] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState(false);
  const [pendingNew, setPendingNew] = useState<ContentData | null>(null);
  const [publications, setPublications] = useState<ContentPublication[]>([]);
  const [publicationMessage, setPublicationMessage] = useState('');
  const [pendingPublication, setPendingPublication] = useState<PublicationRequest | null>(null);
  const pendingKey = `blackbox-content-create:${base}`;
  const publicationKey = `blackbox-content-publication:${base}`;

  async function publicationStatus() {
    try {
      const result = await readContentPublications(base);
      setPublications(result.items);
      setPublicationMessage(result.items.length ? '' : 'No publication requests yet.');
    } catch {
      setPublicationMessage('Publication status is unavailable. Check again before assuming a change is live.');
    }
  }
  async function publish() {
    if (busy || dirty || conflict || !document?.item.id) return;
    setBusy(true);
    setPublicationMessage('Requesting publication…');
    try {
      let input = pendingPublication;
      if (!input) {
        const published = await editorialRequest<Document>(
          base,
          `content/${collection}/${encodeURIComponent(document.item.id)}/publish`,
          { _rev: document._rev },
        );
        setDocument(published);
        setData(published.item.data);
        if (!published.item.liveRevisionId) throw new Error('Load the saved version before publishing again.');
        input = { id: crypto.randomUUID(), requestedRevision: published.item.liveRevisionId };
        localStorage.setItem(publicationKey, JSON.stringify(input));
        setPendingPublication(input);
      }
      const accepted = await requestContentPublication(base, input);
      localStorage.removeItem(publicationKey);
      setPendingPublication(null);
      setPublications((items) => [accepted, ...items.filter((item) => item.id !== accepted.id)].slice(0, 10));
      setPublicationMessage(
        accepted.status === 'live'
          ? 'Publication is live on fresh public page loads.'
          : accepted.status === 'failed'
            ? 'Publication failed. Publish saved content to try again.'
            : 'Publication requested. Wait for Live before checking a fresh public page.',
      );
    } catch (error) {
      if (error instanceof EditorialApiError && [400, 409].includes(error.status)) {
        localStorage.removeItem(publicationKey);
        setPendingPublication(null);
        setConflict(error.status === 409);
      }
      setPublicationMessage(error instanceof Error ? error.message : 'Publication could not be confirmed.');
    } finally {
      setBusy(false);
    }
  }

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
    const publication = localStorage.getItem(publicationKey);
    if (publication) {
      try {
        const input = JSON.parse(publication) as PublicationRequest;
        if (typeof input.id !== 'string' || typeof input.requestedRevision !== 'string') throw new Error();
        setPendingPublication(input);
      } catch {
        setPublicationMessage('The last publication request could not be read. Ask a label administrator for help.');
      }
    }
    void publicationStatus();
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
    } else {
      const selected = new URLSearchParams(window.location.search);
      const section = selected.get('collection');
      const id = selected.get('id');
      if (section && Object.hasOwn(contentSections, section) && id) {
        setCollection(section as ContentSection);
        void list(section as ContentSection);
        void editorialRequest<Document>(base, `content/${section}/${encodeURIComponent(id)}`)
          .then((loaded) => {
            setDocument(loaded);
            setData(loaded.item.data);
          })
          .catch(() => setMessage('The selected content could not be loaded. Search to try again.'));
      } else void list();
    }
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
    if (!dirty) return true;
    setMessage('Save your draft or load the saved version before switching content.');
    return false;
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
        <p className="mt-3 text-muted-foreground">
          Edit the label’s pages, preview a draft, and publish saved content.
        </p>
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
                  if (dirty) setConfirmReload(true);
                  else void open(document.item, true);
                }}
              >
                Load saved version
              </Button>
            )}
          </div>
          {confirmReload && (
            <div role="alert" className="grid gap-3 border border-border p-4">
              <p>Discard your unsaved changes and load the saved version?</p>
              <div className="flex flex-wrap gap-3">
                <Button type="button" variant="outline" onClick={() => setConfirmReload(false)}>
                  Keep editing
                </Button>
                <Button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setConfirmReload(false);
                    void open(document.item, true);
                  }}
                >
                  Discard changes and reload
                </Button>
              </div>
            </div>
          )}
          <p className="text-sm text-muted-foreground">{dirty ? 'You have unsaved changes.' : 'No unsaved changes.'}</p>
          {!['releases', 'distro'].includes(collection) && (
            <Button
              type="button"
              disabled={busy || dirty || conflict || !document.item.id}
              onClick={() => void publish()}
            >
              {pendingPublication ? 'Retry publication request' : 'Publish saved content'}
            </Button>
          )}
          {preview && <ContentPreview collection={collection} data={data} base={base} />}
        </form>
      )}
      <section aria-label="Recent publications" className="grid gap-3 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">Recent publications</h2>
        <p className="text-sm text-muted-foreground">
          Saved drafts are private. Accepted requests remain saved after you close this page. Live applies to fresh
          public page loads; an already-open music player is not reloaded.
        </p>
        <Button type="button" variant="outline" disabled={!ready || busy} onClick={() => void publicationStatus()}>
          Check publication status
        </Button>
        {publicationMessage && <p role="status">{publicationMessage}</p>}
        <ul className="divide-y divide-border">
          {publications.map((item) => (
            <li key={item.id} className="py-3">
              <strong>{item.status === 'live' ? 'Live' : item.status === 'failed' ? 'Failed' : 'Pending'}</strong>
              {' · '}
              {new Date(item.requestedAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

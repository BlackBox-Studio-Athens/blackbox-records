import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { ArrowLeft, Eye, FileText, MoreHorizontal, Plus, RefreshCw, Save, Search, Send } from 'lucide-react';
import { Badge } from '../ui/badge';
import { ButtonGroup } from '../ui/button-group';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../ui/input-group';
import { Table, TableBody, TableRow, TableCell } from '../ui/table';
import { SidebarProvider, SidebarTrigger } from '../ui/sidebar';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage, BreadcrumbSeparator } from '../ui/breadcrumb';
import { Separator } from '../ui/separator';
import { Skeleton } from '../ui/skeleton';
import { Spinner } from '../ui/spinner';
import { Alert, AlertDescription } from '../ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../ui/alert-dialog';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import ContentNavigation from './ContentNavigation';
import MediaLibrary from './MediaLibrary';
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
  const [media, setMedia] = useState(false);
  const [mobileEditor, setMobileEditor] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const editorHeading = useRef<HTMLHeadingElement>(null);
  const previewTrigger = useRef<HTMLButtonElement>(null);
  const listHeading = useRef<HTMLHeadingElement>(null);
  function updateUrl(section: ContentSection, id?: string, mediaView = false) {
    const params = new URLSearchParams({ collection: section });
    if (id) params.set('id', id);
    if (mediaView) params.set('view', 'media');
    window.history.replaceState(null, '', `${window.location.pathname}?${params}`);
  }
  useEffect(() => {
    if (mobileEditor && !media) editorHeading.current?.focus();
  }, [mobileEditor, media]);
  const [document, setDocument] = useState<Document | null>(null);
  const [data, setData] = useState<ContentData>({});
  const [dirty, setDirty] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  const [busy, setIsBusy] = useState(false);
  const busyFocus = useRef<HTMLElement | null>(null);
  function setBusy(value: boolean) {
    if (value) busyFocus.current = window.document.activeElement as HTMLElement | null;
    setIsBusy(value);
  }
  useEffect(() => {
    if (busy) return;
    if (busyFocus.current?.isConnected && window.document.activeElement === window.document.body) {
      busyFocus.current.focus();
    }
    busyFocus.current = null;
  }, [busy]);
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
        setMobileEditor(true);
        setMessage('Check the last save before creating another record.');
        void list(saved.collection);
      } catch {
        setMessage('The last save could not be read. Ask a label administrator for help.');
      }
    } else {
      const selected = new URLSearchParams(window.location.search);
      setMedia(selected.get('view') === 'media');
      const section = selected.get('collection');
      const id = selected.get('id');
      if (section && Object.hasOwn(contentSections, section)) {
        setCollection(section as ContentSection);
        void list(section as ContentSection);
        if (id)
          void editorialRequest<Document>(base, `content/${section}/${encodeURIComponent(id)}`)
            .then((loaded) => {
              setDocument(loaded);
              setData(loaded.item.data);
              setMobileEditor(true);
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
      setMobileEditor(true);
      updateUrl(collection, loaded.item.id);
      editorHeading.current?.focus();
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
    setMobileEditor(true);
    updateUrl(collection);
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
      updateUrl(collection, saved.item.id);
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
    setConfirmTrash(false);
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
      setMobileEditor(false);
      updateUrl(collection);
      listHeading.current?.focus();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'We could not confirm the change.');
    } finally {
      setBusy(false);
    }
  }
  function selectCollection(section: ContentSection) {
    if (section === collection) {
      setMedia(false);
      updateUrl(collection, document?.item.id);
      return;
    }
    if (!mayLeave()) {
      setMedia(false);
      return;
    }
    setCollection(section);
    setMedia(false);
    setQuery('');
    setDocument(null);
    setItems([]);
    setCursor(undefined);
    setDirty(false);
    setMobileEditor(false);
    setMessage('');
    updateUrl(section);
    void list(section, undefined, '');
  }
  const canCreate = ['news', 'socials'].includes(collection);
  const canPreview = ['home', 'about', 'services', 'artists', 'releases', 'distro', 'news'].includes(collection);
  const canPublish = !['releases', 'distro'].includes(collection);
  const title = String(data.title || data.label_name || contentSections[collection]);
  return (
    <SidebarProvider
      className="cms-surface cms-workspace"
      style={{ '--sidebar-width': '220px' } as React.CSSProperties}
    >
      <ContentNavigation
        collection={collection}
        media={media}
        disabled={!ready || busy || !!pendingNew}
        onCollection={selectCollection}
        onMedia={() => {
          setMedia(true);
          updateUrl(collection, document?.item.id, true);
        }}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="cms-workspace-bar flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
          <SidebarTrigger className="size-11 shrink-0" />
          <Separator orientation="vertical" className="h-5" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>Content</BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{media ? 'Media library' : contentSections[collection]}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {media && document && (
            <Button
              type="button"
              variant="ghost"
              className="ml-auto"
              aria-label="Back to draft"
              onClick={() => {
                setMedia(false);
                updateUrl(collection, document.item.id);
              }}
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Back to draft</span>
            </Button>
          )}
        </div>
        {media && (
          <section className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-8">
            <div className="mx-auto max-w-6xl">
              <h1 className="text-2xl font-semibold">Media library</h1>
              <p className="mt-2 mb-8 text-sm text-muted-foreground">Images for your artists, releases and pages.</p>
              <MediaLibrary base={base} />
            </div>
          </section>
        )}
        <div className="cms-content-panes" hidden={media}>
          <section
            aria-label="Content records"
            className={`cms-records ${mobileEditor ? 'cms-records-mobile-hidden' : ''}`}
          >
            <div className="grid gap-4 border-b border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <h1 ref={listHeading} tabIndex={-1} className="text-base font-semibold outline-none">
                  {contentSections[collection]}
                </h1>
                <Badge variant="secondary">
                  {items.length}
                  {cursor ? '+' : ''}
                </Badge>
              </div>
              <form
                className="grid gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!busy) void list();
                }}
              >
                <InputGroup className="h-11">
                  <InputGroupAddon>
                    <Search aria-hidden="true" />
                  </InputGroupAddon>
                  <InputGroupInput
                    aria-label="Search content"
                    placeholder="Search content"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </InputGroup>
                <Button type="submit" variant="outline" disabled={!ready || busy}>
                  Search
                </Button>
              </form>
              {canCreate && (
                <Button type="button" disabled={!ready || busy || !!pendingNew} onClick={() => void create()}>
                  <Plus className="size-4" aria-hidden="true" />
                  Add {collection === 'news' ? 'news' : 'social link'}
                </Button>
              )}
              {!mobileEditor && document && (
                <Button type="button" variant="secondary" className="md:hidden" onClick={() => setMobileEditor(true)}>
                  Return to draft
                </Button>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {!mobileEditor && message && (
                <Alert role={conflict ? 'alert' : 'status'} className="m-4 w-auto md:hidden">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              {busy && !items.length ? (
                <div className="grid gap-3 p-4" role="status" aria-label="Loading content">
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                  <Skeleton className="h-14" />
                </div>
              ) : (
                <Table>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id} data-state={document?.item.id === item.id ? 'selected' : undefined}>
                        <TableCell className="p-0">
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-auto min-h-16 w-full justify-start rounded-none px-4 py-3 text-left whitespace-normal"
                            disabled={!ready || busy || !!pendingNew}
                            aria-current={document?.item.id === item.id ? 'true' : undefined}
                            onClick={() => void open(item)}
                          >
                            <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <span className="min-w-0 break-words">
                              {String(item.data.title ?? item.data.label_name ?? contentSections[collection])}
                            </span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!busy && !items.length && (
                <p className="p-6 text-sm text-muted-foreground">No matching content. Try another search.</p>
              )}
              {cursor && (
                <div className="p-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={busy}
                    onClick={() => void list(collection, cursor)}
                  >
                    Show more
                  </Button>
                </div>
              )}
            </div>
          </section>
          <section
            aria-label="Content editor"
            className={`cms-editor ${!mobileEditor ? 'cms-editor-mobile-hidden' : ''}`}
          >
            {document ? (
              <>
                <header className="cms-editor-toolbar">
                  <div className="flex min-w-0 items-start gap-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 md:hidden"
                      aria-label="Back to records"
                      onClick={() => {
                        setMobileEditor(false);
                        requestAnimationFrame(() => listHeading.current?.focus());
                      }}
                    >
                      <ArrowLeft className="size-4" />
                    </Button>
                    <div className="min-w-0">
                      <h2 ref={editorHeading} tabIndex={-1} className="truncate text-xl font-semibold outline-none">
                        {title}
                      </h2>
                      <p role="status" className="mt-1 text-xs text-muted-foreground">
                        {dirty ? 'Unsaved changes' : 'No unsaved changes'} · Private draft
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ButtonGroup aria-label="Draft actions">
                      {canPreview && (
                        <Button
                          ref={previewTrigger}
                          type="button"
                          variant="outline"
                          disabled={busy}
                          onClick={() => setPreview(true)}
                        >
                          <Eye className="size-4" aria-hidden="true" />
                          Preview
                        </Button>
                      )}
                      <Button type="submit" form="content-editor-form" disabled={busy || conflict}>
                        {busy ? <Spinner className="size-4" /> : <Save className="size-4" aria-hidden="true" />}
                        {pendingNew ? 'Check last save' : 'Save draft'}
                      </Button>
                    </ButtonGroup>
                    {canPublish && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span tabIndex={0}>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={busy || dirty || conflict || !document.item.id}
                              onClick={() => void publish()}
                            >
                              <Send className="size-4" aria-hidden="true" />
                              {pendingPublication ? 'Retry publication request' : 'Publish saved content'}
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Save your draft before requesting publication.</TooltipContent>
                      </Tooltip>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="More draft actions"
                          disabled={busy || !!pendingNew}
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="cms-surface" align="end">
                        <DropdownMenuItem
                          disabled={!document.item.id}
                          onSelect={() => {
                            if (dirty) setConfirmReload(true);
                            else void open(document.item, true);
                          }}
                        >
                          Load saved version
                        </DropdownMenuItem>
                        {canCreate && (
                          <DropdownMenuItem
                            disabled={!document.item.id || dirty}
                            onSelect={() => setConfirmTrash(true)}
                          >
                            Move to trash
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </header>
                <div className="cms-editor-body">
                  {message && (
                    <Alert
                      variant={conflict ? 'destructive' : 'default'}
                      role={conflict ? 'alert' : 'status'}
                      className="mb-6"
                    >
                      <AlertDescription className="whitespace-pre-wrap">{message}</AlertDescription>
                    </Alert>
                  )}
                  {!canPublish && (
                    <p className="mb-6 text-sm text-muted-foreground">
                      Save editorial changes here. Publish linked items from{' '}
                      <a href="/items/" className="underline underline-offset-4">
                        Items
                      </a>
                      .
                    </p>
                  )}
                  <form id="content-editor-form" onSubmit={saveNew}>
                    <fieldset
                      disabled={busy || !!pendingNew}
                      className="cms-fields grid min-w-0 gap-6 @2xl:grid-cols-2"
                    >
                      <legend className="mb-6 text-sm font-semibold">Content details</legend>
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
                  </form>
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-content-center gap-3 p-8 text-center">
                <FileText className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                <h2 className="text-xl font-semibold">Select content to edit</h2>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Choose a record from {contentSections[collection].toLowerCase()} to edit its draft.
                </p>
                {message && (
                  <Alert role="status">
                    <AlertDescription>{message}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            <section aria-label="Recent publications" className="cms-publications border-t border-border p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-semibold">Recent publications</h2>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!ready || busy}
                  onClick={() => void publicationStatus()}
                >
                  <RefreshCw className="size-4" aria-hidden="true" />
                  Check publication status
                </Button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Saved drafts are private. Wait for Live, then reload the public page to see changes. Reloading stops an
                active music player.
              </p>
              {publicationMessage && (
                <p role="status" className="mt-3 text-sm">
                  {publicationMessage}
                </p>
              )}
              <ul className="mt-3 divide-y divide-border">
                {publications.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 py-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className={item.status === 'failed' ? 'text-destructive' : ''}>
                      {item.status === 'live' ? 'Live' : item.status === 'failed' ? 'Failed' : 'Pending'}
                    </Badge>
                    <time dateTime={new Date(item.requestedAt).toISOString()}>
                      {new Date(item.requestedAt).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ul>
            </section>
          </section>
        </div>
      </div>
      <Sheet open={preview} onOpenChange={setPreview}>
        <SheetContent
          className="cms-surface w-full overflow-y-auto sm:max-w-3xl"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            previewTrigger.current?.focus();
          }}
        >
          <SheetHeader>
            <SheetTitle>Draft preview</SheetTitle>
            <SheetDescription>Only signed-in label members can see this draft.</SheetDescription>
          </SheetHeader>
          <div className="p-4">{document && <ContentPreview collection={collection} data={data} base={base} />}</div>
        </SheetContent>
      </Sheet>
      <AlertDialog open={confirmReload} onOpenChange={setConfirmReload}>
        <AlertDialogContent className="cms-surface">
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>Your unsaved edits will be replaced with the saved version.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (document) void open(document.item, true);
              }}
            >
              Discard changes and reload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmTrash} onOpenChange={setConfirmTrash}>
        <AlertDialogContent className="cms-surface">
          <AlertDialogHeader>
            <AlertDialogTitle>Move {title} to trash?</AlertDialogTitle>
            <AlertDialogDescription>The public site will not change until publication.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep content</AlertDialogCancel>
            <AlertDialogAction onClick={() => void remove()}>Move to trash</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
}

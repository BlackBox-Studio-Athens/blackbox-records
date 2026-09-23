import { ArrowDownUp, ClipboardCheck, Disc3 } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import StaffBack from '../StaffBack';
import {
  followStaffHistory,
  rememberStaffPosition,
  restoreStaffPosition,
  returnStaffTask,
  staffLink,
  staffPages,
  writeStaffLocation,
} from '../../lib/staff-navigation';

import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ButtonGroup } from '../ui/button-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { LoadingButtonContent, LoadingInline, LoadingStateBlock } from '../ui/loading-feedback';
import { Textarea } from '../ui/textarea';
import {
  createInternalStockApi,
  InternalStockApiError,
  type InternalStockDetail,
  type InternalStockHistoryResponse,
  type InternalVariantSummary,
} from '../../lib/backend/internal-stock-api';
import { readStaffQuery, useStaffRead } from '../../lib/staff-query';
import { cn } from '../../lib/utils';
import FormatFilter, { formatLabel } from '../items/FormatFilter';
import { editorialRequest, staffThumbnailUrl, type EditorialMedia } from '../../lib/backend/editorial-api';
import {
  recordProgress,
  stocktakeKey,
  stocktakeSchema,
  pendingCountKey,
  pendingCountSchema,
  pendingChangeKey,
  pendingChangeSchema,
  type Stocktake,
} from './stocktake';
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

interface StockOperationsAppProps {
  backendBaseUrl: string;
}

type HistoryEntry = InternalStockHistoryResponse['entries'][number];
export type StockLoadingIntent = 'refresh' | 'search' | 'variant' | 'workspace' | null;
type StockSubmittingIntent = 'stockChange' | 'stockCount' | null;

export default function StockOperationsApp({ backendBaseUrl }: StockOperationsAppProps) {
  const [query, setQuery] = useState('');
  const [ready, setReady] = useState(false);
  const typing = useRef(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [area, setArea] = useState('all');
  const [format, setFormat] = useState('');
  const [nextCursor, setNextCursor] = useState<string>();
  const [pages, setPages] = useState<string[]>(['']);
  const [pageCursor, setPageCursor] = useState('');
  const [artwork, setArtwork] = useState<Record<string, string>>({});
  const [stocktake, setStocktake] = useState<Stocktake | null>(null);
  const [startingStocktake, setStartingStocktake] = useState(false);
  const [leaveAction, setLeaveAction] = useState<(() => void) | null>(null);
  const resolveHistoryLeave = useRef<((allowed: boolean) => void) | null>(null);
  const restorePosition = useRef(true);
  const [countEdited, setCountEdited] = useState(false);
  const [countUnconfirmed, setCountUnconfirmed] = useState(false);
  const focusedVariant = useRef('');
  const inventoryRef = useRef<HTMLElement>(null);
  const [variants, setVariants] = useState<InternalVariantSummary[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [stockDetail, setStockDetail] = useState<InternalStockDetail | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchPending, setIsSearchPending] = useState(true);
  const [searchMessage, setSearchMessage] = useState('Loading items.');
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchRequest = useRef(0);
  const [historyPending, setHistoryPending] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState<StockLoadingIntent>('workspace');
  const [submittingIntent, setSubmittingIntent] = useState<StockSubmittingIntent>(null);
  const isSubmitting = submittingIntent !== null;
  const [statusMessage, setStatusMessage] = useState('Choose an item to see its stock.');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [changeUnconfirmed, setChangeUnconfirmed] = useState(false);
  const [changeDelta, setChangeDelta] = useState('');
  const [stockDirection, setStockDirection] = useState('remove');
  const [stockMode, setStockMode] = useState<'adjust' | 'count'>('adjust');
  const [changeReason, setChangeReason] = useState('manual_adjustment');
  const [changeNotes, setChangeNotes] = useState('');
  const [countedQuantity, setCountedQuantity] = useState('');
  const [onlineQuantity, setOnlineQuantity] = useState('');
  const [countNotes, setCountNotes] = useState('');
  const [expectedRevision, setExpectedRevision] = useState<number | null>(null);
  const [countNeedsReassessment, setCountNeedsReassessment] = useState(false);
  const [hasFreshStock, setHasFreshStock] = useState(false);
  const countVariantRef = useRef('');
  const activeStockLoadRequestRef = useRef(0);

  const api = createInternalStockApi({ backendBaseUrl });
  const selectedStockDetail = canSubmitStockMutation(selectedVariantId, stockDetail) ? stockDetail : null;
  const canMutateSelectedStock = !!selectedStockDetail && hasFreshStock && !isLoading;
  const adjustmentQuantity =
    selectedStockDetail && /^\d+$/.test(changeDelta)
      ? selectedStockDetail.stock.quantity + Number(changeDelta) * (stockDirection === 'remove' ? -1 : 1)
      : null;
  const adjustmentInvalid = adjustmentQuantity !== null && adjustmentQuantity < 0;

  async function searchVariants(nextQuery = query) {
    const requestId = ++searchRequest.current;
    setSearchError(null);
    setIsSearchPending(true);
    setSearchMessage('Searching items.');

    try {
      const page = await readStaffQuery(['inventory-page', backendBaseUrl, nextQuery, area, format, pageCursor], () =>
        api.readInventory({
          q: nextQuery,
          area,
          format: format || undefined,
          cursor: pageCursor || undefined,
        }),
      );
      const results = page.items;
      if (requestId !== searchRequest.current) return;
      setVariants(results);
      setNextCursor(page.nextCursor);
      setSearchMessage(results.length === 0 ? 'No items found.' : `${results.length} items on this page.`);
      const url = new URL(window.location.href);
      for (const [key, value] of Object.entries({ q: nextQuery, area, format, cursor: pageCursor })) {
        if (value) url.searchParams.set(key, value);
        else url.searchParams.delete(key);
      }
      writeStaffLocation(url.pathname + url.search, { pages });
      if (restorePosition.current && !selectedVariantId) {
        restorePosition.current = false;
        restoreStaffPosition(inventoryRef.current);
      }
      void editorialRequest<{ items: { variantId: string; image: EditorialMedia | null }[] }>(
        backendBaseUrl,
        `blackbox/inventory-artwork?items=${encodeURIComponent(
          JSON.stringify(
            results.map((item) => ({
              variantId: item.variantId,
              sourceKind: item.sourceKind,
              sourceId: item.cmsSourceId ?? item.sourceId,
            })),
          ),
        )}`,
      )
        .then((result) => {
          if (requestId === searchRequest.current)
            setArtwork(
              Object.fromEntries(
                result.items.map((item) => [
                  item.variantId,
                  item.image
                    ? staffThumbnailUrl(item.image, new URL(backendBaseUrl || window.location.origin).origin)
                    : '',
                ]),
              ),
            );
        })
        .catch(() => {
          if (requestId === searchRequest.current) setArtwork({});
        });
    } catch (error) {
      if (requestId !== searchRequest.current) return;
      if (error instanceof InternalStockApiError && [401, 403].includes(error.status)) {
        setVariants([]);
        setArtwork({});
      }
      setSearchError(readErrorMessage(error));
      setSearchMessage('Search is unavailable. Try again.');
    } finally {
      if (requestId === searchRequest.current) setIsSearchPending(false);
    }
  }

  async function loadVariant(
    variantId: string,
    shouldUpdateUrl = true,
    intent: Exclude<StockLoadingIntent, null> = 'variant',
  ) {
    if (!variantId) {
      return;
    }

    setSelectedVariantId(variantId);
    if (intent === 'variant') setInventoryOpen(false);
    setHasFreshStock(false);
    setErrorMessage(null);
    setIsLoading(true);
    setLoadingIntent(intent);
    setStatusMessage(intent === 'refresh' ? 'Refreshing stock.' : 'Loading selected stock.');
    const requestId = activeStockLoadRequestRef.current + 1;
    activeStockLoadRequestRef.current = requestId;
    if (stockDetail?.variantId !== variantId) setHistory([]);

    try {
      const detail = await api.readStock(variantId);

      if (activeStockLoadRequestRef.current !== requestId) {
        return;
      }

      if (
        stockDetail?.variantId !== variantId ||
        stockDetail.stock.revision !== detail.stock.revision ||
        historyError
      ) {
        setHistoryPending(true);
        setHistoryError(null);
        void api
          .readStockHistory(variantId, 25)
          .then((result) => {
            if (requestId === activeStockLoadRequestRef.current) setHistory(result.entries);
          })
          .catch((error) => {
            if (requestId === activeStockLoadRequestRef.current) setHistoryError(readErrorMessage(error));
          })
          .finally(() => {
            if (requestId === activeStockLoadRequestRef.current) setHistoryPending(false);
          });
      }
      if (countVariantRef.current === variantId && expectedRevision !== detail.stock.revision)
        setCountNeedsReassessment(true);
      setStockDetail(detail);
      setVariants((rows) =>
        rows.map((row) =>
          row.variantId === detail.variantId
            ? { ...row, quantity: detail.stock.quantity, onlineQuantity: detail.stock.onlineQuantity }
            : row,
        ),
      );
      setHasFreshStock(true);
      if (countVariantRef.current !== variantId) {
        countVariantRef.current = variantId;
        setCountedQuantity(String(detail.stock.quantity));
        setOnlineQuantity(String(detail.stock.onlineQuantity));
        setCountNotes('');
        setExpectedRevision(detail.stock.revision);
        setCountNeedsReassessment(false);
      }
      setStatusMessage('Stock loaded.');

      if (shouldUpdateUrl) {
        const url = new URL(window.location.href);
        url.searchParams.set('variantId', variantId);
        writeStaffLocation(url.pathname + url.search, { push: true, task: true, pages });
      }
    } catch (error) {
      if (activeStockLoadRequestRef.current === requestId) {
        setErrorMessage(readErrorMessage(error));
        setStatusMessage(intent === 'refresh' ? 'Stock refresh failed.' : 'Item is not available. Try again.');
      }
    } finally {
      if (activeStockLoadRequestRef.current === requestId) {
        setIsLoading(false);
        setLoadingIntent(null);
      }
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const variantId = params.get('variantId');
    setQuery(params.get('q') ?? '');
    setArea(params.get('area') ?? 'all');
    setFormat(params.get('format') ?? '');
    setPageCursor(params.get('cursor') ?? '');
    setPages(staffPages(params.get('cursor') ?? ''));
    try {
      const pending = pendingCountSchema.safeParse(JSON.parse(sessionStorage.getItem(pendingCountKey) ?? 'null'));
      const pendingChange = pendingChangeSchema.safeParse(
        JSON.parse(sessionStorage.getItem(pendingChangeKey) ?? 'null'),
      );
      const stored = stocktakeSchema.safeParse(JSON.parse(sessionStorage.getItem(stocktakeKey) ?? 'null'));
      if (stored.success) {
        setStocktake(stored.data);
        setArea(stored.data.area);
        setFormat(stored.data.format);
        setQuery(stored.data.q);
        setStockMode('count');
        void loadVariant(stored.data.items[stored.data.index]!.variantId, false);
      } else if (variantId) void loadVariant(variantId, false);
      if (pendingChange.success) {
        setChangeUnconfirmed(true);
        setStockMode('adjust');
        setStockDirection(pendingChange.data.delta < 0 ? 'remove' : 'add');
        setChangeDelta(String(Math.abs(pendingChange.data.delta)));
        setChangeReason(pendingChange.data.reason);
        setChangeNotes(pendingChange.data.notes ?? '');
        void loadVariant(pendingChange.data.variantId, false);
      }
      if (pending.success) {
        setCountUnconfirmed(true);
        countVariantRef.current = pending.data.variantId;
        setExpectedRevision(pending.data.expectedRevision);
        setCountedQuantity(pending.data.countedQuantity);
        setOnlineQuantity(pending.data.onlineQuantity);
        setCountNotes(pending.data.notes ?? '');
        setCountEdited(true);
        setCountNeedsReassessment(true);
        setStockMode('count');
        setErrorMessage('The last count was not confirmed. Check stock and history before continuing.');
        void loadVariant(pending.data.variantId, false);
      }
    } catch {
      if (variantId) void loadVariant(variantId, false);
    }
    setReady(true);
    return () => {
      searchRequest.current++;
      activeStockLoadRequestRef.current++;
    };
  }, []);

  function protectInput(action: () => void) {
    if (isSubmitting || changeUnconfirmed || countUnconfirmed) return;
    if (changeDelta || changeNotes || countEdited || countNotes) setLeaveAction(() => action);
    else action();
  }

  function chooseVariant(id: string) {
    rememberStaffPosition();
    setChangeDelta('');
    setChangeNotes('');
    setCountEdited(false);
    setCountNotes('');
    countVariantRef.current = '';
    void loadVariant(id);
  }

  useEffect(() => {
    if (isLoading || !selectedVariantId || inventoryOpen || focusedVariant.current === selectedVariantId) return;
    focusedVariant.current = selectedVariantId;
    if (window.document.activeElement?.closest('.staff-stock-controls')) return;
    window.document
      .querySelector<HTMLElement>(stockMode === 'count' ? '#stock-count-counted-quantity' : '#stock-change-direction')
      ?.focus();
  }, [selectedVariantId, isLoading, inventoryOpen]);

  const navigation = useRef({ protectInput, loadVariant, unfinished: false, blocked: false });
  navigation.current = {
    protectInput,
    loadVariant,
    unfinished: !!(
      changeDelta ||
      changeNotes ||
      countEdited ||
      countNotes ||
      changeUnconfirmed ||
      countUnconfirmed ||
      isSubmitting
    ),
    blocked: isSubmitting || changeUnconfirmed || countUnconfirmed,
  };
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (navigation.current.unfinished) event.preventDefault();
    };
    const leave = (event: MouseEvent) => {
      const link = (event.target as Element).closest('a[href]');
      if (
        !(link instanceof HTMLAnchorElement) ||
        link.target === '_blank' ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0 ||
        !navigation.current.unfinished
      )
        return;
      event.preventDefault();
      navigation.current.protectInput(() => {
        if (link.hasAttribute('data-staff-back')) returnStaffTask();
        else window.location.assign(staffLink(link.href));
      });
    };
    const back = () => {
      const params = new URLSearchParams(window.location.search);
      typing.current = false;
      setQuery(params.get('q') ?? '');
      setArea(params.get('area') ?? 'all');
      setFormat(params.get('format') ?? '');
      setPageCursor(params.get('cursor') ?? '');
      setPages(staffPages(params.get('cursor') ?? ''));
      const id = params.get('variantId');
      if (id) void navigation.current.loadVariant(id, false);
      else {
        setSelectedVariantId('');
        setInventoryOpen(true);
        restorePosition.current = true;
        restoreStaffPosition(inventoryRef.current);
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.document.addEventListener('click', leave, true);
    const stopHistory = followStaffHistory(back, () => {
      if (navigation.current.blocked) return false;
      if (!navigation.current.unfinished) return true;
      return new Promise<boolean>((resolve) => {
        resolveHistoryLeave.current = resolve;
        navigation.current.protectInput(() => {
          resolveHistoryLeave.current = null;
          resolve(true);
        });
      });
    });
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.document.removeEventListener('click', leave, true);
      stopHistory();
    };
  }, []);

  function saveStocktake(value: Stocktake | null) {
    setStocktake(value);
    try {
      if (value) sessionStorage.setItem(stocktakeKey, JSON.stringify(value));
      else sessionStorage.removeItem(stocktakeKey);
    } catch {
      setErrorMessage('This browser cannot remember counting progress. Recorded counts are safe; keep this tab open.');
    }
  }

  async function startStocktake() {
    setStartingStocktake(true);
    try {
      const items: Stocktake['items'] = [];
      const seen = new Set<string>();
      let cursor: string | undefined;
      let before: string | undefined;
      do {
        const page = await api.readInventory({
          q: query,
          area,
          format: format || undefined,
          cursor,
          before,
          limit: 50,
        });
        for (const item of page.items)
          if (!seen.has(item.variantId)) {
            seen.add(item.variantId);
            items.push({ variantId: item.variantId });
          }
        cursor = page.nextCursor;
        before = page.before;
        if (items.length > 10000) throw new Error('Choose a smaller group to count.');
      } while (cursor);
      if (!items.length) {
        setStatusMessage('No items to count. Choose another group.');
        return;
      }
      saveStocktake({ items, index: 0, confirmed: [], skipped: [], area, format, q: query });
      setStockMode('count');
      chooseVariant(items[0]!.variantId);
    } catch (error) {
      setErrorMessage(readErrorMessage(error));
    } finally {
      setStartingStocktake(false);
    }
  }

  async function advanceStocktake(status: 'confirmed' | 'skipped') {
    if (!stocktake) return;
    const next = recordProgress(stocktake, status);
    setCountNotes('');
    setCountEdited(false);
    countVariantRef.current = '';
    saveStocktake(next);
    if (next.index === stocktake.index) {
      if (status === 'skipped' && selectedStockDetail) {
        setCountedQuantity(String(selectedStockDetail.stock.quantity));
        setOnlineQuantity(String(selectedStockDetail.stock.onlineQuantity));
      }
      setStatusMessage('End of the count. Review skipped items or finish.');
      return;
    }
    await loadVariant(next.items[next.index]!.variantId);
  }

  async function handleStockChange(event: { preventDefault(): void }) {
    event.preventDefault();

    if (!canMutateSelectedStock || isSubmitting || changeUnconfirmed) {
      return;
    }

    const variantId = selectedVariantId;
    const delta = Number(changeDelta) * (stockDirection === 'remove' ? -1 : 1);
    const notes = normalizeNotes(changeNotes);
    const pendingChange = pendingChangeSchema.safeParse(JSON.parse(sessionStorage.getItem(pendingChangeKey) ?? 'null'));
    const idempotencyKey =
      pendingChange.success &&
      pendingChange.data.variantId === variantId &&
      pendingChange.data.delta === delta &&
      pendingChange.data.reason === changeReason &&
      pendingChange.data.notes === notes
        ? pendingChange.data.idempotencyKey
        : crypto.randomUUID();
    setSubmittingIntent('stockChange');
    setErrorMessage(null);
    setStatusMessage('Saving stock change.');

    try {
      sessionStorage.setItem(
        pendingChangeKey,
        JSON.stringify({ delta, idempotencyKey, notes, reason: changeReason, variantId }),
      );
      await api.recordStockChange(
        variantId,
        {
          delta,
          notes,
          reason: changeReason,
        },
        idempotencyKey,
      );
      sessionStorage.removeItem(pendingChangeKey);
      setChangeDelta('');
      setChangeNotes('');
      await loadVariant(variantId, false, 'refresh');
      setStatusMessage('Stock updated.');
    } catch (error) {
      setChangeUnconfirmed(true);
      await loadVariant(variantId, false, 'refresh');
      setErrorMessage(
        `Update not confirmed. Check the stock and recent history before entering another change. ${readErrorMessage(error)}`,
      );
    } finally {
      setSubmittingIntent(null);
    }
  }

  async function handleStockCount(event: { preventDefault(): void }) {
    event.preventDefault();

    if (!canMutateSelectedStock || !hasFreshStock || isSubmitting || isLoading || countNeedsReassessment) {
      return;
    }

    const variantId = selectedVariantId;
    const notes = normalizeNotes(countNotes);
    const pendingCount = pendingCountSchema.safeParse(JSON.parse(sessionStorage.getItem(pendingCountKey) ?? 'null'));
    const idempotencyKey =
      pendingCount.success &&
      pendingCount.data.variantId === variantId &&
      pendingCount.data.expectedRevision === expectedRevision &&
      pendingCount.data.countedQuantity === countedQuantity &&
      pendingCount.data.onlineQuantity === onlineQuantity &&
      pendingCount.data.notes === notes
        ? pendingCount.data.idempotencyKey
        : crypto.randomUUID();
    setSubmittingIntent('stockCount');
    setErrorMessage(null);
    setStatusMessage('Saving count.');

    try {
      sessionStorage.setItem(
        pendingCountKey,
        JSON.stringify({ variantId, expectedRevision, countedQuantity, onlineQuantity, notes, idempotencyKey }),
      );
      setCountUnconfirmed(true);
      await api.recordStockCount(
        variantId,
        {
          expectedRevision,
          countedQuantity: Number(countedQuantity),
          notes,
          onlineQuantity: Number(onlineQuantity),
        },
        idempotencyKey,
      );
      sessionStorage.removeItem(pendingCountKey);
      setCountUnconfirmed(false);
      setCountNotes('');
      setCountEdited(false);
      countVariantRef.current = '';
      await loadVariant(variantId, false, 'refresh');
      setStatusMessage('Stock count saved.');
      await advanceStocktake('confirmed');
    } catch (error) {
      setCountNeedsReassessment(true);
      await loadVariant(variantId, false, 'refresh');
      if (error instanceof InternalStockApiError && error.status === 409) {
        setStatusMessage('Stock changed. Your count and notes are retained. Reassess before submitting again.');
      } else {
        setStatusMessage(
          'The count was not confirmed. Check the current stock and history before deciding whether to submit again.',
        );
      }
      setErrorMessage(readErrorMessage(error));
    } finally {
      setSubmittingIntent(null);
    }
  }

  useStaffRead(
    ['stock', backendBaseUrl, selectedVariantId],
    async () => {
      if (selectedVariantId) await loadVariant(selectedVariantId, false, 'refresh');
      else await searchVariants();
    },
    { enabled: ready && !isSubmitting, interval: 60_000 },
  );
  useEffect(() => {
    if (!ready) return;
    const read = () => {
      typing.current = false;
      if (navigator.onLine && window.document.visibilityState === 'visible') void searchVariants(query);
    };
    if (!typing.current) read();
    const timer = typing.current ? window.setTimeout(read, 300) : undefined;
    return () => {
      window.clearTimeout(timer);
      searchRequest.current++;
    };
  }, [ready, query, area, format, pageCursor]);
  const loadingLabel = readStockLoadingLabel(loadingIntent);

  return (
    <div className={`staff-workspace staff-stock-workspace min-h-screen ${selectedVariantId ? 'has-selection' : ''}`}>
      <header className="inventory-heading">
        <h1>
          {selectedStockDetail?.displayName ?? selectedStockDetail?.storeItemSlug.replaceAll('-', ' ') ?? 'Stock'}
        </h1>
        {selectedVariantId && <StaffBack />}
      </header>
      <section
        className={cn(
          'inventory-workspace',
          selectedVariantId && 'inventory-workspace-selected',
          inventoryOpen && 'inventory-browsing',
        )}
      >
        <aside ref={inventoryRef} data-staff-scroll tabIndex={-1} className="inventory-list" aria-label="Inventory">
          <div className="inventory-toolbar">
            <Input
              aria-label="Search items"
              placeholder="Search titles-"
              value={query}
              disabled={!!stocktake || startingStocktake}
              onChange={(event) => {
                typing.current = true;
                setQuery(event.target.value);
                setPageCursor('');
                setPages(['']);
              }}
            />
            <select
              aria-label="Inventory area"
              value={area}
              disabled={!!stocktake || startingStocktake}
              onChange={(event) => {
                typing.current = false;
                setArea(event.target.value);
                setPageCursor('');
                setPages(['']);
              }}
            >
              <option value="all">All</option>
              <option value="release">Label releases</option>
              <option value="distro">Distro</option>
              <option value="merch">Merch</option>
            </select>
            <FormatFilter
              value={format}
              disabled={!!stocktake || startingStocktake}
              onChange={(value) => {
                typing.current = false;
                setFormat(value);
                setPageCursor('');
                setPages(['']);
              }}
            />
            {!stocktake && (
              <Button
                variant="outline"
                disabled={startingStocktake || isSubmitting}
                onClick={() => protectInput(() => void startStocktake())}
              >
                {startingStocktake ? 'Preparing count…' : 'Count stock'}
              </Button>
            )}
          </div>
          <p role="status" className="inventory-message">
            {searchMessage}
          </p>
          {!selectedVariantId && errorMessage && <p role="alert">{errorMessage}</p>}
          {searchError && (
            <p role="alert">
              {searchError}{' '}
              <Button variant="outline" onClick={() => void searchVariants()}>
                Retry inventory
              </Button>
            </p>
          )}
          <div className="inventory-columns" aria-hidden="true">
            <span>Title / format</span>
            <span>On hand</span>
            <span>Available to buy online</span>
          </div>
          {variants.map((variant) => (
            <button
              type="button"
              key={variant.variantId}
              id={`inventory-${variant.variantId}`}
              className="inventory-row"
              data-staff-row={variant.variantId}
              aria-pressed={selectedVariantId === variant.variantId}
              disabled={isSubmitting || !!stocktake}
              onClick={() => protectInput(() => chooseVariant(variant.variantId))}
            >
              <span className="inventory-identity">
                {artwork[variant.variantId] ? (
                  <img
                    src={artwork[variant.variantId]}
                    width="48"
                    height="48"
                    alt={variant.displayName ?? variant.storeItemSlug.replaceAll('-', ' ')}
                    loading="lazy"
                    onError={() =>
                      setArtwork((current) => {
                        if (!current[variant.variantId]) return current;
                        const next = { ...current };
                        delete next[variant.variantId];
                        return next;
                      })
                    }
                  />
                ) : (
                  <Disc3 aria-hidden="true" className="inventory-artwork-placeholder" />
                )}
                <span>
                  <strong>{variant.displayName ?? variant.storeItemSlug.replaceAll('-', ' ')}</strong>
                  <small>{formatLabel(variant.itemType ?? 'Format not set')}</small>
                </span>
              </span>
              <span className="inventory-quantity">
                <strong>{variant.quantity ?? '-'}</strong>
                <small>{variant.itemType === 'Clothes' ? 'units' : 'copies'} on hand</small>
              </span>
              <span className="inventory-quantity">
                <strong>{variant.onlineQuantity ?? '-'}</strong>
                <small>available to buy online</small>
              </span>
            </button>
          ))}
          <nav aria-label="Inventory pages" className="inventory-pagination">
            <Button
              variant="outline"
              disabled={!pageCursor || isSearchPending}
              onClick={() => {
                typing.current = false;
                const previous = pages.slice(0, -1);
                setPages(previous.length ? previous : ['']);
                setPageCursor(previous.at(-1) ?? '');
              }}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={!nextCursor || isSearchPending}
              onClick={() => {
                if (nextCursor) {
                  typing.current = false;
                  setPages((value) => [...value, nextCursor]);
                  setPageCursor(nextCursor);
                }
              }}
            >
              Next
            </Button>
          </nav>
        </aside>
        {selectedVariantId && (
          <div className="staff-stock-task inventory-task">
            {stocktake && (
              <section className="stocktake-progress" aria-label="Counting progress">
                <strong>
                  Count {stocktake.index + 1} of {stocktake.items.length}
                </strong>
                <span>
                  {stocktake.confirmed.length} recorded - {stocktake.skipped.length} skipped
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={isSubmitting || stocktake.index === 0}
                    onClick={() =>
                      protectInput(() => {
                        const previous = { ...stocktake, index: stocktake.index - 1 };
                        saveStocktake(previous);
                        chooseVariant(previous.items[previous.index]!.variantId);
                      })
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => protectInput(() => void advanceStocktake('skipped'))}
                  >
                    Skip for now
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => protectInput(() => saveStocktake(null))}
                  >
                    Finish counting
                  </Button>
                </div>
              </section>
            )}
            <p role="status" className="sr-only">
              {statusMessage}
            </p>

            {errorMessage && (
              <div
                className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-foreground"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            <Card className="staff-current-stock border-border bg-card">
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="grid gap-1">
                  <CardTitle>Current stock</CardTitle>
                  <CardDescription>
                    {selectedStockDetail
                      ? (selectedStockDetail.displayName ?? selectedStockDetail.storeItemSlug.replaceAll('-', ' '))
                      : 'Choose an item to see its stock.'}
                  </CardDescription>
                  {selectedStockDetail && (
                    <a
                      className="inline-flex min-h-11 items-center underline"
                      href={`/items/?${new URLSearchParams({ variantId: selectedStockDetail.variantId, tab: 'selling' })}`}
                      onClick={(event) => {
                        event.preventDefault();
                        const href = event.currentTarget.href;
                        protectInput(() => {
                          window.location.href = staffLink(href);
                        });
                      }}
                    >
                      Selling
                    </a>
                  )}
                </div>
                {errorMessage && (
                  <Button
                    disabled={isLoading || isSubmitting}
                    onClick={() => void loadVariant(selectedVariantId, false, 'refresh')}
                    variant="outline"
                  >
                    Retry stock
                  </Button>
                )}
              </CardHeader>
              <CardContent className="grid gap-4">
                {isLoading && !selectedStockDetail ? (
                  <LoadingStateBlock
                    className="min-h-40 border-border bg-background"
                    title={loadingLabel}
                    description="Getting the latest stock count."
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-3">
                    <StockMetric
                      label={selectedStockDetail?.itemType === 'Clothes' ? 'Units on hand' : 'Copies on hand'}
                      value={selectedStockDetail?.stock.quantity}
                    />
                    <StockMetric label="Available to buy online" value={selectedStockDetail?.stock.onlineQuantity} />
                    <StockMetric label="Updated" value={formatDate(selectedStockDetail?.stock.updatedAt)} isText />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="staff-stock-controls grid gap-5">
              <ButtonGroup aria-label="Stock operation mode" className="w-full sm:w-fit">
                <Button
                  type="button"
                  variant={stockMode === 'adjust' ? 'secondary' : 'outline'}
                  aria-pressed={stockMode === 'adjust'}
                  disabled={!!stocktake || startingStocktake}
                  onClick={() => setStockMode('adjust')}
                >
                  <ArrowDownUp aria-hidden="true" />
                  Add or remove copies
                </Button>
                <Button
                  type="button"
                  variant={stockMode === 'count' ? 'secondary' : 'outline'}
                  aria-pressed={stockMode === 'count'}
                  onClick={() => setStockMode('count')}
                >
                  <ClipboardCheck aria-hidden="true" />
                  Count stock
                </Button>
              </ButtonGroup>
              <div className="grid gap-5">
                <div hidden={stockMode !== 'adjust'}>
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="sr-only">Add or remove copies</CardTitle>
                      <CardDescription>
                        Remove stock after a sale or a gift. Add stock when new copies arrive.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        className="grid gap-3"
                        onSubmit={handleStockChange}
                        aria-busy={submittingIntent === 'stockChange' ? 'true' : undefined}
                      >
                        <label htmlFor="stock-change-direction">What changed?</label>
                        <select
                          id="stock-change-direction"
                          className="min-h-11 border border-border bg-background p-2"
                          disabled={!selectedStockDetail || isSubmitting}
                          value={stockDirection}
                          onChange={(event) => setStockDirection(event.target.value)}
                        >
                          <option value="remove">Remove stock</option>
                          <option value="add">Add stock</option>
                        </select>
                        <label htmlFor="stock-change-delta">How many?</label>
                        <Input
                          className="border-input bg-background"
                          disabled={!selectedStockDetail || isSubmitting}
                          id="stock-change-delta"
                          name="delta"
                          onChange={(event) => setChangeDelta(event.target.value)}
                          placeholder="For example, 2"
                          min="1"
                          step="1"
                          required
                          type="number"
                          value={changeDelta}
                        />
                        <label htmlFor="stock-change-reason">Reason</label>
                        <select
                          className="min-h-11 border border-input bg-background p-2"
                          disabled={!selectedStockDetail || isSubmitting}
                          id="stock-change-reason"
                          name="reason"
                          onChange={(event) => setChangeReason(event.target.value)}
                          required
                          value={changeReason}
                        >
                          <option value="manual_adjustment">Other stock change</option>
                          <option value="show_sale">Sold at a show</option>
                          <option value="delivery">New delivery</option>
                          <option value="gift">Gift or promo copy</option>
                        </select>
                        <label htmlFor="stock-change-notes">Notes (optional)</label>
                        <Textarea
                          className="border-input bg-background"
                          disabled={!selectedStockDetail || isSubmitting}
                          id="stock-change-notes"
                          name="notes"
                          onChange={(event) => setChangeNotes(event.target.value)}
                          placeholder="Notes"
                          value={changeNotes}
                        />
                        <div
                          className="staff-operation-preview"
                          data-invalid={adjustmentInvalid ? 'true' : undefined}
                          aria-live="polite"
                        >
                          <span>After this change</span>
                          <strong>
                            {adjustmentInvalid
                              ? 'Cannot go below zero'
                              : adjustmentQuantity === null || !selectedStockDetail
                                ? 'Enter a quantity'
                                : `${adjustmentQuantity} on hand · ${Math.min(adjustmentQuantity, Math.max(0, selectedStockDetail.stock.onlineQuantity + Number(changeDelta) * (stockDirection === 'remove' ? -1 : 1)))} available to buy online`}
                          </strong>
                        </div>
                        {changeUnconfirmed && (
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!hasFreshStock || historyPending || !!historyError}
                            onClick={() => {
                              setChangeUnconfirmed(false);
                              sessionStorage.removeItem(pendingChangeKey);
                              setChangeDelta('');
                              setChangeNotes('');
                              setErrorMessage(null);
                            }}
                          >
                            I checked the stock and history
                          </Button>
                        )}
                        <Button
                          disabled={!canMutateSelectedStock || isSubmitting || adjustmentInvalid || changeUnconfirmed}
                          type="submit"
                        >
                          {submittingIntent === 'stockChange' ? (
                            <LoadingButtonContent label="Saving stock change" />
                          ) : (
                            'Save stock change'
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>

                <div hidden={stockMode !== 'count'}>
                  <Card className="border-border bg-card">
                    <CardHeader>
                      <CardTitle className="sr-only">Count stock</CardTitle>
                      <CardDescription>
                        Enter how many you have counted. The online quantity is how many customers may buy through the
                        website.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form
                        className="grid gap-3"
                        onSubmit={handleStockCount}
                        aria-busy={submittingIntent === 'stockCount' ? 'true' : undefined}
                      >
                        <label htmlFor="stock-count-counted-quantity">Physical stock counted</label>
                        <Input
                          className="border-input bg-background"
                          disabled={!selectedStockDetail || isSubmitting}
                          id="stock-count-counted-quantity"
                          min="0"
                          name="countedQuantity"
                          onChange={(event) => {
                            setCountedQuantity(event.target.value);
                            setCountEdited(true);
                          }}
                          placeholder="Counted Stock"
                          required
                          type="number"
                          value={countedQuantity}
                        />
                        <label htmlFor="stock-count-online-quantity">Available to buy online</label>
                        <Input
                          className="border-input bg-background"
                          disabled={!selectedStockDetail || isSubmitting}
                          id="stock-count-online-quantity"
                          min="0"
                          name="onlineQuantity"
                          onChange={(event) => {
                            setOnlineQuantity(event.target.value);
                            setCountEdited(true);
                          }}
                          placeholder="OnlineStock"
                          required
                          type="number"
                          value={onlineQuantity}
                        />
                        <label htmlFor="stock-count-notes">Notes (optional)</label>
                        <Textarea
                          className="border-input bg-background"
                          disabled={!selectedStockDetail || isSubmitting}
                          id="stock-count-notes"
                          name="notes"
                          onChange={(event) => setCountNotes(event.target.value)}
                          placeholder="Notes"
                          value={countNotes}
                        />
                        {countNeedsReassessment && (
                          <Button
                            disabled={
                              !canMutateSelectedStock ||
                              !hasFreshStock ||
                              isLoading ||
                              isSubmitting ||
                              historyPending ||
                              !!historyError
                            }
                            onClick={() => {
                              if (!selectedStockDetail || !hasFreshStock) return;
                              setExpectedRevision(selectedStockDetail.stock.revision);
                              sessionStorage.removeItem(pendingCountKey);
                              setCountUnconfirmed(false);
                              setCountNeedsReassessment(false);
                              setStatusMessage(
                                'Count reassessed against the displayed stock. Review and save when ready.',
                              );
                            }}
                            type="button"
                            variant="outline"
                          >
                            I have reassessed this count
                          </Button>
                        )}
                        <div className="staff-operation-preview" aria-live="polite">
                          <span>Count to save</span>
                          <strong>
                            {countedQuantity && onlineQuantity
                              ? `${countedQuantity} on hand · ${onlineQuantity} available to buy online · difference ${Number(countedQuantity) - (selectedStockDetail?.stock.quantity ?? 0)}`
                              : 'Enter both quantities'}
                          </strong>
                        </div>
                        <Button
                          disabled={
                            !canMutateSelectedStock ||
                            !hasFreshStock ||
                            isSubmitting ||
                            isLoading ||
                            countNeedsReassessment
                          }
                          type="submit"
                        >
                          {submittingIntent === 'stockCount' ? (
                            <LoadingButtonContent label="Saving count" />
                          ) : stocktake ? (
                            'Record count and next'
                          ) : (
                            'Save count'
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <Card className="border-border bg-card">
              <CardHeader>
                <CardTitle>Recent history</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {historyPending && <LoadingInline label="Loading stock history" />}
                {historyError && (
                  <p role="alert" className="text-sm text-destructive">
                    History could not load. {historyError}
                    <Button variant="outline" onClick={() => void loadVariant(selectedVariantId, false, 'refresh')}>
                      Retry history
                    </Button>
                  </p>
                )}
                {history.map((entry) => (
                  <HistoryRow entry={entry} key={`${entry.type}-${entry.id}`} />
                ))}
                {!historyPending && !historyError && history.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent history loaded.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>{' '}
      <AlertDialog
        open={!!leaveAction}
        onOpenChange={(open) => {
          if (!open) {
            setLeaveAction(null);
            resolveHistoryLeave.current?.(false);
            resolveHistoryLeave.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave this unfinished stock change?</AlertDialogTitle>
            <AlertDialogDescription>
              These entries have not been recorded. Keep editing or discard them to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const action = leaveAction;
                setLeaveAction(null);
                setChangeDelta('');
                setChangeNotes('');
                setCountEdited(false);
                setCountNotes('');
                action?.();
              }}
            >
              Discard and continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function readStockLoadingLabel(intent: StockLoadingIntent) {
  if (intent === 'refresh') return 'Refreshing stock';
  if (intent === 'search') return 'Searching items';
  if (intent === 'variant') return 'Loading selected stock';
  return 'Loading stock workspace';
}

export function canSubmitStockMutation(
  selectedVariantId: string,
  stockDetail: Pick<InternalStockDetail, 'variantId'> | null,
) {
  return Boolean(selectedVariantId && stockDetail?.variantId === selectedVariantId);
}

function StockMetric({
  isText = false,
  label,
  value,
}: {
  isText?: boolean;
  label: string;
  value?: number | string | null | undefined;
}) {
  return (
    <div className="staff-stock-metric border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={cn('mt-3 font-mono font-semibold tabular-nums text-foreground', isText ? 'text-base' : 'text-3xl')}>
        {value ?? '-'}
      </p>
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const quantityLabel =
    entry.type === 'change'
      ? `${entry.quantityDelta > 0 ? '+' : ''}${entry.quantityDelta}`
      : `count ${entry.countedQuantity}`;

  return (
    <article className="staff-history-row grid gap-2 p-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-center">
      <Badge variant="outline" className="w-fit font-mono uppercase tracking-[0.12em]">
        {entry.type === 'change' ? 'Stock change' : 'Stock count'}
      </Badge>
      <div className="grid gap-1">
        <p className="font-mono text-xs text-foreground">{quantityLabel}</p>
        <p className="text-xs text-muted-foreground">
          {entry.actorEmail} / {formatDate(entry.recordedAt)}
        </p>
        {entry.notes && <p className="text-sm text-muted-foreground">{entry.notes}</p>}
      </div>
      {'onlineQuantity' in entry && (
        <p className="font-mono text-xs text-muted-foreground">Available to buy online: {entry.onlineQuantity}</p>
      )}
    </article>
  );
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Athens',
  }).format(new Date(value));
}

function normalizeNotes(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown stock operation error.';
}

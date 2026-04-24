import type { AppOpenApi } from '../../../env';
import { readOperatorIdentityFromAccessHeaders } from '../auth';

export function registerInternalStockUiRoutes(app: AppOpenApi): void {
    app.get('/stock/', (context) => {
        const operatorIdentity = readOperatorIdentityFromAccessHeaders(context.req.raw.headers);

        if (!operatorIdentity) {
            return context.text('Missing operator identity.', 401);
        }

        return context.html(renderStockOverviewPage(operatorIdentity.email), 200);
    });

    app.get('/stock/:variantId', (context) => {
        const operatorIdentity = readOperatorIdentityFromAccessHeaders(context.req.raw.headers);

        if (!operatorIdentity) {
            return context.text('Missing operator identity.', 401);
        }

        return context.html(renderStockDetailPage(operatorIdentity.email, context.req.param('variantId')), 200);
    });

    app.get('/stock/:variantId/', (context) => {
        const operatorIdentity = readOperatorIdentityFromAccessHeaders(context.req.raw.headers);

        if (!operatorIdentity) {
            return context.text('Missing operator identity.', 401);
        }

        return context.html(renderStockDetailPage(operatorIdentity.email, context.req.param('variantId')), 200);
    });
}

function renderStockOverviewPage(operatorEmail: string): string {
    return renderStockShell({
        body: `
            <main class="ops-shell" data-stock-overview>
                <header class="ops-header">
                    <div>
                        <p class="eyebrow">BlackBox Ops</p>
                        <h1>Stock</h1>
                    </div>
                    <div class="operator">${escapeHtml(operatorEmail)}</div>
                </header>
                <section class="panel">
                    <form class="search-row" data-stock-search-form>
                        <label class="field-label" for="stock-search">Variant search</label>
                        <input id="stock-search" name="q" type="search" autocomplete="off" placeholder="Search slug, source, or variant id" data-stock-search-input>
                        <button type="submit">Search</button>
                    </form>
                    <p class="status" data-stock-search-status>Loading current variants...</p>
                </section>
                <section class="table-panel" aria-label="Variant stock results">
                    <div class="result-head">
                        <span>Variant</span>
                        <span>Source</span>
                        <span>Stock</span>
                        <span>OnlineStock</span>
                        <span></span>
                    </div>
                    <div data-stock-results></div>
                </section>
            </main>
            <script>${overviewScript()}</script>
        `,
        title: 'Stock',
    });
}

function renderStockDetailPage(operatorEmail: string, variantId: string): string {
    return renderStockShell({
        body: `
            <main class="ops-shell" data-stock-detail data-variant-id="${escapeHtml(variantId)}">
                <header class="ops-header">
                    <div>
                        <p class="eyebrow"><a href="/stock/">Stock</a></p>
                        <h1 data-stock-variant-title>${escapeHtml(variantId)}</h1>
                    </div>
                    <div class="operator">${escapeHtml(operatorEmail)}</div>
                </header>
                <section class="metric-grid" data-stock-summary>
                    <article class="metric">
                        <span>Stock</span>
                        <strong data-stock-quantity>--</strong>
                    </article>
                    <article class="metric">
                        <span>OnlineStock</span>
                        <strong data-stock-online-quantity>--</strong>
                    </article>
                    <article class="metric wide">
                        <span>Last update</span>
                        <strong data-stock-updated-at>--</strong>
                    </article>
                </section>
                <section class="detail-grid">
                    <form class="panel" data-stock-change-form>
                        <h2>StockChange</h2>
                        <label class="field-label" for="quantity-delta">Quantity delta</label>
                        <input id="quantity-delta" name="delta" type="number" step="1" required placeholder="-1 or 5">
                        <label class="field-label" for="change-reason">Reason</label>
                        <select id="change-reason" name="reason" required>
                            <option value="offline_sale">offline sale</option>
                            <option value="restock">restock</option>
                            <option value="correction">correction</option>
                            <option value="damage_loss">damage/loss</option>
                            <option value="return">return</option>
                        </select>
                        <label class="field-label" for="change-notes">Notes</label>
                        <textarea id="change-notes" name="notes" rows="3" placeholder="Optional"></textarea>
                        <button type="submit">Record StockChange</button>
                    </form>
                    <form class="panel" data-stock-count-form>
                        <h2>StockCount</h2>
                        <label class="field-label" for="counted-quantity">Counted Stock</label>
                        <input id="counted-quantity" name="countedQuantity" type="number" min="0" step="1" required>
                        <label class="field-label" for="online-quantity">OnlineStock</label>
                        <input id="online-quantity" name="onlineQuantity" type="number" min="0" step="1" required>
                        <label class="field-label" for="count-notes">Notes</label>
                        <textarea id="count-notes" name="notes" rows="3" placeholder="Optional"></textarea>
                        <button type="submit">Record StockCount</button>
                    </form>
                    <section class="panel history-panel">
                        <h2>Recent history</h2>
                        <p class="status" data-stock-action-status></p>
                        <div data-stock-history></div>
                    </section>
                </section>
            </main>
            <script>${detailScript(variantId)}</script>
        `,
        title: `Stock ${variantId}`,
    });
}

function renderStockShell({ body, title }: { body: string; title: string }): string {
    return `<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)} | BlackBox Ops</title>
    <style>${stockUiStyles()}</style>
</head>
<body>${body}</body>
</html>`;
}

function stockUiStyles(): string {
    return `
:root {
    color-scheme: light;
    --ink: #101010;
    --muted: #6b6b6b;
    --line: #d8d8d8;
    --paper: #f4f1eb;
    --panel: #fffdf8;
    --accent: #c8ff3d;
    --danger: #b82020;
}
* { box-sizing: border-box; }
body {
    margin: 0;
    min-height: 100vh;
    background:
        linear-gradient(90deg, rgba(16, 16, 16, 0.04) 1px, transparent 1px),
        linear-gradient(0deg, rgba(16, 16, 16, 0.04) 1px, transparent 1px),
        var(--paper);
    background-size: 28px 28px;
    color: var(--ink);
    font-family: ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace;
}
a { color: inherit; }
button, input, select, textarea {
    border: 1px solid var(--ink);
    border-radius: 0;
    color: var(--ink);
    font: inherit;
}
button {
    min-height: 42px;
    background: var(--ink);
    color: var(--panel);
    cursor: pointer;
    padding: 0 16px;
    text-transform: uppercase;
}
button:hover { background: #2a2a2a; }
input, select, textarea {
    width: 100%;
    background: var(--panel);
    padding: 11px 12px;
}
textarea { resize: vertical; }
.ops-shell {
    width: min(1180px, calc(100vw - 32px));
    margin: 0 auto;
    padding: 32px 0 48px;
}
.ops-header {
    align-items: flex-end;
    border-bottom: 2px solid var(--ink);
    display: flex;
    gap: 20px;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 18px;
}
.eyebrow, .field-label, .status, .operator {
    color: var(--muted);
    font-size: 12px;
    letter-spacing: 0;
    margin: 0;
    text-transform: uppercase;
}
h1 {
    font-size: clamp(34px, 6vw, 72px);
    line-height: 0.92;
    margin: 8px 0 0;
    overflow-wrap: anywhere;
    text-transform: uppercase;
}
h2 {
    font-size: 16px;
    margin: 0 0 16px;
    text-transform: uppercase;
}
.panel, .table-panel, .metric {
    background: var(--panel);
    border: 1px solid var(--ink);
    box-shadow: 6px 6px 0 var(--ink);
}
.panel { padding: 18px; }
.search-row {
    align-items: end;
    display: grid;
    gap: 12px;
    grid-template-columns: 1fr auto;
}
.search-row .field-label { grid-column: 1 / -1; }
.table-panel {
    margin-top: 22px;
    overflow-x: auto;
}
.result-head, .result-row {
    display: grid;
    gap: 12px;
    grid-template-columns: minmax(230px, 1.8fr) minmax(120px, 0.8fr) 90px 120px 120px;
    min-width: 760px;
    padding: 13px 16px;
}
.result-head {
    background: var(--ink);
    color: var(--panel);
    font-size: 12px;
    text-transform: uppercase;
}
.result-row {
    align-items: center;
    border-top: 1px solid var(--line);
}
.variant-id {
    color: var(--muted);
    display: block;
    font-size: 12px;
    margin-top: 4px;
    overflow-wrap: anywhere;
}
.pill {
    background: var(--accent);
    border: 1px solid var(--ink);
    display: inline-block;
    padding: 3px 7px;
    text-transform: uppercase;
}
.metric-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-bottom: 22px;
}
.metric {
    padding: 18px;
}
.metric span {
    color: var(--muted);
    display: block;
    font-size: 12px;
    text-transform: uppercase;
}
.metric strong {
    display: block;
    font-size: 36px;
    margin-top: 8px;
    overflow-wrap: anywhere;
}
.detail-grid {
    display: grid;
    gap: 18px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
}
.detail-grid .panel {
    display: grid;
    gap: 10px;
}
.history-panel {
    grid-column: 1 / -1;
}
.history-entry {
    border-top: 1px solid var(--line);
    display: grid;
    gap: 8px;
    grid-template-columns: 120px 1fr 220px;
    padding: 12px 0;
}
.history-entry strong { text-transform: uppercase; }
.error { color: var(--danger); }
@media (max-width: 760px) {
    .ops-header, .search-row { display: block; }
    .operator { margin-top: 14px; }
    .search-row button { margin-top: 12px; width: 100%; }
    .metric-grid, .detail-grid { grid-template-columns: 1fr; }
    .history-entry { grid-template-columns: 1fr; }
}
`;
}

function overviewScript(): string {
    return `
const form = document.querySelector('[data-stock-search-form]');
const input = document.querySelector('[data-stock-search-input]');
const statusEl = document.querySelector('[data-stock-search-status]');
const resultsEl = document.querySelector('[data-stock-results]');

async function fetchJson(url, options) {
    const response = await fetch(url, { headers: { accept: 'application/json' }, ...options });
    if (!response.ok) {
        throw new Error(await response.text());
    }
    return response.json();
}

function escapeText(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

async function loadVariants(query = '') {
    statusEl.textContent = 'Loading variants...';
    resultsEl.innerHTML = '';
    const params = new URLSearchParams({ limit: '50' });
    if (query.trim()) params.set('q', query.trim());
    const variants = await fetchJson('/api/internal/variants?' + params.toString());
    const rows = await Promise.all(variants.map(async (variant) => {
        try {
            const detail = await fetchJson('/api/internal/variants/' + encodeURIComponent(variant.variantId) + '/stock');
            return { ...variant, stock: detail.stock };
        } catch {
            return { ...variant, stock: null };
        }
    }));
    resultsEl.innerHTML = rows.map((row) => {
        const stock = row.stock ?? { quantity: '--', onlineQuantity: '--' };
        return '<div class="result-row">' +
            '<div><strong>' + escapeText(row.storeItemSlug) + '</strong><span class="variant-id">' + escapeText(row.variantId) + '</span></div>' +
            '<div><span class="pill">' + escapeText(row.sourceKind) + '</span></div>' +
            '<div>' + escapeText(stock.quantity) + '</div>' +
            '<div>' + escapeText(stock.onlineQuantity) + '</div>' +
            '<div><a href="/stock/' + encodeURIComponent(row.variantId) + '/">Open Stock</a></div>' +
        '</div>';
    }).join('');
    statusEl.textContent = rows.length === 1 ? '1 variant' : rows.length + ' variants';
}

form.addEventListener('submit', (event) => {
    event.preventDefault();
    loadVariants(input.value).catch((error) => {
        statusEl.innerHTML = '<span class="error">' + escapeText(error.message || 'Search failed') + '</span>';
    });
});

loadVariants().catch((error) => {
    statusEl.innerHTML = '<span class="error">' + escapeText(error.message || 'Search failed') + '</span>';
});
`;
}

function detailScript(variantId: string): string {
    return `
const variantId = ${JSON.stringify(variantId)};
const titleEl = document.querySelector('[data-stock-variant-title]');
const quantityEl = document.querySelector('[data-stock-quantity]');
const onlineQuantityEl = document.querySelector('[data-stock-online-quantity]');
const updatedAtEl = document.querySelector('[data-stock-updated-at]');
const historyEl = document.querySelector('[data-stock-history]');
const statusEl = document.querySelector('[data-stock-action-status]');
const changeForm = document.querySelector('[data-stock-change-form]');
const countForm = document.querySelector('[data-stock-count-form]');

async function fetchJson(url, options) {
    const response = await fetch(url, { headers: { accept: 'application/json', 'content-type': 'application/json' }, ...options });
    if (!response.ok) {
        throw new Error(await response.text());
    }
    return response.json();
}

function escapeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

function formatDate(value) {
    return value ? new Date(value).toLocaleString() : 'No stock row yet';
}

async function loadDetail() {
    const detail = await fetchJson('/api/internal/variants/' + encodeURIComponent(variantId) + '/stock');
    titleEl.textContent = detail.storeItemSlug + ' / ' + detail.variantId;
    quantityEl.textContent = detail.stock.quantity;
    onlineQuantityEl.textContent = detail.stock.onlineQuantity;
    updatedAtEl.textContent = formatDate(detail.stock.updatedAt);
    const history = await fetchJson('/api/internal/variants/' + encodeURIComponent(variantId) + '/stock/history?limit=25');
    historyEl.innerHTML = history.entries.length === 0
        ? '<p class="status">No stock history yet.</p>'
        : history.entries.map((entry) => {
            const main = entry.type === 'change'
                ? (entry.quantityDelta > 0 ? '+' : '') + entry.quantityDelta + ' / ' + entry.reason
                : 'counted ' + entry.countedQuantity + ' / online ' + entry.onlineQuantity;
            return '<article class="history-entry">' +
                '<strong>' + escapeText(entry.type === 'change' ? 'StockChange' : 'StockCount') + '</strong>' +
                '<div>' + escapeText(main) + '<span class="variant-id">' + escapeText(entry.notes || '') + '</span></div>' +
                '<div><span class="variant-id">' + escapeText(entry.actorEmail) + '<br>' + escapeText(formatDate(entry.recordedAt)) + '</span></div>' +
            '</article>';
        }).join('');
}

changeForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(changeForm);
    statusEl.textContent = 'Recording StockChange...';
    try {
        await fetchJson('/api/internal/variants/' + encodeURIComponent(variantId) + '/stock/changes', {
            body: JSON.stringify({
                delta: Number(data.get('delta')),
                notes: String(data.get('notes') || '').trim() || null,
                reason: String(data.get('reason') || '').trim(),
            }),
            method: 'POST',
        });
        changeForm.reset();
        statusEl.textContent = 'StockChange recorded.';
        await loadDetail();
    } catch (error) {
        statusEl.innerHTML = '<span class="error">' + escapeText(error.message || 'StockChange failed') + '</span>';
    }
});

countForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(countForm);
    statusEl.textContent = 'Recording StockCount...';
    try {
        await fetchJson('/api/internal/variants/' + encodeURIComponent(variantId) + '/stock/counts', {
            body: JSON.stringify({
                countedQuantity: Number(data.get('countedQuantity')),
                notes: String(data.get('notes') || '').trim() || null,
                onlineQuantity: Number(data.get('onlineQuantity')),
            }),
            method: 'POST',
        });
        countForm.reset();
        statusEl.textContent = 'StockCount recorded.';
        await loadDetail();
    } catch (error) {
        statusEl.innerHTML = '<span class="error">' + escapeText(error.message || 'StockCount failed') + '</span>';
    }
});

loadDetail().catch((error) => {
    statusEl.innerHTML = '<span class="error">' + escapeText(error.message || 'Load failed') + '</span>';
});
`;
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (char) => {
        switch (char) {
            case '&':
                return '&amp;';
            case '<':
                return '&lt;';
            case '>':
                return '&gt;';
            case '"':
                return '&quot;';
            case "'":
                return '&#39;';
            default:
                return char;
        }
    });
}

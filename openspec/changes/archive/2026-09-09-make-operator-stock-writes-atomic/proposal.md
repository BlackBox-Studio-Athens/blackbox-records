## Why

Operator stock changes read a quantity and later overwrite it, so a concurrent paid checkout decrement can disappear. Stock and its audit entry also commit separately for both deltas and recounts; source inspection and a deterministic interleaving probe reconfirmed the issue on 2026-09-09.

## What Changes

- Commit each operator stock mutation and its StockChange or StockCount entry in one guarded D1 transaction.
- Apply deltas to current database quantities and reject stale recounts instead of overwriting newer stock movements.
- Preserve verified operator identity, conservative OnlineStock, and the existing paid-settlement transaction.
- Prove operator/operator and operator/checkout races plus rollback with real local D1 tests.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `orders-stock-operator`: Atomic stock/audit writes and explicit recount conflict behavior.

## Impact

Stock application use cases, existing persistence seams and D1 adapters, protected stock contracts/client/UI, an additive stock revision migration covering every writer, and local D1 tests. Keep stock ownership in its existing module; no locking service or new dependency.

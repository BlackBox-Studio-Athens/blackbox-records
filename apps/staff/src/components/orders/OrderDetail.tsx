import { boxNowTrackingUrl } from '@coding-tree-io/boxnow-widget';
import StaffLockerMap from './StaffLockerMap';
import {
  CircleCheck,
  CircleX,
  Clock3,
  TriangleAlert,
  ClipboardCheck,
  Disc3,
  Mail,
  MapPin,
  Package,
  Truck,
  UserRound,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Button } from '../ui/button';
import type { DispatchCarrierFacts, InternalOrder, OrderStatus } from './internal-order-api';
import SendParcelDetails from './SendParcelDetails';

export const paymentLabels: Record<OrderStatus, string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid',
  not_paid: 'Not paid',
  needs_review: 'Needs review',
};
const deliveryLabels = {
  shopper_confirmation: 'Confirmation email',
  ops_fulfillment: 'Fulfillment email',
  newsletter_registration: 'Newsletter registration',
  shopper_shipping: 'Shipping email',
};
const reviewGuidance: Record<string, string> = {
  stock_unavailable:
    'Check the payment and actual stock. Arrange an agreed resolution through the manual exception procedure.',
  line_mismatch:
    'Check the saved items, quantities, amounts and tax against the payment. Hold normal fulfillment while the mismatch is reviewed.',
  incomplete_fulfillment:
    'Verify the recipient, Greek shipping address and contact details. Keep any verified correction in the private exception record.',
  incomplete_paid_fulfillment:
    'Paid fulfillment data is incomplete. Verify the original payment and shipping details before packing.',
};

export function formatOrderTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en-GB', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Europe/Athens',
      }).format(new Date(value))
    : 'Unknown';
}
export function money(value: number | null) {
  return value === null
    ? 'Unknown'
    : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(value / 100);
}
export function OrderStatusLabel({ status }: { status: OrderStatus | 'pending' | 'delivered' }) {
  const Icon =
    status === 'paid' || status === 'delivered'
      ? CircleCheck
      : status === 'needs_review'
        ? TriangleAlert
        : status === 'not_paid'
          ? CircleX
          : Clock3;
  return (
    <span className={`order-status order-status--${status}`}>
      <Icon size={17} aria-hidden="true" />
      {status === 'pending' ? 'Email pending' : status === 'delivered' ? 'Email delivered' : paymentLabels[status]}
    </span>
  );
}
export function notificationStatus(order: InternalOrder) {
  return order.deliveries.some((item) => item.status === 'needs_review')
    ? 'needs_review'
    : order.deliveries.some((item) => item.status === 'pending')
      ? 'pending'
      : order.deliveries.length
        ? 'delivered'
        : null;
}
function CopyReference({ value }: { value: string | null }) {
  const [message, setMessage] = useState('');
  return (
    <span>
      <code>{value ?? 'Not recorded'}</code>
      {value && (
        <Button
          variant="ghost"
          className="ml-2"
          onClick={() => {
            void navigator.clipboard.writeText(value).then(
              () => setMessage('Copied'),
              () => setMessage('Select and copy the reference above.'),
            );
          }}
        >
          Copy
        </Button>
      )}
      <span role="status">{message}</span>
    </span>
  );
}
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

type OrderShipEstimate = NonNullable<
  NonNullable<Extract<InternalOrder['fulfillment'], { kind: 'current' }>['lines'][number]['preorder']>['shipEstimate']
>;

function orderShipEstimateText(estimate: OrderShipEstimate): string {
  const date = estimate.kind === 'date' ? estimate.date : `${estimate.month}-01`;
  const formatted = new Intl.DateTimeFormat('en-GB', {
    ...(estimate.kind === 'date' ? { day: 'numeric' as const } : {}),
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
  return estimate.kind === 'date'
    ? `on ${formatted}`
    : `around ${estimate.part ? `${estimate.part} ` : ''}${formatted}`;
}

const PARCEL_NUMBER = /^\d{10}$/;
const MAX_PARCELS = 5;

export { boxNowTrackingUrl };

type SetDispatch = (
  shipped: boolean,
  sendShippingEmail?: boolean,
  carrier?: DispatchCarrierFacts,
) => Promise<string | null>;

function DispatchControl({ order, onSetDispatch }: { order: InternalOrder; onSetDispatch: SetDispatch }) {
  const [busy, setBusy] = useState(false);
  const [confirmUndo, setConfirmUndo] = useState(false);
  const [message, setMessage] = useState('');
  const [sendShippingEmail, setSendShippingEmail] = useState(true);
  const customerLocker = order.fulfillment.kind === 'current' ? order.fulfillment.shippingLocker : null;
  const [editingLocker, setEditingLocker] = useState(!customerLocker);
  const [lockerEntry, setLockerEntry] = useState<'map' | 'manual'>('map');
  const [lockerName, setLockerName] = useState(customerLocker?.name ?? '');
  const [lockerId, setLockerId] = useState(customerLocker?.lockerId ?? '');
  const [parcelNumbers, setParcelNumbers] = useState(['']);
  const [carrierError, setCarrierError] = useState('');
  const shipped = Boolean(order.dispatch.shippedAt);
  const shippingDelivery = order.deliveries.some((delivery) => delivery.kind === 'shopper_shipping');
  const suppressed = order.dispatch.shippingEmailSuppressed && !shippingDelivery;
  const canChooseEmail =
    typeof order.dispatch.shippingEmailSuppressed === 'boolean' && !suppressed && !shippingDelivery;
  const enteredNumbers = parcelNumbers.map((value) => value.trim()).filter(Boolean);
  const firstValidNumber = enteredNumbers.find((value) => PARCEL_NUMBER.test(value));

  function readCarrier(): DispatchCarrierFacts | string {
    if (enteredNumbers.some((value) => !PARCEL_NUMBER.test(value)))
      return 'Each parcel number must be exactly 10 digits.';
    if (new Set(enteredNumbers).size !== enteredNumbers.length) return 'Each parcel number can be entered only once.';
    const name = lockerName.trim();
    const id = lockerId.trim();
    if (Boolean(name) !== Boolean(id)) return 'Enter both the locker name and its ID, or leave both empty.';
    return {
      ...(name && id ? { lockerUsed: { lockerId: id, name } } : {}),
      ...(enteredNumbers.length ? { parcelNumbers: enteredNumbers } : {}),
    };
  }

  async function change(next: boolean) {
    const carrier = next ? readCarrier() : {};
    if (typeof carrier === 'string') {
      setCarrierError(carrier);
      return;
    }
    setCarrierError('');
    setBusy(true);
    setMessage('');
    const sendEmail = !suppressed && (shippingDelivery || sendShippingEmail);
    const error = await onSetDispatch(next, sendEmail, carrier);
    setBusy(false);
    setConfirmUndo(false);
    setMessage(
      error ??
        (next
          ? sendEmail
            ? 'Marked shipped.'
            : 'Marked shipped without queuing a shipping email.'
          : 'Marked not shipped.'),
    );
  }
  return (
    <div className="order-dispatch">
      {!shipped && (
        <div className="order-dispatch-carrier" data-dispatch-carrier>
          <div className="order-field">
            <span className="order-field__label" id="locker-used-label">
              Locker used
            </span>
            {editingLocker && lockerEntry === 'map' ? (
              <StaffLockerMap
                onSelect={(locker) => {
                  setCarrierError('');
                  setLockerName(locker.name);
                  setLockerId(locker.lockerId);
                  setEditingLocker(false);
                }}
                onUnavailable={() => setLockerEntry('manual')}
              />
            ) : editingLocker ? (
              <div className="order-field__pair" role="group" aria-labelledby="locker-used-label">
                <p className="order-muted">BOX NOW&apos;s map is not available. Enter the locker by hand.</p>
                <label>
                  Locker name
                  <input
                    value={lockerName}
                    disabled={busy}
                    maxLength={200}
                    onChange={(event) => {
                      setCarrierError('');
                      setLockerName(event.target.value);
                    }}
                  />
                </label>
                <label>
                  Locker ID
                  <input
                    value={lockerId}
                    inputMode="numeric"
                    disabled={busy}
                    maxLength={32}
                    onChange={(event) => {
                      setCarrierError('');
                      setLockerId(event.target.value.replace(/\D/g, ''));
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="order-locker-used">
                <span>
                  {lockerName} <code>{lockerId}</code>
                </span>
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setLockerEntry('map');
                    setEditingLocker(true);
                  }}
                >
                  Change
                </Button>
              </div>
            )}
            <small className="order-muted">
              {customerLocker
                ? "The customer's choice. Change it only if Send parcel would not take it; the shipping email names this locker."
                : 'No locker chosen at checkout. Choose the locker agreed with the customer.'}
            </small>
          </div>
          {parcelNumbers.map((value, index) => (
            <div className="order-field" key={index}>
              <label className="order-field__label" htmlFor={`parcel-number-${index}`}>
                {parcelNumbers.length > 1 ? `Parcel ${index + 1} number` : 'BOX NOW parcel number'}
              </label>
              <input
                id={`parcel-number-${index}`}
                className="order-parcel-input"
                value={value}
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                disabled={busy}
                aria-describedby={`parcel-number-${index}-count parcel-number-help`}
                aria-invalid={value !== '' && !PARCEL_NUMBER.test(value)}
                onChange={(event) => {
                  setCarrierError('');
                  // Only digits: a pasted number with spaces or dashes keeps its digits.
                  const digits = event.target.value.replace(/\D/g, '').slice(0, 10);
                  setParcelNumbers((current) => current.map((item, at) => (at === index ? digits : item)));
                }}
              />
              <small id={`parcel-number-${index}-count`} className="order-muted" aria-live="polite">
                {value === '' ? '10 digits' : value.length === 10 ? '10 digits ✓' : `${value.length} of 10 digits`}
              </small>
            </div>
          ))}
          {parcelNumbers.length < MAX_PARCELS && (
            <Button
              variant="ghost"
              className="justify-self-start"
              disabled={busy}
              onClick={() => setParcelNumbers((current) => [...current, ''])}
            >
              + Add parcel
            </Button>
          )}
          <small id="parcel-number-help" className="order-muted">
            The 10-digit number from BOX NOW&apos;s email, the one that opens the locker door. Adds a tracking link to
            the shipping email. Leave it empty to send the email without tracking.
          </small>
          {carrierError && (
            <p className="order-field__error" role="alert">
              {carrierError}
            </p>
          )}
          {firstValidNumber && (
            <a
              className="order-dispatch-check"
              href={boxNowTrackingUrl(firstValidNumber)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Check the number on BOX NOW ↗
            </a>
          )}
        </div>
      )}
      {!shipped && canChooseEmail && (
        <label className="order-dispatch-email">
          <input
            type="checkbox"
            checked={sendShippingEmail}
            disabled={busy}
            aria-describedby="dispatch-email-help"
            onChange={(event) => setSendShippingEmail(event.target.checked)}
          />
          Send shipping email
        </label>
      )}
      {shipped ? (
        <Button variant="outline" disabled={busy} onClick={() => setConfirmUndo(true)}>
          Mark not shipped
        </Button>
      ) : (
        <Button disabled={busy} aria-describedby="dispatch-email-help" onClick={() => void change(true)}>
          <Truck aria-hidden="true" />
          {busy ? 'Saving…' : 'Mark shipped'}
        </Button>
      )}
      {!shipped && (
        <small id="dispatch-email-help" className="order-muted">
          {suppressed
            ? 'Shipping email was skipped. Marking shipped again will not send it.'
            : shippingDelivery
              ? 'Shipping email already recorded. Marking shipped again will not create another email.'
              : canChooseEmail
                ? 'Uncheck when recording an order that was already shipped.'
                : 'Marks this order shipped and emails the customer.'}
        </small>
      )}
      <span role="status">{message}</span>
      <AlertDialog
        open={confirmUndo}
        onOpenChange={(open) => {
          if (!busy) setConfirmUndo(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark this order as not shipped?</AlertDialogTitle>
            <AlertDialogDescription>
              Use this only to correct a mistake. The order returns to the Not shipped list and another operator may
              ship it. A shipping email already sent cannot be recalled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep shipped</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void change(false);
              }}
            >
              {busy ? 'Saving…' : 'Mark not shipped'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function OrderDetail({
  order,
  onSetDispatch,
}: {
  order: InternalOrder;
  onSetDispatch?: SetDispatch | undefined;
}) {
  const fulfillment = order.fulfillment;
  const attention = notificationStatus(order);
  const reviewReason = order.needsReviewReason ?? (fulfillment.kind === 'incomplete' ? fulfillment.reason : null);
  const { dispatch } = order;
  return (
    <>
      {order.awaitingStock && (
        <p className="order-notice">
          <Package aria-hidden="true" size={21} />
          <span>Awaiting stock. Hold this order until the pre-order copies arrive.</span>
        </p>
      )}
      <div className="order-facts" aria-label="Order status summary">
        <div>
          <span className="order-eyebrow">Payment</span>
          <OrderStatusLabel status={order.status} />
        </div>
        <div>
          {/* Derived from saved order data; staff record dispatch separately below. */}
          <span className="order-eyebrow">Shipping details</span>
          <span className="order-status">
            <ClipboardCheck size={19} aria-hidden="true" />
            {fulfillment.kind === 'current'
              ? 'Recorded'
              : fulfillment.kind === 'incomplete'
                ? 'Incomplete'
                : 'Unavailable'}
          </span>
        </div>
        <div>
          <span className="order-eyebrow">Dispatch</span>
          <span className={`order-status ${dispatch.shippedAt ? 'order-status--paid' : ''}`}>
            <Truck size={19} aria-hidden="true" />
            {dispatch.shippedAt ? 'Shipped' : 'Not shipped'}
          </span>
          {dispatch.updatedAt && (
            <small className="order-muted">
              {dispatch.shippedAt ? 'Marked' : 'Undone'} {formatOrderTime(dispatch.updatedAt)} by {dispatch.updatedBy}
            </small>
          )}
          {dispatch.lockerUsed && (
            <small className="order-muted">
              Locker used: {dispatch.lockerUsed.name} · {dispatch.lockerUsed.lockerId}
            </small>
          )}
          {dispatch.parcelNumbers.length > 0 && (
            <small className="order-muted">
              {dispatch.parcelNumbers.length > 1 ? 'Parcels' : 'Parcel'}: {dispatch.parcelNumbers.join(', ')}
            </small>
          )}
        </div>
        <div>
          <span className="order-eyebrow">Notifications</span>
          {attention ? <OrderStatusLabel status={attention} /> : <span>No notifications recorded</span>}
        </div>
      </div>
      {order.status === 'paid' && fulfillment.kind === 'current' && <SendParcelDetails fulfillment={fulfillment} />}
      {onSetDispatch && order.status === 'paid' && fulfillment.kind === 'current' && (
        <DispatchControl
          key={order.orderReference ?? order.checkoutSessionId}
          order={order}
          onSetDispatch={onSetDispatch}
        />
      )}
      {(order.status === 'needs_review' || fulfillment.kind === 'incomplete') && (
        <section className="order-review" aria-labelledby="review-heading">
          <h2 id="review-heading">
            <TriangleAlert aria-hidden="true" />
            Manual review required
          </h2>
          <p>
            {reviewReason && Object.hasOwn(reviewGuidance, reviewReason)
              ? reviewGuidance[reviewReason]
              : 'The review reason is unknown. Match the original payment and saved order facts using the manual exception procedure.'}
          </p>
          <p>
            Reason: <code>{reviewReason ?? 'Unknown'}</code>
          </p>
          <p>
            Follow the Commerce operations runbook, “Terminal order review”. Do not treat this order as ready for normal
            fulfillment.
          </p>
        </section>
      )}
      {fulfillment.kind === 'unavailable' && (
        <p className="order-notice">
          Complete paid fulfillment details are unavailable. Check the payment state before preparing this order.
        </p>
      )}
      {fulfillment.kind === 'current' && (
        <section className="order-section" aria-labelledby="items-heading">
          <h2 id="items-heading">
            <Disc3 aria-hidden="true" />
            Items
          </h2>
          <ul className="order-lines">
            {fulfillment.lines.map((line, index) => (
              <li key={`${line.variantId}-${index}`}>
                <Disc3 className="order-item-icon" size={28} aria-hidden="true" />
                <div>
                  <strong>{line.displayName}</strong>
                  <span>{line.optionLabel ?? 'No option label recorded'}</span>
                  {line.preorder && (
                    <small>
                      Pre-order
                      {line.preorder.shipEstimate
                        ? ` · ships ${orderShipEstimateText(line.preorder.shipEstimate)}`
                        : ''}{' '}
                      (shown at order time)
                    </small>
                  )}
                  <small>
                    Unit {money(line.unitAmountMinor)} · VAT{' '}
                    {order.taxCollectionMode === 'NO_TAX_COLLECTED' ? 'collected ' : ''}
                    {money(line.lineVatMinor)} · Tax rate{' '}
                    {line.taxRatePercent === null
                      ? order.taxCollectionMode === 'NO_TAX_COLLECTED'
                        ? 'Not applied'
                        : 'Unknown'
                      : `${line.taxRatePercent}%`}
                  </small>
                </div>
                <span>Qty {line.quantity}</span>
                <strong>{money(line.lineAmountMinor)}</strong>
              </li>
            ))}
          </ul>
          <dl className="order-totals">
            <Fact label="Merchandise">{money(fulfillment.merchandiseGrossMinor)}</Fact>
            <Fact label="Delivery">{money(fulfillment.deliveryGrossMinor)}</Fact>
            <Fact label={order.taxCollectionMode === 'NO_TAX_COLLECTED' ? 'Delivery VAT collected' : 'Delivery VAT'}>
              {money(fulfillment.deliveryVatMinor)}
            </Fact>
            <Fact label="Total">{money(fulfillment.amountTotalMinor)}</Fact>
            <Fact
              label={
                order.taxCollectionMode === 'NO_TAX_COLLECTED' ? 'VAT collected at checkout' : 'Total VAT (included)'
              }
            >
              {money(fulfillment.totalVatMinor)}
            </Fact>
          </dl>
          <p className="order-muted order-money-note">
            Amounts are the saved EUR order facts. Unknown historical values do not mean zero or tax-exempt.
            {order.taxCollectionMode === 'NO_TAX_COLLECTED' &&
              ' Zero records collection at checkout, not the seller’s tax liability or fiscal net amount.'}
          </p>
        </section>
      )}
      <div className={fulfillment.kind === 'current' ? 'order-detail-columns' : ''}>
        {fulfillment.kind === 'current' && (
          <section className="order-section" aria-labelledby="recipient-heading">
            <h2 id="recipient-heading">
              <UserRound aria-hidden="true" />
              Recipient &amp; contact
            </h2>
            <div className="order-recipient">
              <div>
                <strong>{fulfillment.recipientName}</strong>
                <p>
                  <MapPin size={18} aria-hidden="true" />
                  <span>
                    {[
                      fulfillment.shippingAddress.line1,
                      fulfillment.shippingAddress.line2,
                      `${fulfillment.shippingAddress.postalCode} ${fulfillment.shippingAddress.city}`,
                      fulfillment.shippingAddress.state,
                      'Greece (GR)',
                    ]
                      .filter(Boolean)
                      .map((line, index) => (
                        <span className="order-address-line" key={index}>
                          {line}
                        </span>
                      ))}
                  </span>
                </p>
              </div>
              <dl>
                <Fact label="Email">{fulfillment.shopperContact.email}</Fact>
                <Fact label="Phone">{fulfillment.shopperContact.phone ?? 'Not recorded'}</Fact>
                <Fact label="Newsletter consent">
                  {fulfillment.newsletterConsent.optedIn
                    ? `Opted in · ${formatOrderTime(fulfillment.newsletterConsent.consentedAt)} · ${fulfillment.newsletterConsent.copyVersion}`
                    : 'Not opted in'}
                </Fact>
              </dl>
            </div>
          </section>
        )}
        <section className="order-section" aria-labelledby="notifications-heading">
          <h2 id="notifications-heading">
            <Mail aria-hidden="true" />
            Notifications
          </h2>
          <p className="order-muted">
            Delivered describes the notification, not parcel dispatch or proof that an email was read.
          </p>
          {order.dispatch.shippingEmailSuppressed &&
            !order.deliveries.some((delivery) => delivery.kind === 'shopper_shipping') && (
              <p className="order-muted">Shipping email skipped</p>
            )}
          {order.deliveries.length ? (
            <ul className="order-deliveries">
              {order.deliveries.map((delivery, index) => (
                <li key={`${delivery.kind}-${index}`}>
                  <div className="order-delivery-heading">
                    <h3>{deliveryLabels[delivery.kind]}</h3>
                    <OrderStatusLabel status={delivery.status} />
                  </div>
                  <dl className="order-delivery-facts">
                    <Fact label="Attempts">{delivery.attemptCount}</Fact>
                    <Fact label="Next attempt">
                      {delivery.nextAttemptAt ? formatOrderTime(delivery.nextAttemptAt) : 'Not scheduled'}
                    </Fact>
                    <Fact label="Delivered at">
                      {delivery.deliveredAt ? formatOrderTime(delivery.deliveredAt) : 'Not recorded'}
                    </Fact>
                    <Fact label="Review at">
                      {delivery.needsReviewAt ? formatOrderTime(delivery.needsReviewAt) : 'Not recorded'}
                    </Fact>
                    <Fact label="Last updated">{formatOrderTime(delivery.updatedAt)}</Fact>
                    <Fact label="Reason">{delivery.safeReason ?? 'None recorded'}</Fact>
                  </dl>
                </li>
              ))}
            </ul>
          ) : (
            <p>No notifications recorded for this order.</p>
          )}
          <p className="order-muted">
            Pending attempts are handled by scheduled recovery. For exhausted attempts, follow “Paid delivery and manual
            dispatch” in the Commerce operations runbook.
          </p>
        </section>
      </div>
      <details className="order-section order-references">
        <summary>Order references &amp; timeline</summary>
        <dl className="order-delivery-facts">
          <Fact label="Checkout Session">
            <CopyReference value={order.checkoutSessionId} />
          </Fact>
          <Fact label="PaymentIntent">
            <CopyReference value={order.stripePaymentIntentId} />
          </Fact>
          <Fact label="Store Item">{order.storeItemSlug}</Fact>
          <Fact label="Variant">{order.variantId}</Fact>
          <Fact label="Created">{formatOrderTime(order.createdAt)}</Fact>
          <Fact label="Paid">{formatOrderTime(order.paidAt)}</Fact>
          <Fact label="Not paid">{formatOrderTime(order.notPaidAt)}</Fact>
          <Fact label="Review">{formatOrderTime(order.needsReviewAt)}</Fact>
          <Fact label="Status updated">{formatOrderTime(order.statusUpdatedAt)}</Fact>
          <Fact label="Order updated">{formatOrderTime(order.updatedAt)}</Fact>
          <Fact label="Checkout expires">{formatOrderTime(order.checkoutExpiresAt)}</Fact>
          <Fact label="Monetary policy">{order.monetaryPolicyReference ?? 'Unknown'}</Fact>
          <Fact label="Accepted delivery">{money(order.acceptedDeliveryAmountMinor)}</Fact>
          <Fact label="Accepted delivery category">{order.acceptedParcelTier ?? 'Unknown'}</Fact>
          {order.shippingLocker && (
            <Fact label="Historical locker">
              {order.shippingLocker.locker_name_or_label} · {order.shippingLocker.locker_id} ·{' '}
              {order.shippingLocker.country_code}
            </Fact>
          )}
        </dl>
      </details>
    </>
  );
}

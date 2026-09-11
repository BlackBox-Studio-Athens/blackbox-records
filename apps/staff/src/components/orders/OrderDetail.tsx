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
  UserRound,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { InternalOrder, OrderStatus } from '../../lib/backend/internal-order-api';

export const paymentLabels: Record<OrderStatus, string> = {
  pending_payment: 'Pending payment',
  paid: 'Paid',
  not_paid: 'Not paid',
  needs_review: 'Needs review',
};
const deliveryLabels = {
  shopper_confirmation: 'Shopper confirmation',
  ops_fulfillment: 'Fulfillment email',
  newsletter_registration: 'Newsletter registration',
};
const reviewGuidance: Record<string, string> = {
  stock_unavailable:
    'Check the payment and actual stock. Arrange an agreed resolution through the manual exception procedure.',
  line_mismatch:
    'Check the saved items, quantities, amounts and tax against the payment. Hold normal fulfillment while the mismatch is reviewed.',
  incomplete_fulfillment:
    'Verify the recipient, Greek shipping address and contact details. Keep any verified correction in the private dispatch record.',
  incomplete_paid_fulfillment:
    'Paid fulfillment data is incomplete. Verify the original payment and shipping details before packing.',
};

export function formatOrderTime(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
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
      {status === 'pending' ? 'Pending' : status === 'delivered' ? 'Delivered' : paymentLabels[status]}
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
function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export default function OrderDetail({ order }: { order: InternalOrder }) {
  const fulfillment = order.fulfillment;
  const attention = notificationStatus(order);
  const reviewReason = order.needsReviewReason ?? (fulfillment.kind === 'incomplete' ? fulfillment.reason : null);
  return (
    <>
      <div className="order-facts" aria-label="Order status summary">
        <div>
          <span className="order-eyebrow">Payment</span>
          <OrderStatusLabel status={order.status} />
        </div>
        <div>
          <span className="order-eyebrow">Fulfillment data</span>
          <span className={`order-status ${fulfillment.kind === 'current' ? 'order-status--paid' : ''}`}>
            <ClipboardCheck size={19} aria-hidden="true" />
            {fulfillment.kind === 'current'
              ? 'Complete'
              : fulfillment.kind === 'incomplete'
                ? 'Incomplete'
                : 'Unavailable'}
          </span>
        </div>
        <div>
          <span className="order-eyebrow">Notifications</span>
          {attention ? <OrderStatusLabel status={attention} /> : <span>No notifications recorded</span>}
        </div>
      </div>
      <p className="order-notice">
        <Package aria-hidden="true" size={21} />
        <span>
          Check the private dispatch record before packing. Complete paid data does not tell you whether a parcel has
          been dispatched.
        </span>
      </p>
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
        <>
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
                    <small>
                      Unit {money(line.unitAmountMinor)} · VAT {money(line.lineVatMinor)} · Tax rate{' '}
                      {line.taxRatePercent === null ? 'Unknown' : `${line.taxRatePercent}%`}
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
              <Fact label="Delivery VAT">{money(fulfillment.deliveryVatMinor)}</Fact>
              <Fact label="Total">{money(fulfillment.amountTotalMinor)}</Fact>
              <Fact label="Total VAT (included)">{money(fulfillment.totalVatMinor)}</Fact>
            </dl>
            <p className="order-muted order-money-note">
              Amounts are the saved EUR order facts. Unknown historical values do not mean zero or tax-exempt.
            </p>
          </section>
        </>
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
            {order.checkoutSessionId ?? 'No session recorded. This order has no permanent detail link.'}
          </Fact>
          <Fact label="PaymentIntent">{order.stripePaymentIntentId ?? 'Not recorded'}</Fact>
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
          <Fact label="Accepted parcel tier">{order.acceptedParcelTier ?? 'Unknown'}</Fact>
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

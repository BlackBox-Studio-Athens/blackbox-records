import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PrivacyLink } from '@/platform/components/PurchaseInformation';
import { submitPublicWithdrawal, type WithdrawalDeclaration, type WithdrawalReceipt } from './public-checkout-api';

type Details = Pick<WithdrawalDeclaration, 'name' | 'contract' | 'email'>;

export default function WithdrawalForm({
  submit = submitPublicWithdrawal,
}: {
  submit?: (declaration: WithdrawalDeclaration) => Promise<WithdrawalReceipt>;
}) {
  const [details, setDetails] = useState<Details>({ name: '', contract: '', email: '' });
  const [reviewing, setReviewing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<WithdrawalReceipt | null>(null);
  const [download, setDownload] = useState('');
  const attempt = useRef<{ id: string; fingerprint: string } | null>(null);
  const inFlight = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!receipt) return;
    const url = URL.createObjectURL(new Blob([receipt.receiptText], { type: 'text/plain;charset=utf-8' }));
    setDownload(url);
    return () => URL.revokeObjectURL(url);
  }, [receipt]);
  useEffect(() => {
    if (reviewing || receipt) heading.current?.focus();
  }, [reviewing, receipt]);

  async function confirm() {
    if (inFlight.current) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    const fingerprint = JSON.stringify(details);
    if (attempt.current?.fingerprint !== fingerprint) attempt.current = { id: crypto.randomUUID(), fingerprint };
    try {
      setReceipt(await submit({ ...details, submissionId: attempt.current.id, confirmed: true }));
    } catch {
      setError(
        'Your receipt could not be loaded. Try confirming again with the same details, or email orders@blackboxrecordsathens.com to withdraw.',
      );
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  if (receipt)
    return (
      <div className="space-y-5" role="status">
        <h2 ref={heading} tabIndex={-1} className="font-display text-3xl">
          Withdrawal received
        </h2>
        <p>
          Your declaration was recorded at <time dateTime={receipt.submittedAt}>{receipt.submittedAt} (UTC)</time>. An
          acknowledgement will be sent to {details.email}.
        </p>
        <p>Save your receipt now. This confirms receipt of your declaration; it does not confirm a refund.</p>
        {download && (
          <a
            className="inline-flex min-h-11 items-center underline underline-offset-4"
            href={download}
            download={`blackbox-withdrawal-${receipt.receiptId}.txt`}
          >
            Download withdrawal receipt
          </a>
        )}
        <pre className="whitespace-pre-wrap break-words border border-border p-4 font-sans text-sm leading-7">
          {receipt.receiptText}
        </pre>
      </div>
    );

  return (
    <div className="space-y-5" data-tone="store">
      {reviewing ? (
        <div className="space-y-5">
          <h2 ref={heading} tabIndex={-1} className="font-display text-3xl">
            Review your withdrawal
          </h2>
          <p>I hereby withdraw from the contract identified below.</p>
          <dl className="space-y-3 break-words border border-border p-4">
            <div>
              <dt className="text-muted-foreground">Full name</dt>
              <dd>{details.name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Order reference or identifying details</dt>
              <dd className="whitespace-pre-wrap">{details.contract}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Acknowledgement email</dt>
              <dd>{details.email}</dd>
            </div>
          </dl>
          <p>
            Confirming sends your withdrawal declaration to BlackBox Records. We will email a copy with the submission
            date and time.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              size="lg"
              disabled={pending}
              aria-busy={pending}
              onClick={() => {
                void confirm();
              }}
            >
              {pending ? 'Submitting…' : 'Confirm withdrawal'}
            </Button>
            <Button
              type="button"
              variant="link"
              disabled={pending}
              onClick={() => {
                setReviewing(false);
                setError('');
              }}
            >
              Edit details
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setDetails({ name: details.name.trim(), contract: details.contract.trim(), email: details.email.trim() });
            setReviewing(true);
          }}
        >
          <div className="space-y-2">
            <label htmlFor="withdrawal-name">Full name</label>
            <Input
              id="withdrawal-name"
              name="name"
              autoComplete="name"
              required
              maxLength={200}
              value={details.name}
              onChange={(event) => setDetails({ ...details, name: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="withdrawal-contract">Order reference or identifying details</label>
            <Textarea
              id="withdrawal-contract"
              name="contract"
              required
              maxLength={2000}
              aria-describedby="withdrawal-contract-help"
              value={details.contract}
              onChange={(event) => setDetails({ ...details, contract: event.target.value })}
            />
            <p id="withdrawal-contract-help" className="text-muted-foreground">
              Use the reference from your order email, or describe the goods and when you ordered. If withdrawing from
              part of an order, identify those goods. You do not need an account or a reason.
            </p>
          </div>
          <div className="space-y-2">
            <label htmlFor="withdrawal-email">Email for your acknowledgement</label>
            <Input
              id="withdrawal-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={details.email}
              onChange={(event) => setDetails({ ...details, email: event.target.value })}
            />
          </div>
          <Button type="submit" size="lg">
            Review withdrawal
          </Button>
        </form>
      )}
      {error && <p role="alert">{error}</p>}
      <PrivacyLink />
    </div>
  );
}

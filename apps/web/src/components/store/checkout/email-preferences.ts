import {
  PublicCheckoutApiError,
  confirmNewsletterRequest,
  requestAvailabilityAlertWithdrawalLink,
  withdrawAvailabilityAlerts,
} from './public-checkout-api';

// The same orders address the withdrawal, terms and cart notices name; the site has no configured support address.
export const EMAIL_PREFERENCES_SUPPORT_ADDRESS = 'orders@blackboxrecordsathens.com';

export const EMAIL_PREFERENCES_COPY = {
  newsletter: {
    title: 'Newsletter confirmation',
    intro: 'Confirming your email address…',
    submit: 'Try again',
  },
  withdrawal: {
    title: 'Availability alerts',
    intro: 'Stop all pending availability alerts for this email address.',
    submit: 'Withdraw pending alerts',
  },
  incomplete: 'This link is incomplete. Request a new link below.',
  newsletterIncomplete: 'Sign up again from the newsletter form to get a new link.',
  confirmed: [
    'Your email address has been confirmed. Existing unsubscribe preferences remain in place.',
    `If you unsubscribed before, this does not resubscribe you. Use the unsubscribe link in any newsletter email to change it, or write to ${EMAIL_PREFERENCES_SUPPORT_ADDRESS}.`,
  ],
  confirmExpired: 'This confirmation link has expired or was already used. Sign up again to get a new one.',
  confirmUnavailable: "We couldn't confirm right now. Wait an hour, then sign up again for a fresh link.",
  network: "Couldn't reach BlackBox Records. Check your connection and try again.",
  withdrawn: [
    'Withdrawal request processed. If this link was valid, pending alerts have been removed.',
    'An email already being sent may still arrive. Removed requests are never sent again.',
  ],
  withdrawUnavailable: "Couldn't withdraw right now. Try again later.",
  recoverySent:
    "If email delivery is available, you'll receive a link to manage pending alerts. If you've just requested one, use the email already sent or try again later.",
  invalidEmail: 'Enter a valid email.',
  recoveryFailed: "Couldn't send a link right now. Try again later.",
} as const;

export type EmailPreferencesAction = 'newsletter' | 'availability-withdrawal';
export type EmailPreferencesLink = { action?: EmailPreferencesAction; token?: string };
/** `final` means the control must not submit again: a newsletter token is consumed by any server answer. */
export type EmailPreferencesResult = {
  tone: 'status' | 'error';
  lines: readonly string[];
  final: boolean;
  invalidEmail?: boolean;
};

const TOKEN_PATTERN = /^[0-9a-f]{64}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reads `#action=…&token=…`; a token is returned only for a known action and a well-formed value. */
export function readEmailPreferencesFragment(hash: string): EmailPreferencesLink {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const value = params.get('action');
  const action = value === 'newsletter' || value === 'availability-withdrawal' ? value : undefined;
  const token = params.get('token') ?? '';
  return action && TOKEN_PATTERN.test(token) ? { action, token } : action ? { action } : {};
}

function failureStatus(error: unknown): number {
  return error instanceof PublicCheckoutApiError ? error.status : 0;
}

export async function confirmNewsletter(
  token: string,
  send: (token: string) => Promise<unknown> = confirmNewsletterRequest,
): Promise<EmailPreferencesResult> {
  try {
    await send(token);
    return { tone: 'status', lines: EMAIL_PREFERENCES_COPY.confirmed, final: true };
  } catch (error) {
    const status = failureStatus(error);
    if (status === 0) return { tone: 'error', lines: [EMAIL_PREFERENCES_COPY.network], final: false };
    // The server consumed or refused the token; resubmitting it can never succeed.
    const line = status === 400 ? EMAIL_PREFERENCES_COPY.confirmExpired : EMAIL_PREFERENCES_COPY.confirmUnavailable;
    return { tone: 'error', lines: [line], final: true };
  }
}

export async function withdrawAlerts(
  token: string,
  send: (token: string) => Promise<unknown> = withdrawAvailabilityAlerts,
): Promise<EmailPreferencesResult> {
  try {
    await send(token);
    return { tone: 'status', lines: EMAIL_PREFERENCES_COPY.withdrawn, final: true };
  } catch (error) {
    const status = failureStatus(error);
    if (status === 0) return { tone: 'error', lines: [EMAIL_PREFERENCES_COPY.network], final: false };
    if (status === 400) return { tone: 'error', lines: [EMAIL_PREFERENCES_COPY.incomplete], final: true };
    return { tone: 'error', lines: [EMAIL_PREFERENCES_COPY.withdrawUnavailable], final: false };
  }
}

export async function requestWithdrawalLink(
  email: string,
  send: (email: string) => Promise<unknown> = requestAvailabilityAlertWithdrawalLink,
): Promise<EmailPreferencesResult> {
  const invalid = {
    tone: 'error',
    lines: [EMAIL_PREFERENCES_COPY.invalidEmail],
    final: false,
    invalidEmail: true,
  } as const;
  const address = email.trim();
  if (!EMAIL_PATTERN.test(address)) return invalid;
  try {
    await send(address);
    return { tone: 'status', lines: [EMAIL_PREFERENCES_COPY.recoverySent], final: false };
  } catch (error) {
    if (failureStatus(error) === 400) return invalid;
    return { tone: 'error', lines: [EMAIL_PREFERENCES_COPY.recoveryFailed], final: false };
  }
}

/**
 * Wires the standalone email-preferences document. The capability fragment is read into memory and removed from the
 * address bar before anything else runs. Newsletter links confirm on arrival; alert withdrawal stays explicit.
 */
export function mountEmailPreferences(doc: Document = document): void {
  const link = readEmailPreferencesFragment(doc.location.hash);
  // The alert form's "manage alerts" link arrives without a fragment: offer recovery without calling it broken.
  const arrivedWithoutLink = doc.location.hash.length <= 1;
  if (doc.location.href.includes('#')) {
    history.replaceState(history.state, '', doc.location.pathname + doc.location.search);
  }

  const find = <T extends HTMLElement>(name: string) => doc.querySelector<T>(`[data-email-preferences-${name}]`)!;
  const app = find('app');
  const title = find('title');
  const intro = find('intro');
  const submit = find<HTMLButtonElement>('submit');
  const recovery = find('recovery');
  const form = find<HTMLFormElement>('form');
  const email = find<HTMLInputElement>('email');
  const send = find<HTMLButtonElement>('send');

  const copy = link.action === 'newsletter' ? EMAIL_PREFERENCES_COPY.newsletter : EMAIL_PREFERENCES_COPY.withdrawal;
  title.textContent = copy.title;
  if (link.token) {
    intro.textContent = copy.intro;
    submit.textContent = copy.submit;
    submit.hidden = link.action === 'newsletter';
  } else if (arrivedWithoutLink) {
    intro.hidden = true;
  } else {
    intro.textContent =
      link.action === 'newsletter'
        ? `${EMAIL_PREFERENCES_COPY.incomplete} ${EMAIL_PREFERENCES_COPY.newsletterIncomplete}`
        : EMAIL_PREFERENCES_COPY.incomplete;
  }
  recovery.hidden = link.action === 'newsletter' && Boolean(link.token);
  app.hidden = false;

  const show = (scope: 'action' | 'recovery', result: EmailPreferencesResult) => {
    const region = find(`${scope}-${result.tone}`);
    region.replaceChildren(
      ...result.lines.map((line) => {
        const paragraph = doc.createElement('p');
        const [before, after] = line.split(EMAIL_PREFERENCES_SUPPORT_ADDRESS);
        paragraph.append(before!);
        if (after !== undefined) {
          const mail = doc.createElement('a');
          mail.href = `mailto:${EMAIL_PREFERENCES_SUPPORT_ADDRESS}`;
          mail.textContent = EMAIL_PREFERENCES_SUPPORT_ADDRESS;
          paragraph.append(mail, after);
        }
        return paragraph;
      }),
    );
    return region;
  };
  const busy = (button: HTMLButtonElement, value: boolean) => {
    button.disabled = value;
    if (value) button.setAttribute('aria-busy', 'true');
    else button.removeAttribute('aria-busy');
  };
  const clear = (scope: 'action' | 'recovery') => {
    find(`${scope}-status`).replaceChildren();
    find(`${scope}-error`).replaceChildren();
  };

  const act = async () => {
    if (!link.token || submit.disabled) return;
    busy(submit, true);
    clear('action');
    const result =
      link.action === 'newsletter' ? await confirmNewsletter(link.token) : await withdrawAlerts(link.token);
    busy(submit, false);
    if (link.action === 'newsletter') {
      title.textContent = result.tone === 'status' ? 'Email confirmed' : 'Unable to confirm';
      intro.hidden = true;
      submit.hidden = result.final;
    }
    // Hide the control before focusing the result so focus never lands on a dead button.
    if (result.final) submit.hidden = true;
    show('action', result).focus();
  };

  const recover = async () => {
    if (send.disabled) return;
    busy(send, true);
    email.readOnly = true;
    clear('recovery');
    email.removeAttribute('aria-invalid');
    email.removeAttribute('aria-describedby');
    const result = await requestWithdrawalLink(email.value);
    busy(send, false);
    email.readOnly = false;
    const region = show('recovery', result);
    if (result.invalidEmail) {
      email.setAttribute('aria-invalid', 'true');
      email.setAttribute('aria-describedby', region.id);
      email.focus();
    } else {
      region.focus();
    }
  };

  submit.addEventListener('click', () => void act());
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void recover();
  });
  if (link.action === 'newsletter' && link.token) void act();
}

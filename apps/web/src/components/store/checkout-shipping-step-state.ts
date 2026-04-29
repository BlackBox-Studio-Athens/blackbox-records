export type CheckoutLockerSelection = {
  locker_id: string;
  country_code: string;
  locker_name_or_label: string;
};

export type CheckoutShippingGateView = {
  badgeLabel: string;
  canContinueToPayment: boolean;
  detail: string;
  isMockPickerAvailable: boolean;
  selectedLocker: CheckoutLockerSelection | null;
  title: string;
  tone: 'blocked' | 'empty' | 'ready';
};

export const LOCAL_MOCK_BOX_NOW_LOCKER_SELECTION: CheckoutLockerSelection = {
  locker_id: '4',
  country_code: 'GR',
  locker_name_or_label: 'ΛΕΩΦΟΡΟΣ ΠΕΝΤΕΛΗΣ 125, 15234',
};

export const CHECKOUT_SHIPPING_COPY = {
  blockedDetail:
    'This launch currently ships only to Greece through BOX NOW lockers. Payment is unavailable until a Greek locker can be selected.',
  blockedTitle: 'Shipping limited to Greece',
  changeLocker: 'Change Locker',
  continueSupport: 'Payment unlocks after the Greek locker is selected.',
  mockSelect: 'Use BOX NOW Test Locker',
  readyBadge: 'Locker selected',
  readyDetail: 'You can change this before payment.',
  stepSupport: 'Available for Greece orders only',
  stepTitle: 'Choose your BOX NOW Locker',
  unavailableDetail:
    'We could not load BOX NOW locker selection right now. Payment is unavailable until a locker can be selected.',
  unavailableTitle: 'Locker selection unavailable',
} as const;

export function normalizeCheckoutLockerSelection(value: CheckoutLockerSelection | null | undefined) {
  if (!value) return null;

  const lockerId = value.locker_id.trim();
  const countryCode = value.country_code.trim().toUpperCase();
  const lockerNameOrLabel = value.locker_name_or_label.trim();

  if (!lockerId || !countryCode || !lockerNameOrLabel) {
    return null;
  }

  return {
    locker_id: lockerId,
    country_code: countryCode,
    locker_name_or_label: lockerNameOrLabel,
  };
}

export function createCheckoutShippingGateView({
  checkoutClientMode,
  lockerSelection,
}: {
  checkoutClientMode: string | undefined;
  lockerSelection: CheckoutLockerSelection | null;
}): CheckoutShippingGateView {
  const normalizedLocker = normalizeCheckoutLockerSelection(lockerSelection);

  if (checkoutClientMode !== 'mock') {
    return {
      badgeLabel: 'Shipping blocked',
      canContinueToPayment: false,
      detail: CHECKOUT_SHIPPING_COPY.unavailableDetail,
      isMockPickerAvailable: false,
      selectedLocker: null,
      title: CHECKOUT_SHIPPING_COPY.unavailableTitle,
      tone: 'blocked',
    };
  }

  if (!normalizedLocker) {
    return {
      badgeLabel: 'Locker required',
      canContinueToPayment: false,
      detail: CHECKOUT_SHIPPING_COPY.continueSupport,
      isMockPickerAvailable: true,
      selectedLocker: null,
      title: CHECKOUT_SHIPPING_COPY.stepTitle,
      tone: 'empty',
    };
  }

  if (normalizedLocker.country_code !== 'GR') {
    return {
      badgeLabel: 'Shipping blocked',
      canContinueToPayment: false,
      detail: CHECKOUT_SHIPPING_COPY.blockedDetail,
      isMockPickerAvailable: true,
      selectedLocker: null,
      title: CHECKOUT_SHIPPING_COPY.blockedTitle,
      tone: 'blocked',
    };
  }

  return {
    badgeLabel: CHECKOUT_SHIPPING_COPY.readyBadge,
    canContinueToPayment: true,
    detail: CHECKOUT_SHIPPING_COPY.readyDetail,
    isMockPickerAvailable: true,
    selectedLocker: normalizedLocker,
    title: CHECKOUT_SHIPPING_COPY.stepTitle,
    tone: 'ready',
  };
}

export function readCheckoutShippingGateError(lockerSelection: CheckoutLockerSelection | null): string | null {
  const view = createCheckoutShippingGateView({
    checkoutClientMode: 'mock',
    lockerSelection,
  });

  return view.canContinueToPayment ? null : 'Select a Greece BOX NOW locker before payment opens.';
}

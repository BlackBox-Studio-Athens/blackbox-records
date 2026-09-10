export type AcceptedMonetaryPolicy = {
  acceptedDeliveryAmountMinor: number;
  acceptedParcelTier: 'small' | 'medium';
  monetaryPolicyReference: string;
};

export type OrderMonetarySnapshot = {
  merchandiseGrossMinor: number;
  deliveryGrossMinor: number;
  deliveryVatMinor: number;
  totalVatMinor: number;
};

export type OrderMonetaryFields = {
  [Key in keyof (AcceptedMonetaryPolicy & OrderMonetarySnapshot)]?:
    (AcceptedMonetaryPolicy & OrderMonetarySnapshot)[Key] | null;
};

export type WithdrawalDeclaration = {
  name: string;
  contract: string;
  email: string;
};

export type OrderWithdrawal = WithdrawalDeclaration & {
  id: string;
  fingerprint: string;
  submittedAt: string;
};

export type WithdrawalDelivery = OrderWithdrawal & {
  deliveryId: string;
  kind: 'acknowledgement' | 'support';
  attemptCount: number;
  leaseUntil: string;
};

export interface OrderWithdrawalRepository {
  record(
    input: OrderWithdrawal & { requesterHash: string },
  ): Promise<{ kind: 'recorded'; withdrawal: OrderWithdrawal } | { kind: 'conflict' } | { kind: 'limited' }>;
  claim(now: Date, id?: string): Promise<WithdrawalDelivery | null>;
  finish(
    delivery: WithdrawalDelivery,
    input: {
      status: 'delivered' | 'pending' | 'needs_review';
      nextAttemptAt: string | null;
      safeReason: string | null;
    },
  ): Promise<boolean>;
  listRecent(): Promise<
    Array<
      OrderWithdrawal & {
        deliveries: Array<{ kind: string; status: string; attemptCount: number; safeReason: string | null }>;
      }
    >
  >;
}

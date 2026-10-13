export type OrderDispatch = {
  orderId: string;
  shippedAt: string | null;
  updatedAt: string;
  updatedBy: string;
};

export interface OrderDispatchRepository {
  listByOrderIds(orderIds: string[]): Promise<OrderDispatch[]>;
  /** Changes the shipped mark only when the current mark matches `expectedShipped`. */
  set(input: {
    orderId: string;
    shipped: boolean;
    expectedShipped: boolean;
    operatorEmail: string;
    at: Date;
  }): Promise<'updated' | 'conflict'>;
}

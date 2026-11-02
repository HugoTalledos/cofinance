export interface Category {
  id: string;
  name: string;
  icon?: string;
}

import type { PaymentMethod, CreditCard } from '@cofinance/core'

export interface MovementPayload {
  category: Category;
  detail: string;
  value: number;
  date: Date;
  type: 'income' | 'expense';
  /** Solo en egresos */
  paymentMethod?: PaymentMethod;
  /** Solo en egresos con crédito */
  creditCard?: Pick<CreditCard, 'id' | 'bank'>;
}

/**
 * Valor inicial del formulario. Difiere de MovementPayload en que `date` es
 * un string YYYY-MM-DD, que es lo que consume el input nativo de fecha.
 */
export interface MovementFormValue {
  categoryId: string;
  detail: string;
  value: number;
  date: string;
  type: 'income' | 'expense';
  paymentMethod?: PaymentMethod;
  creditCardId?: string;
}

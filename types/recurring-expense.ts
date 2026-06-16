export interface RecurringExpense {
  id: string
  userId: string
  name: string
  description?: string
  /** Monto fijo. null significa que el monto es variable */
  fixedAmount: number | null
  categoryId: string
  categoryName: string
  createdAt: number
}

export type RecurringExpenseInput = Omit<RecurringExpense, 'id' | 'createdAt'>
export type RecurringExpenseUpdate = Partial<Omit<RecurringExpense, 'id' | 'userId' | 'createdAt'>>

export interface RecurringExpenseCheck {
  paid: boolean
  amount: number | null
}

/** Record<expenseId, checkState> — guardado en localStorage por periodo */
export type RecurringChecklist = Record<string, RecurringExpenseCheck>

export interface Category {
  id: string;
  name: string;
}

export interface MovementPayload {
  category: Category;
  detail: string;
  value: number;
  date: Date;
  type: 'income' | 'expense';
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
}
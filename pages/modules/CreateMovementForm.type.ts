export interface Category {
  id: string;
  name: string;
}

export interface MovementPayload {
  category: Category;
  detail: string;
  value: number;
  date: Date;
}
export const CATEGORIES = ["Salary", "Freelance", "Investment", "Food", "Transport", "Rent", "Utilities", "Equipment", "Entertainment", "Other"];

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => !["Salary", "Freelance", "Investment"].includes(c));

export const HIGH_VALUE_THRESHOLD = 50000;

export function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export interface BudgetAlert {
  category: string;
  limit: number;
  spent: number;
}

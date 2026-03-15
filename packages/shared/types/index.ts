export type InvoiceStatus = "DRAFT" | "SENT" | "PAID" | "PARTIAL" | "OVERDUE" | "CANCELLED";
export type QuoteStatus = "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type ExpenseCategory =
  | "Software"
  | "Hardware"
  | "Marketing"
  | "Travel"
  | "Office"
  | "Meals"
  | "Utilities"
  | "Professional Services"
  | "Subscriptions"
  | "Other";

export const INVOICE_STATUSES: InvoiceStatus[] = [
  "DRAFT", "SENT", "PAID", "PARTIAL", "OVERDUE", "CANCELLED",
];

export const QUOTE_STATUSES: QuoteStatus[] = [
  "DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED",
];

export const EXPENSE_CATEGORIES: string[] = [
  "Software",
  "Hardware",
  "Marketing",
  "Travel",
  "Office",
  "Meals",
  "Utilities",
  "Professional Services",
  "Subscriptions",
  "Other",
];

export type DealStatus = "OPEN" | "WON" | "LOST";
export type DealPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export const DEAL_PRIORITIES: DealPriority[] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export interface ApiError {
  error: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

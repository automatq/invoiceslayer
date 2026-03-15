import { z } from "zod";

export const QuoteItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Price must be positive"),
  taxRate: z.number().min(0).max(100).default(0),
});

export const CreateQuoteSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  expiryDate: z.string().min(1, "Expiry date is required"),
  notes: z.string().optional(),
  items: z.array(QuoteItemSchema).min(1, "At least one item is required"),
});

export const UpdateQuoteSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "ACCEPTED", "REJECTED", "EXPIRED"]).optional(),
  notes: z.string().optional(),
  expiryDate: z.string().optional(),
});

export type QuoteItemInput = z.infer<typeof QuoteItemSchema>;
export type CreateQuoteInput = z.infer<typeof CreateQuoteSchema>;
export type UpdateQuoteInput = z.infer<typeof UpdateQuoteSchema>;

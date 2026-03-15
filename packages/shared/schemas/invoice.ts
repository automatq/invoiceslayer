import { z } from "zod";

export const InvoiceItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Price must be positive"),
  taxRate: z.number().min(0).max(100).default(0),
});

export const CreateInvoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  projectId: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  notes: z.string().optional(),
  items: z.array(InvoiceItemSchema).min(1, "At least one item is required"),
});

export const UpdateInvoiceSchema = z.object({
  status: z.enum(["DRAFT", "SENT", "PAID", "PARTIAL", "OVERDUE", "CANCELLED"]).optional(),
  notes: z.string().optional(),
  dueDate: z.string().optional(),
});

export type InvoiceItemInput = z.infer<typeof InvoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;

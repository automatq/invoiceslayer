import { z } from "zod";

export const ClientSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  address: z.string().optional(),
  phone: z.string().optional(),
  vatNumber: z.string().optional(),
});

export const UpdateClientSchema = ClientSchema.partial();

export type ClientInput = z.infer<typeof ClientSchema>;
export type UpdateClientInput = z.infer<typeof UpdateClientSchema>;

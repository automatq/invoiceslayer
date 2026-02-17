"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const ClientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    address: z.string().optional(),
    phone: z.string().optional(),
    vatNumber: z.string().optional(),
    photo: z.string().optional(),
});

export async function getClients() {
    return await prisma.client.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function createClient(formData: FormData) {
    const rawData = {
        name: formData.get("name"),
        email: formData.get("email"),
        address: formData.get("address"),
        phone: formData.get("phone"),
        vatNumber: formData.get("vatNumber"),
        photo: formData.get("photo") || undefined,
    };

    const validatedData = ClientSchema.safeParse(rawData);

    if (!validatedData.success) {
        return {
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        };
    }

    try {
        await prisma.client.create({
            data: validatedData.data,
        });
    } catch (e) {
        return { message: "Database Error: Failed to create client" };
    }

    revalidatePath("/clients");
    redirect("/clients");
}

export async function getClient(id: string) {
    return await prisma.client.findUnique({
        where: { id },
        include: {
            invoices: { orderBy: { createdAt: "desc" } },
            quotes: { orderBy: { createdAt: "desc" } },
        },
    });
}
// ... (existing functions)

export async function updateClient(id: string, formData: FormData) {
    const rawData = {
        name: formData.get("name"),
        email: formData.get("email"),
        address: formData.get("address"),
        phone: formData.get("phone"),
        vatNumber: formData.get("vatNumber"),
        photo: formData.get("photo") || undefined,
    };

    const validatedData = ClientSchema.safeParse(rawData);

    if (!validatedData.success) {
        return {
            message: "Validation Error",
            errors: validatedData.error.flatten().fieldErrors,
        };
    }

    try {
        await prisma.client.update({
            where: { id },
            data: validatedData.data,
        });
    } catch (e) {
        return { message: "Database Error: Failed to update client" };
    }

    revalidatePath("/clients");
    // ... existing code
    revalidatePath(`/clients/${id}`);
    redirect(`/clients/${id}`);
}

export async function deleteClient(id: string) {
    try {
        // Check for related invoices or quotes first
        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        invoices: true,
                        quotes: true,
                    },
                },
            },
        });

        if (!client) {
            return { success: false, message: "Client not found" };
        }

        if (client._count.invoices > 0 || client._count.quotes > 0) {
            return {
                success: false,
                message: "Cannot delete client with active invoices or quotes. Please delete related records first."
            };
        }

        await prisma.client.delete({
            where: { id },
        });
        revalidatePath("/clients");
        return { success: true };
    } catch (e: any) {
        console.error("Delete client error:", e);
        return { success: false, message: "Database Error: Failed to delete client" };
    }
}

export async function getClientsByRevenue(limit = 5) {
    const clients = await prisma.client.findMany({
        include: {
            invoices: {
                select: {
                    amountPaid: true,
                },
            },
        },
    });

    const clientsWithRevenue = clients.map((client: any) => ({
        id: client.id,
        name: client.name,
        revenue: client.invoices.reduce((sum: number, inv: any) => sum + (inv.amountPaid || 0), 0),
    }));

    return clientsWithRevenue
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, limit);
}

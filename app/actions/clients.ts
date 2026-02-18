"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";
import { auth } from "@/lib/auth";

const ClientSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
    address: z.string().optional(),
    phone: z.string().optional(),
    vatNumber: z.string().optional(),
    photo: z.string().optional(),
});

async function getSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return session;
}

export async function getClients() {
    const session = await getSession();
    return await prisma.client.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
    });
}

export async function createClient(formData: FormData) {
    const session = await getSession();
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
            data: {
                ...validatedData.data,
                userId: session.user.id,
            },
        });
        await logAuditEvent({
            action: "CREATE",
            resource: "Client",
            metadata: { name: validatedData.data.name },
            userId: session.user.id
        });
    } catch (e) {
        console.error(e);
        return { message: "Database Error: Failed to create client" };
    }

    revalidatePath("/clients");
    redirect("/clients");
}

export async function getClient(id: string) {
    const session = await getSession();
    return await prisma.client.findUnique({
        where: {
            id,
            userId: session.user.id,
        },
        include: {
            invoices: { orderBy: { createdAt: "desc" } },
            quotes: { orderBy: { createdAt: "desc" } },
        },
    });
}

export async function updateClient(id: string, formData: FormData) {
    const session = await getSession();
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
            where: {
                id,
                userId: session.user.id,
            },
            data: validatedData.data,
        });
        await logAuditEvent({
            action: "UPDATE",
            resource: "Client",
            resourceId: id,
            userId: session.user.id
        });
    } catch (e) {
        console.error(e);
        return { message: "Database Error: Failed to update client" };
    }

    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    redirect(`/clients/${id}`);
}

export async function deleteClient(id: string) {
    const session = await getSession();
    try {
        // Check for related invoices or quotes first
        const client = await prisma.client.findUnique({
            where: {
                id,
                userId: session.user.id,
            },
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
            where: {
                id,
                userId: session.user.id,
            },
        });
        revalidatePath("/clients");
        await logAuditEvent({
            action: "DELETE",
            resource: "Client",
            resourceId: id,
            userId: session.user.id
        });
        return { success: true };
    } catch (e: any) {
        console.error("Delete client error:", e);
        return { success: false, message: "Database Error: Failed to delete client" };
    }
}

export async function getClientsByRevenue(limit = 5) {
    const session = await getSession();
    const clients = await prisma.client.findMany({
        where: { userId: session.user.id },
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

"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

export async function getProjects(clientId?: string) {
    const { userId } = await getRequiredSession();
    try {
        const where: any = { userId };
        if (clientId) where.clientId = clientId;

        const projects = await prisma.project.findMany({
            where,
            include: {
                client: true,
                _count: {
                    select: { invoices: true, expenses: true, quotes: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return projects;
    } catch (error) {
        console.error("Error fetching projects:", error);
        return [];
    }
}

export async function getProject(id: string) {
    const { userId } = await getRequiredSession();
    try {
        const project = await prisma.project.findUnique({
            where: {
                id,
                userId,
            },
            include: {
                client: true,
                invoices: true,
                expenses: true,
                quotes: true
            }
        });
        return project;
    } catch (error) {
        console.error("Error fetching project:", error);
        return null;
    }
}

export async function createProject(data: { name: string; description?: string; clientId: string; status?: string }) {
    const { userId } = await getRequiredSession();
    try {
        const project = await prisma.project.create({
            data: {
                name: data.name,
                description: data.description,
                status: data.status || "ACTIVE",
                client: { connect: { id: data.clientId } },
                user: { connect: { id: userId } },
            }
        });


        await logAuditEvent({
            action: "CREATE",
            resource: "Project",
            resourceId: project.id,
            userId
        });

        revalidatePath("/projects");
        revalidatePath(`/clients/${data.clientId}`);
        return { success: true, project };
    } catch (error) {
        console.error("Error creating project:", error);
        return { success: false, error: "Failed to create project" };
    }
}

export async function updateProject(id: string, data: { name?: string; description?: string; status?: string }) {
    const { userId } = await getRequiredSession();
    try {
        const project = await prisma.project.update({
            where: {
                id,
                userId,
            },
            data
        });

        await logAuditEvent({
            action: "UPDATE",
            resource: "Project",
            resourceId: id,
            userId
        });

        revalidatePath("/projects");
        return { success: true, project };
    } catch (error) {
        console.error("Error updating project:", error);
        return { success: false, error: "Failed to update project" };
    }
}

export async function deleteProject(id: string) {
    const { userId } = await getRequiredSession();
    try {
        await prisma.project.delete({
            where: {
                id,
                userId,
            }
        });

        await logAuditEvent({
            action: "DELETE",
            resource: "Project",
            resourceId: id,
            userId
        });

        revalidatePath("/projects");
        return { success: true };
    } catch (error) {
        console.error("Error deleting project:", error);
        return { success: false, error: "Failed to delete project" };
    }
}

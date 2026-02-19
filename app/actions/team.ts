"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { randomBytes } from "crypto";

async function getRequiredSession() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    return { userId: session.user.id, session };
}

export type CreateTeamInput = {
    name: string;
    slug: string;
};

export async function createTeam(data: CreateTeamInput) {
    const { userId } = await getRequiredSession();
    
    try {
        const team = await prisma.team.create({
            data: {
                name: data.name,
                slug: data.slug,
                members: {
                    create: {
                        userId,
                        role: "OWNER"
                    }
                }
            }
        });
        
        revalidatePath("/settings/team");
        return { success: true, team };
    } catch (e: any) {
        if (e.message?.includes("slug")) {
            return { success: false, message: "Team slug already exists" };
        }
        return { success: false, message: e.message };
    }
}

export async function getMyTeams() {
    const { userId } = await getRequiredSession();
    
    const teams = await prisma.teamMember.findMany({
        where: { userId },
        include: {
            team: {
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, name: true, email: true, image: true }
                            }
                        }
                    },
                    _count: {
                        select: { members: true }
                    }
                }
            }
        },
        orderBy: { joinedAt: "desc" }
    });
    
    return teams;
}

export async function getTeamBySlug(slug: string) {
    const { userId } = await getRequiredSession();
    
    const team = await prisma.team.findUnique({
        where: { slug },
        include: {
            members: {
                include: {
                    user: {
                        select: { id: true, name: true, email: true, image: true }
                    }
                }
            },
            invitations: {
                where: { accepted: false, expiresAt: { gt: new Date() } }
            }
        }
    });
    
    if (!team) return null;
    
    // Check if user is a member
    const isMember = team.members.some(m => m.userId === userId);
    if (!isMember) return null;
    
    return team;
}

export type InviteMemberInput = {
    teamId: string;
    email: string;
    role: "ADMIN" | "ACCOUNTANT" | "SALES" | "VIEWER";
};

export async function inviteMember(data: InviteMemberInput) {
    const { userId } = await getRequiredSession();
    
    // Check if user has permission to invite (OWNER or ADMIN)
    const membership = await prisma.teamMember.findFirst({
        where: { teamId: data.teamId, userId }
    });
    
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
        return { success: false, message: "Unauthorized" };
    }
    
    // Generate invitation token
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    try {
        const invitation = await prisma.invitation.create({
            data: {
                teamId: data.teamId,
                email: data.email,
                role: data.role,
                token,
                expiresAt
            }
        });
        
        // TODO: Send invitation email
        
        revalidatePath("/settings/team");
        return { success: true, invitation };
    } catch (e: any) {
        if (e.message?.includes("teamId_email")) {
            return { success: false, message: "Invitation already sent to this email" };
        }
        return { success: false, message: e.message };
    }
}

export async function acceptInvitation(token: string) {
    const { userId } = await getRequiredSession();
    
    const invitation = await prisma.invitation.findUnique({
        where: { token }
    });
    
    if (!invitation) {
        return { success: false, message: "Invalid invitation" };
    }
    
    if (invitation.expiresAt < new Date()) {
        return { success: false, message: "Invitation expired" };
    }
    
    if (invitation.accepted) {
        return { success: false, message: "Invitation already accepted" };
    }
    
    // Get user email to verify
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
    });
    
    if (user?.email !== invitation.email) {
        return { success: false, message: "This invitation is for a different email address" };
    }
    
    // Add member to team
    await prisma.$transaction([
        prisma.teamMember.create({
            data: {
                teamId: invitation.teamId,
                userId,
                role: invitation.role
            }
        }),
        prisma.invitation.update({
            where: { id: invitation.id },
            data: { accepted: true }
        })
    ]);
    
    revalidatePath("/settings/team");
    return { success: true };
}

export async function removeMember(teamId: string, memberId: string) {
    const { userId } = await getRequiredSession();
    
    // Check if user has permission (OWNER or ADMIN)
    const membership = await prisma.teamMember.findFirst({
        where: { teamId, userId }
    });
    
    if (!membership || !["OWNER", "ADMIN"].includes(membership.role)) {
        return { success: false, message: "Unauthorized" };
    }
    
    // Cannot remove owner
    const targetMember = await prisma.teamMember.findUnique({
        where: { id: memberId }
    });
    
    if (targetMember?.role === "OWNER") {
        return { success: false, message: "Cannot remove team owner" };
    }
    
    await prisma.teamMember.delete({
        where: { id: memberId }
    });
    
    revalidatePath("/settings/team");
    return { success: true };
}

export async function updateMemberRole(teamId: string, memberId: string, role: string) {
    const { userId } = await getRequiredSession();
    
    // Check if user has permission (OWNER only can change roles)
    const membership = await prisma.teamMember.findFirst({
        where: { teamId, userId }
    });
    
    if (membership?.role !== "OWNER") {
        return { success: false, message: "Only owner can change roles" };
    }
    
    await prisma.teamMember.update({
        where: { id: memberId },
        data: { role: role as any }
    });
    
    revalidatePath("/settings/team");
    return { success: true };
}

export async function deleteTeam(teamId: string) {
    const { userId } = await getRequiredSession();
    
    // Only owner can delete
    const membership = await prisma.teamMember.findFirst({
        where: { teamId, userId, role: "OWNER" }
    });
    
    if (!membership) {
        return { success: false, message: "Only owner can delete team" };
    }
    
    await prisma.team.delete({
        where: { id: teamId }
    });
    
    revalidatePath("/settings/team");
    return { success: true };
}

export async function getCurrentTeam() {
    const { userId } = await getRequiredSession();
    
    // Get user's personal team (first team they own) or first team they're in
    const membership = await prisma.teamMember.findFirst({
        where: { userId },
        include: { team: true },
        orderBy: [
            { role: "asc" }, // OWNER first
            { joinedAt: "asc" }
        ]
    });
    
    return membership?.team || null;
}

export async function switchTeam(teamId: string) {
    const { userId } = await getRequiredSession();
    
    const membership = await prisma.teamMember.findFirst({
        where: { teamId, userId }
    });
    
    if (!membership) {
        return { success: false, message: "Not a member of this team" };
    }
    
    return { success: true, teamId };
}

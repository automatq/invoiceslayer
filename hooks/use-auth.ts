"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";

export function useAuth() {
    const { data: session, status } = useSession();

    const isLoading = status === "loading";

    const user = session?.user ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
    } : null;

    const signOut = async (options?: { callbackUrl?: string }) => {
        await nextAuthSignOut({ callbackUrl: options?.callbackUrl || "/login" });
    };

    return {
        user,
        isLoading,
        status,
        signOut,
        isClerk: false
    };
}

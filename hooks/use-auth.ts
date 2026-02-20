"use client";

import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import { useUser, useClerk } from "@clerk/nextjs";

const IS_CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export function useAuth() {
    // Auth.js
    const { data: session, status } = useSession();

    // Clerk
    const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
    const { signOut: clerkSignOut } = useClerk();

    const isLoading = IS_CLERK_ENABLED ? !isClerkLoaded : status === "loading";

    const user = IS_CLERK_ENABLED
        ? (clerkUser ? {
            id: clerkUser.id,
            name: clerkUser.fullName,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            image: clerkUser.imageUrl,
        } : null)
        : (session?.user ? {
            id: session.user.id,
            name: session.user.name,
            email: session.user.email,
            image: session.user.image,
        } : null);

    const signOut = async (options?: { callbackUrl?: string }) => {
        if (IS_CLERK_ENABLED) {
            await clerkSignOut({ redirectUrl: options?.callbackUrl || "/" });
        } else {
            await nextAuthSignOut({ callbackUrl: options?.callbackUrl || "/login" });
        }
    };

    return {
        user,
        isLoading,
        status: IS_CLERK_ENABLED ? (clerkUser ? "authenticated" : "unauthenticated") : status,
        signOut,
        isClerk: IS_CLERK_ENABLED
    };
}

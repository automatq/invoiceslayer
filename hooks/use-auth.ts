"use client";

import { useUser, useClerk } from "@clerk/nextjs";

export function useAuth() {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const isLoading = !isLoaded;

  const user = clerkUser
    ? {
        id: clerkUser.id,
        name: clerkUser.fullName,
        email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
        image: clerkUser.imageUrl ?? null,
      }
    : null;

  const signOut = async (options?: { callbackUrl?: string }) => {
    await clerkSignOut({ redirectUrl: options?.callbackUrl || "/sign-in" });
  };

  return {
    user,
    isLoading,
    status: isLoading ? "loading" : clerkUser ? "authenticated" : "unauthenticated",
    signOut,
  };
}

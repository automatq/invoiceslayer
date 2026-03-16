import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";

/**
 * Drop-in replacement for next-auth's auth().
 * Returns a session-like object with { user: { id, name, email, image } }
 * so existing server actions don't need to change their auth pattern.
 */
export async function auth() {
  const { userId } = await clerkAuth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();

  return {
    user: {
      id: userId,
      name: user?.firstName
        ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
        : null,
      email: user?.emailAddresses?.[0]?.emailAddress ?? null,
      image: user?.imageUrl ?? null,
    },
  };
}

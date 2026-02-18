import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";

export default {
    providers: [
        ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
            ? [
                Google({
                    clientId: process.env.AUTH_GOOGLE_ID,
                    clientSecret: process.env.AUTH_GOOGLE_SECRET,
                }),
            ]
            : []),
        ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
            ? [
                GitHub({
                    clientId: process.env.AUTH_GITHUB_ID,
                    clientSecret: process.env.AUTH_GITHUB_SECRET,
                }),
            ]
            : []),
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isApiRoute = nextUrl.pathname.startsWith("/api");
            const isPublicRoute =
                nextUrl.pathname.startsWith("/login") ||
                nextUrl.pathname.startsWith("/register") ||
                nextUrl.pathname.startsWith("/p/") || // Public portal routes
                nextUrl.pathname.startsWith("/api/webhooks") ||
                nextUrl.pathname.startsWith("/api/docs");

            if (isApiRoute || isPublicRoute) return true;

            if (!isLoggedIn) return false;
            return true;
        },
    },
} satisfies NextAuthConfig;

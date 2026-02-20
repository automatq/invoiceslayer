import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const SECURITY_HEADERS = {
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://*.turso.io https://api.resend.com https://api.stripe.com",
        "frame-ancestors 'none'",
    ].join("; "),
};

const CRON_ROUTES = ["/api/cron/recurring", "/api/cron/reminders"];
const AUTH_PAGES = ["/login", "/register"];
const PUBLIC_PORTAL_ROUTES = ["/p/", "/portal/"];
const PUBLIC_APP_ROUTES = ["/onboarding", "/images"];

export default auth((req) => {
    const { pathname } = req.nextUrl;
    const isLoggedIn = !!req.auth;

    // 1. Handle Auth APIs
    if (pathname.startsWith("/api/auth")) {
        return;
    }

    // 2. Cron Protection
    if (CRON_ROUTES.some((route) => pathname.includes(route))) {
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers.get("authorization");
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    // 3. Route Protection Logic
    const isAuthPage = AUTH_PAGES.some((page) => pathname.includes(page));
    const isPublicPortalRoute = PUBLIC_PORTAL_ROUTES.some((route) => pathname.includes(route));
    const isPublicAppRoute = PUBLIC_APP_ROUTES.some((route) => pathname.includes(route));

    // Protected Route Handling
    if (!isLoggedIn && !isAuthPage && !isPublicPortalRoute && !isPublicAppRoute) {
        console.log(`[proxy] Redirecting unauthenticated user to /login`);
        return NextResponse.redirect(new URL(`/login`, req.url));
    }

    // Authenticated User on Auth Page Handling
    if (isLoggedIn && isAuthPage) {
        console.log(`[proxy] Redirecting authenticated user to /`);
        return NextResponse.redirect(new URL(`/`, req.url));
    }

    const response = NextResponse.next();

    // 4. Apply Security Headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)", "/api/cron/:path*"],
};


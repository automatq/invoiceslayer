import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const { auth } = NextAuth(authConfig);

// Create i18n middleware
const intlMiddleware = createMiddleware(routing);

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

    console.log('[proxy] pathname:', pathname, 'isLoggedIn:', isLoggedIn);

    // 0. Apply i18n middleware first (handles locale routing)
    const intlResponse = intlMiddleware(req);
    if (intlResponse && intlResponse.status !== 200) {
        console.log('[proxy] Returning intlResponse redirect/rewrite (non-200)');
        return intlResponse;
    }

    // Default response is the intlResponse (which might have a rewrite) or NextResponse.next()
    const getBaseResponse = () => intlResponse || NextResponse.next();

    // 1. Cron protection
    if (CRON_ROUTES.some((route) => pathname.startsWith(route))) {
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers.get("authorization");
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return getBaseResponse();
    }

    // 2. Route protection
    const isAuthPage = AUTH_PAGES.some((page) => pathname.includes(page));
    const isAuthApi = pathname.startsWith("/api/auth");
    const isPublicPortalRoute = PUBLIC_PORTAL_ROUTES.some((route) => pathname.startsWith(route));
    const isPublicAppRoute = PUBLIC_APP_ROUTES.some((route) => pathname.includes(route));

    // Allow auth APIs to pass through
    if (isAuthApi) return getBaseResponse();

    // Redirect logged-in users away from login/register pages
    if (isAuthPage) {
        if (isLoggedIn) {
            return NextResponse.redirect(new URL("/", req.url));
        }
        return getBaseResponse();
    }

    // Redirect unauthenticated users to login, except for public routes
    if (!isLoggedIn && !isPublicPortalRoute && !isPublicAppRoute) {
        // Get locale from pathname or use default
        const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }

    // 3. Security Headers
    const response = getBaseResponse();
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        response.headers.set(key, value);
    });

    return response;
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)", "/api/cron/:path*"],
};


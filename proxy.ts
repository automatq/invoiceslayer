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

    // 0. Handle Public Assets & Static Files first (though matcher should exclude them)
    if (pathname.includes('.') || pathname.startsWith('/_next')) {
        return NextResponse.next();
    }

    console.log(`[middleware] Processing ${pathname} (Logged In: ${isLoggedIn})`);

    // 1. Handle Auth APIs (MUST NOT be localized)
    const isAuthApi = pathname.startsWith("/api/auth");
    if (isAuthApi) {
        return NextResponse.next();
    }

    // 2. Apply i18n middleware
    const response = intlMiddleware(req);

    // If intlMiddleware redirects, return immediately
    if (response.status >= 300 && response.status < 400) {
        console.log(`[proxy] i18n Redirect: ${response.status} to ${response.headers.get('location')}`);
        return response;
    }

    // 3. Cron Protection (Return 401 directly if fails)
    if (CRON_ROUTES.some((route) => pathname.includes(route))) {
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers.get("authorization");
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    // 4. Route Protection Logic
    const isAuthPage = AUTH_PAGES.some((page) => pathname.includes(page));
    const isPublicPortalRoute = PUBLIC_PORTAL_ROUTES.some((route) => pathname.includes(route));
    const isPublicAppRoute = PUBLIC_APP_ROUTES.some((route) => pathname.includes(route));

    // Handle protected routes
    if (!isLoggedIn && !isAuthPage && !isAuthApi && !isPublicPortalRoute && !isPublicAppRoute) {
        const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        console.log(`[proxy] Unauthenticated access to ${pathname}, redirecting to /${locale}/login`);
        return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }

    // Handle authenticated users on auth pages
    if (isLoggedIn && isAuthPage) {
        const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
        const locale = localeMatch ? localeMatch[1] : 'en';
        console.log(`[proxy] Authenticated user on auth page, redirecting to /${locale}`);
        return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }

    // 4. Apply Security Headers to the final response
    // NOTE: Temporarily disabling CSP to rule out script blocking issues
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        if (key !== "Content-Security-Policy") {
            response.headers.set(key, value);
        }
    });

    return response;
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)", "/api/cron/:path*"],
};


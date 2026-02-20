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

    // 1. Handle Auth APIs (MUST NOT be localized)
    if (pathname.startsWith("/api/auth")) {
        return;
    }

    // 2. Extract locale for manual propagation
    // This ensures that even if intlMiddleware fails to set headers (e.g. on redirects),
    // we have a fallback for the rendering layer.
    const localeMatch = pathname.match(/^\/([a-z]{2})(?:\/|$)/);
    const locale = localeMatch ? localeMatch[1] : 'en';

    // 3. Apply i18n middleware
    const response = intlMiddleware(req);

    // Manually ensure the locale header is present for the rendering layer
    response.headers.set('x-next-intl-locale', locale);

    // 4. If intlMiddleware wants a redirect (e.g. adding missing locale), honor it
    if (response.status >= 300 && response.status < 400) {
        console.log(`[proxy] i18n redirect to ${response.headers.get('location')}`);
        return response;
    }

    // 5. Cron Protection
    if (CRON_ROUTES.some((route) => pathname.includes(route))) {
        const cronSecret = process.env.CRON_SECRET;
        const authHeader = req.headers.get("authorization");
        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    // 6. Route Protection Logic
    const isAuthPage = AUTH_PAGES.some((page) => pathname.includes(page));
    const isPublicPortalRoute = PUBLIC_PORTAL_ROUTES.some((route) => pathname.includes(route));
    const isPublicAppRoute = PUBLIC_APP_ROUTES.some((route) => pathname.includes(route));

    // Protected Route Handling
    if (!isLoggedIn && !isAuthPage && !isPublicPortalRoute && !isPublicAppRoute) {
        console.log(`[proxy] Redirecting unauthenticated user to /${locale}/login`);
        const redirectUrl = new URL(`/${locale}/login`, req.url);
        const redirectRes = NextResponse.redirect(redirectUrl);

        // CRITICAL: Propagate locale and cookies to the redirect response
        redirectRes.headers.set('x-next-intl-locale', locale);
        response.cookies.getAll().forEach(c => redirectRes.cookies.set(c.name, c.value));
        return redirectRes;
    }

    // Authenticated User on Auth Page Handling
    if (isLoggedIn && isAuthPage) {
        console.log(`[proxy] Redirecting authenticated user to /${locale}`);
        const redirectUrl = new URL(`/${locale}`, req.url);
        const redirectRes = NextResponse.redirect(redirectUrl);

        // CRITICAL: Propagate locale and cookies to the redirect response
        redirectRes.headers.set('x-next-intl-locale', locale);
        response.cookies.getAll().forEach(c => redirectRes.cookies.set(c.name, c.value));
        return redirectRes;
    }

    // 7. Apply Security Headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
        if (key !== "Content-Security-Policy") { // Keeping CSP disabled for debug
            response.headers.set(key, value);
        }
    });

    return response;
});

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|images).*)", "/api/cron/:path*"],
};


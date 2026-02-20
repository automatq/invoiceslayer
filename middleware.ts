import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { auth } from "@/lib/auth";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
    // Use the intl middleware to handle locale-specific routing
    return intlMiddleware(req);
});

export const config = {
    // Match all pathnames except for
    // - /api (API routes)
    // - /_next (Next.js internals)
    // - /_static (inside /public)
    // - /favicon.ico, /sitemap.xml, /robots.txt (static files)
    matcher: ['/((?!api|_next|_static|favicon.ico|sitemap.xml|robots.txt).*)']
};

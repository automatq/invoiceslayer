import { ReactNode } from "react";

// Server component: detects deployment context and passes it down
export default function OnboardingLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

// Export deployment context as a server-side helper
export function getDeploymentContext() {
    const hasOAuth = !!(
        (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) ||
        (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)
    );
    const hasTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
    const isCloudDeployment = hasOAuth || hasTurso;
    return { isCloudDeployment, hasOAuth, hasTurso };
}

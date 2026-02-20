// Server component — reads env vars and passes context to the client wizard
import { auth } from "@/lib/auth";
import { OnboardingWizard } from "./wizard";
import { getSettings } from "@/app/actions/settings";
import { redirect } from "next/navigation";

import { auth as clerkAuth } from "@clerk/nextjs/server";

export default async function OnboardingPage() {
    const session = await auth();

    // Guard Clerk auth call – only attempt if key is present to avoid crash in "sovereign" mode
    let clerkUserId: string | null = null;
    if (process.env.CLERK_SECRET_KEY) {
        const clerkRes = await clerkAuth();
        clerkUserId = clerkRes.userId;
    }
    const settings = await getSettings();

    const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
    const githubEnabled = !!(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
    const hasTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
    const isCloudDeployment = googleEnabled || githubEnabled || hasTurso;
    const isClerkEnabled = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

    // Determine the active session based on priority. Priority goes to Clerk if enabled.
    const activeSession = isClerkEnabled ? (clerkUserId ? { user: { id: clerkUserId } } : null) : session;

    // If user has already completed onboarding, redirect to dashboard
    if (settings) {
        redirect("/");
    }

    // If no active session for the current mode, redirect to login
    if (!activeSession) {
        redirect("/login");
    }

    return (
        <OnboardingWizard
            isCloudDeployment={isCloudDeployment}
            googleEnabled={googleEnabled}
            githubEnabled={githubEnabled}
            hasSettings={!!settings}
        />
    );
}

// Server component — reads env vars and passes context to the client wizard
import { auth } from "@/lib/auth";
import { OnboardingWizard } from "./wizard";
import { getSettings } from "@/app/actions/settings";
import { redirect } from "next/navigation";



export default async function OnboardingPage() {
    const session = await auth();
    const settings = await getSettings();

    const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
    const githubEnabled = !!(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);
    const hasTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
    const isCloudDeployment = googleEnabled || githubEnabled || hasTurso;

    // If user has already completed onboarding, redirect to dashboard
    if (settings) {
        redirect("/");
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

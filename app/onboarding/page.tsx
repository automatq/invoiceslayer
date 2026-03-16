// Server component — reads env vars and passes context to the client wizard
import { auth } from "@/lib/auth";
import { OnboardingWizard } from "./wizard";
import { getSettings } from "@/app/actions/settings";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
    const session = await auth();
    const settings = await getSettings();

    const hasTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
    const isCloudDeployment = hasTurso || !!process.env.CLERK_SECRET_KEY;

    // If user has already completed onboarding, redirect to dashboard
    if (settings) {
        redirect("/");
    }

    return (
        <OnboardingWizard
            isCloudDeployment={isCloudDeployment}
            googleEnabled={false}
            githubEnabled={false}
            hasSettings={!!settings}
        />
    );
}

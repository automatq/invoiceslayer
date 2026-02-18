// Server component — reads env vars and passes context to the client wizard
import { OnboardingWizard } from "./wizard";

export default function OnboardingPage() {
    const hasOAuth = !!(
        (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) ||
        (process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET)
    );
    const hasTurso = !!(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
    const isCloudDeployment = hasOAuth || hasTurso;

    return <OnboardingWizard isCloudDeployment={isCloudDeployment} />;
}

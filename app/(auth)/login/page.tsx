import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
    const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
    const githubEnabled = !!(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

    return (
        <div className="flex h-full w-full items-center justify-center">
            <LoginForm
                googleEnabled={googleEnabled}
                githubEnabled={githubEnabled}
            />
        </div>
    );
}

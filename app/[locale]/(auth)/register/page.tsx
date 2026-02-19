import { RegisterForm } from "@/components/RegisterForm";

export default function RegisterPage() {
    const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
    const githubEnabled = !!(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

    return (
        <div className="flex h-full w-full items-center justify-center">
            <RegisterForm
                googleEnabled={googleEnabled}
                githubEnabled={githubEnabled}
            />
        </div>
    );
}

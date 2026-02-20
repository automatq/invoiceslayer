import { LoginForm } from "@/components/LoginForm";
import { SignIn } from "@clerk/nextjs";

const IS_CLERK_ENABLED = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function LoginPage() {
    const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
    const githubEnabled = !!(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET);

    if (IS_CLERK_ENABLED) {
        return (
            <div className="flex h-full w-full items-center justify-center py-10">
                <SignIn />
            </div>
        );
    }

    return (
        <div className="flex h-full w-full items-center justify-center">
            <LoginForm
                googleEnabled={googleEnabled}
                githubEnabled={githubEnabled}
            />
        </div>
    );
}

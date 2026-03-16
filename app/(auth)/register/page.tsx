import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <SignUp fallbackRedirectUrl="/onboarding" />
    </div>
  );
}

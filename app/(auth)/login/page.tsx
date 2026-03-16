import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <SignIn fallbackRedirectUrl="/" />
    </div>
  );
}

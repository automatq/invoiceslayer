import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <SignUp />
    </div>
  );
}

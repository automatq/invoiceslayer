"use client";

// Checking task.md, we have "Onboarding Flow" but no specific Auth provider mentioned other than "Advanced Auth: Add NextAuth.js" in Next Steps.
// The current schema has a User model but no auth implementation details in the summary.
// For now, I'll create a simple placeholder that links to settings or profile.

import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import Link from "next/link";

export function UserButton() {
    return (
        <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-full">
                <User className="h-5 w-5" />
            </Button>
        </Link>
    );
}

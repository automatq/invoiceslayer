"use client";

import { useAuth } from "@/hooks/use-auth";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { User, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { UserButton as ClerkUserButton } from "@clerk/nextjs";

export function UserButton() {
    const { user, signOut, isClerk } = useAuth();

    if (!user) return null;

    if (isClerk) {
        return <ClerkUserButton afterSignOutUrl="/" />;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <InteractiveButton variant="ghost" size="icon" className="rounded-full">
                    {user.image ? (
                        <img
                            src={user.image}
                            alt={user.name || "User"}
                            className="h-5 w-5 rounded-full"
                        />
                    ) : (
                        <User className="h-5 w-5" />
                    )}
                </InteractiveButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

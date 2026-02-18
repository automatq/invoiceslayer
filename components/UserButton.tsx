"use client";

import { useSession, signOut } from "next-auth/react";
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

export function UserButton() {
    const { data: session } = useSession();

    if (!session?.user) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <InteractiveButton variant="ghost" size="icon" className="rounded-full">
                    {session.user.image ? (
                        <img
                            src={session.user.image}
                            alt={session.user.name || "User"}
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
                        <p className="text-sm font-medium leading-none">{session.user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
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

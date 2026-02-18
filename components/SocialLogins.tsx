"use client";

import { signIn } from "next-auth/react";
import { InteractiveButton } from "@/components/ui/interactive-button";
import { Chrome, Github } from "lucide-react";

interface SocialLoginsProps {
    googleEnabled: boolean;
    githubEnabled: boolean;
}

export function SocialLogins({ googleEnabled, githubEnabled }: SocialLoginsProps) {
    if (!googleEnabled && !githubEnabled) return null;

    const onClick = (provider: "google" | "github") => {
        signIn(provider, {
            callbackUrl: "/",
        });
    };

    return (
        <div className="space-y-4 w-full">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-950 px-2 text-zinc-500">Or continue with</span>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {googleEnabled && (
                    <InteractiveButton
                        variant="outline"
                        onClick={() => onClick("google")}
                        className="bg-zinc-900/50 border-zinc-800 text-white hover:bg-zinc-800 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    >
                        <Chrome className="mr-2 h-4 w-4" />
                        Google
                    </InteractiveButton>
                )}
                {githubEnabled && (
                    <InteractiveButton
                        variant="outline"
                        onClick={() => onClick("github")}
                        className="bg-zinc-900/50 border-zinc-800 text-white hover:bg-zinc-800 transition-all shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                    >
                        <Github className="mr-2 h-4 w-4" />
                        GitHub
                    </InteractiveButton>
                )}
            </div>
        </div>
    );
}

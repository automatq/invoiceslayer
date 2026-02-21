"use client";

import Link, { LinkProps } from "next/link";
import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";
import React from "react";

type CombinedLinkProps = LinkProps &
    MotionProps &
    VariantProps<typeof buttonVariants> &
    Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps> & {
        children: React.ReactNode;
    };

const MotionLink = motion(Link);

export function InteractiveLink({
    className,
    variant,
    size,
    children,
    ...props
}: CombinedLinkProps) {
    const isIcon = size?.toString().includes("icon");
    const isGhost = variant === "ghost" || variant === "link";
    const isSubtle = isIcon || isGhost;

    return (
        <MotionLink
            className={cn(
                buttonVariants({ variant, size, className }),
                !isSubtle && "relative overflow-hidden border border-white/10 dark:border-white/10 group bg-slate-950 dark:bg-black hover:bg-slate-900 dark:hover:bg-zinc-900 text-white shadow-lg shadow-black/20"
            )}
            style={
                !isSubtle ? {
                    "--shimmer-color": "#ffffff",
                    "--speed": "3s",
                } as React.CSSProperties : undefined
            }
            whileTap={{ scale: 0.95 }}
            whileHover={
                isSubtle
                    ? { scale: 1.1 }
                    : {
                        scale: 1.05,
                        filter: "brightness(1.1)",
                    }
            }
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            {...(props as any)}
        >
            {/* Shimmer Button Logic - Only for non-subtle buttons */}
            {!isSubtle && (
                <>
                    {/* Spinning Gradient Border */}
                    <div className="absolute top-1/2 left-1/2 -z-20 h-[500%] w-[500%] -translate-x-1/2 -translate-y-1/2 [background:conic-gradient(transparent_0deg,transparent_300deg,var(--shimmer-color)_360deg)] opacity-0 group-hover:opacity-100 group-hover:animate-spin-around transition-opacity duration-300 pointer-events-none" />

                    {/* Backdrop */}
                    <div
                        className={cn(
                            "absolute inset-[1.5px] -z-10 rounded-[calc(var(--radius)-1.5px)] pointer-events-none bg-inherit",
                            "transition-colors duration-300 group-hover:brightness-110 shadow-lg"
                        )}
                    />
                </>
            )}

            <div className="relative z-10 flex items-center gap-2">{children}</div>
        </MotionLink>
    );
}

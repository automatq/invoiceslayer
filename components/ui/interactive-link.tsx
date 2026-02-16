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
                !isSubtle && "relative overflow-hidden border border-white/10 group bg-transparent hover:bg-transparent text-white dark:text-white hover:text-white"
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
                    <div className="absolute top-1/2 left-1/2 -z-20 h-[500%] w-[500%] -translate-x-1/2 -translate-y-1/2 animate-spin-around [background:conic-gradient(transparent_0deg,transparent_300deg,var(--shimmer-color)_360deg)] opacity-100" />

                    {/* Backdrop */}
                    <div
                        className={cn(
                            "absolute inset-[1.5px] -z-10 rounded-[calc(var(--radius)-1.5px)] bg-black",
                            "transition-colors duration-300 group-hover:bg-[#202020]"
                        )}
                    />
                </>
            )}

            <div className="relative z-10 flex items-center gap-2">{children}</div>
        </MotionLink>
    );
}

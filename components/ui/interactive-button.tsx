"use client";

import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";
import React from "react";

type InteractiveButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
    MotionProps &
    VariantProps<typeof buttonVariants> & {
        children: React.ReactNode;
        loading?: boolean;
    };

export function InteractiveButton({
    className,
    variant,
    size,
    children,
    loading,
    disabled,
    ...props
}: InteractiveButtonProps) {
    const isIcon = size?.toString().includes("icon");
    const isGhost = variant === "ghost" || variant === "link";
    const isSubtle = isIcon || isGhost;

    return (
        <motion.button
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
            disabled={disabled || loading}
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

            <div className="relative z-10 flex items-center gap-2">
                {loading && (
                    <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                )}
                {children}
            </div>
        </motion.button>
    );
}

"use client";

import { motion, MotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { VariantProps } from "class-variance-authority";
import React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";

type InteractiveButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
    MotionProps &
    VariantProps<typeof buttonVariants> & {
        children: React.ReactNode;
        loading?: boolean;
        asChild?: boolean;
    };

export const InteractiveButton = React.forwardRef<HTMLButtonElement, InteractiveButtonProps>(({
    className,
    variant,
    size,
    children,
    loading,
    disabled,
    asChild = false,
    ...props
}, ref) => {
    const isIcon = size?.toString().includes("icon");
    const isGhost = variant === "ghost" || variant === "link";
    const isSubtle = isIcon || isGhost;

    const commonClasses = cn(
        buttonVariants({ variant, size, className }),
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden isolation-isolate",
        !isSubtle && "border border-white/10 dark:border-white/10 bg-slate-950 dark:bg-black text-white shadow-lg shadow-black/20"
    );

    const commonStyle = !isSubtle ? {
        "--shimmer-color": "#ffffff",
        "--speed": "3s",
    } as React.CSSProperties : undefined;

    const decorations = !isSubtle && (
        <>
            {/* Spinning Shimmer Effect */}
            <div
                className="absolute top-1/2 left-1/2 -z-20 h-[500%] w-[500%] -translate-x-1/2 -translate-y-1/2 [background:conic-gradient(transparent_0deg,transparent_300deg,var(--shimmer-color)_360deg)] opacity-0 group-hover:opacity-100 group-hover:animate-spin-around transition-opacity duration-300 pointer-events-none"
            />
            {/* Backdrop Layer */}
            <div
                className={cn(
                    "absolute inset-[1.5px] -z-10 rounded-[calc(var(--radius)-1.5px)] bg-slate-950 dark:bg-black pointer-events-none",
                    "transition-colors duration-300 group-hover:bg-slate-900 dark:group-hover:bg-zinc-900 shadow-lg"
                )}
            />
        </>
    );

    const loadingSpinner = loading && (
        <svg
            className="h-4 w-4 animate-spin shrink-0 relative z-20"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
        >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );

    if (asChild) {
        return (
            <Slot
                ref={ref as any}
                className={commonClasses}
                style={commonStyle}
                {...(props as any)}
            >
                <Slottable>{children}</Slottable>
                {loadingSpinner}
                {decorations}
            </Slot>
        );
    }

    return (
        <motion.button
            ref={ref}
            className={commonClasses}
            style={commonStyle}
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
            <Slottable>{children}</Slottable>
            {loadingSpinner}
            {decorations}
        </motion.button>
    );
});

InteractiveButton.displayName = "InteractiveButton";

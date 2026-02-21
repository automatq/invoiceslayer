"use client";

import * as React from "react"
import { Slot, Slottable } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, Check } from "lucide-react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps
  extends React.ComponentProps<"button">,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  success?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  success = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const {
    onClick,
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    ...buttonProps
  } = props

  const isIcon = size?.toString().includes("icon");
  const isGhost = variant === "ghost" || variant === "link";
  const isCalendar = (props as any)["data-day"] !== undefined;
  const isSubtle = isIcon || isGhost;

  const commonClasses = cn(
    buttonVariants({ variant, size, className }),
    "group transition-all duration-300",
    !isSubtle && !isCalendar && "border border-white/10 dark:border-white/20 shadow-lg shadow-black/20"
  );

  if (asChild) {
    return (
      <Slot
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={commonClasses}
        style={{
          "--shimmer-color": "#ffffff",
          "--speed": "3s"
        } as React.CSSProperties}
        {...props}
      >
        <div className="flex items-center gap-2 relative z-20">
          <Slottable>{children}</Slottable>
        </div>
        {/* Premium Shimmer Effect - Only for non-subtle, non-calendar buttons */}
        {!isSubtle && !isCalendar && (
          <>
            <div
              className="absolute top-1/2 left-1/2 -z-20 h-[500%] w-[500%] -translate-x-1/2 -translate-y-1/2 [background:conic-gradient(transparent_0deg,transparent_300deg,var(--shimmer-color)_360deg)] opacity-0 group-hover:opacity-100 group-hover:animate-spin-around transition-opacity duration-300 pointer-events-none"
            />
            <div
              className={cn(
                "absolute inset-[1.5px] -z-10 rounded-[calc(var(--radius)-1.5px)] pointer-events-none bg-inherit",
                "transition-colors duration-300 group-hover:brightness-110 shadow-lg"
              )}
            />
          </>
        )}
      </Slot>
    )
  }


  return (
    <motion.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      className={commonClasses}
      style={{
        "--shimmer-color": "#ffffff",
        "--speed": "3s"
      } as React.CSSProperties}
      whileTap={isCalendar ? {} : { scale: 0.95 }}
      whileHover={
        isCalendar
          ? {}
          : isSubtle
            ? { scale: 1.1 }
            : {
              scale: 1.05,
              filter: "brightness(1.1)",
            }
      }
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
      onClick={onClick}
      {...buttonProps}
    >
      {/* Premium Shimmer Effect - Only for non-subtle, non-calendar buttons */}
      {!isSubtle && !isCalendar && (
        <>
          {/* Spinning Shimmer Effect */}
          <div
            className="absolute top-1/2 left-1/2 -z-20 h-[500%] w-[500%] -translate-x-1/2 -translate-y-1/2 [background:conic-gradient(transparent_0deg,transparent_300deg,var(--shimmer-color)_360deg)] opacity-0 group-hover:opacity-100 group-hover:animate-spin-around transition-opacity duration-300 pointer-events-none"
          />
          {/* Backdrop Layer */}
          <div
            className={cn(
              "absolute inset-[1.5px] -z-10 rounded-[calc(var(--radius)-1.5px)] pointer-events-none bg-inherit",
              "transition-colors duration-300 group-hover:brightness-110 shadow-lg"
            )}
          />
        </>
      )}

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 relative z-20"
          >
            <Check className="size-4" />
            <span>Success</span>
          </motion.div>
        ) : loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2 relative z-20"
          >
            <Loader2 className="size-4 animate-spin" />
            <span>Loading...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="flex items-center gap-2 relative z-20"
          >
            {children}
          </motion.div>
        )
        }
      </AnimatePresence>
    </motion.button>
  )
}

export { Button, buttonVariants }

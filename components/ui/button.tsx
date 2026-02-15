import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { motion, AnimatePresence, useAnimate } from "framer-motion"
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

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant,
    size,
    asChild = false,
    loading: loadingProp,
    success: successProp,
    children,
    disabled,
    onClick,
    ...props
  }, ref) => {
    // If asChild is true, we simply render the Slot.
    // Note: Animations might not work perfectly with asChild depending on what the child is,
    // but typically asChild is used for layout/links where loading state isn't primary.
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    const [scope, animate] = useAnimate()
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSuccess, setIsSuccess] = React.useState(false)

    // Sync with external props
    React.useEffect(() => {
      if (loadingProp !== undefined) {
        if (loadingProp) animateLoading()
        // If we stop loading and success isn't true, we ostensibly go back to normal
        // implicitly handled by logic below via state
      }
    }, [loadingProp])

    React.useEffect(() => {
      // If success prop is passed, trigger success animation
      if (successProp) {
        animateSuccess()
      }
    }, [successProp])


    const animateLoading = async () => {
      setIsLoading(true)
      // We animate the loader in
      await animate(
        ".loader-container",
        { width: "auto", opacity: 1, scale: 1 },
        { duration: 0.2 }
      )
    }

    const animateSuccess = async () => {
      setIsLoading(false)
      setIsSuccess(true)

      // Animate loader out if it was visible
      await animate(
        ".loader-container",
        { width: 0, opacity: 0, scale: 0 },
        { duration: 0.2 }
      )

      // Animate success in
      await animate(
        ".success-container",
        { width: "auto", opacity: 1, scale: 1 },
        { duration: 0.2 }
      )

      // Wait a bit
      setTimeout(async () => {
        // Animate success out
        if (scope.current) { // Check if still mounted
          await animate(
            ".success-container",
            { width: 0, opacity: 0, scale: 0 },
            { duration: 0.2 }
          )
          setIsSuccess(false)
        }
      }, 2000)
    }

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        // If the click handler returns a promise, we can auto-trigger loading
        const result = onClick(e) as any
        if (result && result instanceof Promise) {
          animateLoading()
          try {
            await result
            animateSuccess()
          } catch (error) {
            // If error, stop loading
            setIsLoading(false)
            animate(
              ".loader-container",
              { width: 0, opacity: 0, scale: 0 },
              { duration: 0.2 }
            )
          }
        }
      }
    }

    // Determine effective loading state for disabled attribute
    const effectiveLoading = loadingProp || isLoading

    return (
      <motion.button
        ref={scope}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || effectiveLoading}
        onClick={handleClick}
        layout
        {...(props as any)} // Cast to any to avoid framer-motion interactions with strict HTML props
      >
        <motion.div className="loader-container overflow-hidden flex items-center justify-center"
          initial={{ width: 0, opacity: 0, scale: 0 }}
          style={{ width: loadingProp ? "auto" : 0, opacity: loadingProp ? 1 : 0, scale: loadingProp ? 1 : 0 }} // Hydration Safety
        >
          <Loader2 className="animate-spin mr-2" size={16} />
        </motion.div>

        <motion.div className="success-container overflow-hidden flex items-center justify-center"
          initial={{ width: 0, opacity: 0, scale: 0 }}
        >
          <Check className="mr-2" size={16} />
        </motion.div>

        <motion.span layout className="flex items-center justify-center">
          {children}
        </motion.span>
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

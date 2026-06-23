import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border [font-family:var(--app-font-mono)] text-[11px] font-semibold tracking-[0.04em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--live-focus-ring)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-[color:color-mix(in_srgb,var(--live-accent-text)_36%,transparent)] bg-transparent text-[var(--live-accent-text)] hover:bg-[color-mix(in_srgb,var(--live-accent-text)_8%,transparent)]",
        destructive:
          "border-[color:color-mix(in_srgb,var(--live-danger)_42%,transparent)] bg-transparent text-[var(--live-danger)] hover:bg-[color-mix(in_srgb,var(--live-danger)_8%,transparent)]",
        outline:
          "border-[color:var(--live-control-border)] bg-transparent text-[var(--live-text-soft)] hover:bg-[var(--live-hover-surface)]",
        secondary:
          "border-[color:var(--live-control-border)] bg-[var(--live-input-inset)] text-[var(--live-text)] hover:bg-[var(--live-hover-surface)]",
        ghost: "border border-transparent",
        link: "border-transparent text-[var(--live-accent-text)] underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-9 px-4 py-2",
        sm: "min-h-8 rounded-md px-3 text-xs",
        lg: "min-h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

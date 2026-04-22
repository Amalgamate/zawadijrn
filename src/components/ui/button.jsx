import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"
import { cn } from "../../utils/cn"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-purple text-white hover:bg-brand-purple/90 hover:shadow-lg hover:shadow-brand-purple/30 border border-brand-purple/30",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-lg hover:shadow-rose-600/30 border border-rose-600/30",
        outline: "border-2 border-brand-purple text-brand-purple hover:bg-brand-purple/5 hover:shadow-md active:bg-brand-purple/10",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-md border border-gray-200",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-brand-purple underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(
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

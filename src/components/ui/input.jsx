import * as React from "react"
import { cn } from "../../utils/cn"

const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-2 text-base ring-offset-white placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:border-brand-purple transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm hover:border-gray-300",
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }

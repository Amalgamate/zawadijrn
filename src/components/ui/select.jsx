import * as React from "react"
import { cn } from "../../utils/cn"
import { ChevronDown } from "lucide-react"

// ─── Context ──────────────────────────────────────────────────────────────────
const SelectContext = React.createContext({})

// ─── Root ─────────────────────────────────────────────────────────────────────
const Select = ({ value, onValueChange, children, defaultValue }) => {
  const [open, setOpen] = React.useState(false)
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? '')
  const controlled = value !== undefined
  const current = controlled ? value : internalValue
  const ref = React.useRef(null)

  const handleChange = (val) => {
    if (!controlled) setInternalValue(val)
    onValueChange?.(val)
    setOpen(false)
  }

  // Close on outside click
  React.useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <SelectContext.Provider value={{ open, setOpen, value: current, handleChange }}>
      <div ref={ref} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

// ─── Trigger ──────────────────────────────────────────────────────────────────
const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SelectContext)
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setOpen(o => !o)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        open && "ring-2 ring-brand-purple ring-offset-2",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown size={16} className={cn("opacity-50 transition-transform duration-200 flex-shrink-0 ml-1", open && "rotate-180")} />
    </button>
  )
})
SelectTrigger.displayName = "SelectTrigger"

// ─── Value ────────────────────────────────────────────────────────────────────
const SelectValue = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext)
  const [label, setLabel] = React.useState(null)
  const ctx = React.useContext(SelectContext)

  // We resolve the label from SelectItem children via context
  return (
    <span className={cn("block truncate", !value && "text-gray-400")}>
      <SelectValueResolver placeholder={placeholder} />
    </span>
  )
}

// Internal resolver that walks context to find the selected item's label
const SelectValueResolver = ({ placeholder }) => {
  const { value } = React.useContext(SelectContext)
  const labelsRef = React.useContext(SelectLabelsContext)
  const label = labelsRef?.current?.[value]
  return <>{label ?? placeholder ?? value ?? ''}</>
}

const SelectLabelsContext = React.createContext(null)

// Wrap Select to provide labels map
const SelectWithLabels = ({ children, ...props }) => {
  const labelsRef = React.useRef({})
  return (
    <SelectLabelsContext.Provider value={labelsRef}>
      <Select {...props}>{children}</Select>
    </SelectLabelsContext.Provider>
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────
const SelectContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { open } = React.useContext(SelectContext)
  if (!open) return null
  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-md animate-in fade-in-80",
        className
      )}
      {...props}
    >
      <div className="max-h-60 overflow-y-auto p-1">
        {children}
      </div>
    </div>
  )
})
SelectContent.displayName = "SelectContent"

// ─── Item ─────────────────────────────────────────────────────────────────────
const SelectItem = React.forwardRef(({ className, children, value, ...props }, ref) => {
  const { value: current, handleChange } = React.useContext(SelectContext)
  const labelsRef = React.useContext(SelectLabelsContext)

  // Register this item's label
  React.useEffect(() => {
    if (labelsRef?.current && value !== undefined) {
      labelsRef.current[value] = children
    }
  }, [value, children, labelsRef])

  const isSelected = current === value

  return (
    <div
      ref={ref}
      role="option"
      aria-selected={isSelected}
      onClick={() => handleChange(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-3 pr-8 text-sm outline-none hover:bg-gray-100 focus:bg-gray-100",
        isSelected && "bg-brand-purple/10 font-medium text-brand-purple",
        className
      )}
      {...props}
    >
      {children}
      {isSelected && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3 text-brand-purple">
            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
          </svg>
        </span>
      )}
    </div>
  )
})
SelectItem.displayName = "SelectItem"

// ─── Group / Label ────────────────────────────────────────────────────────────
const SelectGroup = ({ children, ...props }) => <div {...props}>{children}</div>
const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("py-1.5 pl-3 pr-2 text-xs font-semibold text-gray-500", className)} {...props} />
))
SelectLabel.displayName = "SelectLabel"

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("-mx-1 my-1 h-px bg-gray-100", className)} {...props} />
))
SelectSeparator.displayName = "SelectSeparator"

export {
  SelectWithLabels as Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}

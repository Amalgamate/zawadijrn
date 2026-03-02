import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "../../utils/cn"
import { Calendar } from "./calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "./popover"

export function DatePicker({
    value,
    onChange,
    label,
    placeholder = "Pick a date",
    className,
    disabled
}) {
    return (
        <div className={cn("grid gap-2", className)}>
            {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{label}</label>}
            <Popover>
                <PopoverTrigger asChild>
                    <button
                        disabled={disabled}
                        className={cn(
                            "w-full flex h-10 items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-purple focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                            !value && "text-slate-500"
                        )}
                    >
                        <span className="flex items-center text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {value ? format(typeof value === 'string' ? new Date(value) : value, "PPP") : <span>{placeholder}</span>}
                        </span>
                    </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={typeof value === 'string' ? new Date(value) : value}
                        onSelect={onChange}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

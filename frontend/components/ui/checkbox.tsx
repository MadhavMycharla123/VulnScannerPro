"use client"
import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, checked, ...props }, ref) => {
    const handleClick = () => {
      if (onCheckedChange) onCheckedChange(!checked)
    }
    return (
      <div
        role="checkbox"
        aria-checked={!!checked}
        tabIndex={0}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-primary cursor-pointer flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary/50",
          checked ? "bg-primary" : "bg-transparent",
          className
        )}
        onClick={handleClick}
        onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") handleClick() }}
      >
        {checked && <Check className="h-3 w-3 text-primary-foreground" />}
        <input
          type="checkbox"
          ref={ref}
          checked={!!checked}
          onChange={() => {}}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
          {...props}
        />
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

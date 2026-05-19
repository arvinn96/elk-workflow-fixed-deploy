import * as React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 transition-all duration-150',
          'focus:outline-none focus:border-brand-500 focus:shadow-[0_0_0_1px_rgba(200,16,46,0.1)]',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-100',
          error && 'border-red-400 focus:border-red-500 focus:shadow-[0_0_0_1px_rgba(239,68,68,0.1)]',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }

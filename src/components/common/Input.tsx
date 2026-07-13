import clsx from 'clsx'
import { forwardRef, type InputHTMLAttributes } from 'react'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, ...props }, ref) {
  return <input className={clsx('input-field', className)} ref={ref} {...props} />
})

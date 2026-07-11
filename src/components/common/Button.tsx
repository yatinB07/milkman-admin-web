import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link'
type ButtonSize = 'default' | 'compact' | 'icon'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'primary-button',
  secondary: 'secondary-button',
  danger: 'danger-button',
  ghost: 'ghost-button',
  link: 'link-button',
}

export function Button({
  variant = 'secondary',
  size = 'default',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(variantClass[variant], size === 'compact' && 'is-compact', size === 'icon' && 'is-icon', className)}
      type={type}
      {...props}
    />
  )
}

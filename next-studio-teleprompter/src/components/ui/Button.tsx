import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'record' | 'secondary' }

export function Button({ children, className = '', variant = 'secondary', ...props }: PropsWithChildren<ButtonProps>) {
  return <button className={`button button-${variant} ${className}`} type="button" {...props}>{children}</button>
}

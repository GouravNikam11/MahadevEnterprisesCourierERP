import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { inputClass } from './layout/uiClasses'

type PasswordInputProps = InputHTMLAttributes<HTMLInputElement>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className = '', ...props },
  ref,
) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? 'text' : 'password'}
        autoComplete={props.autoComplete ?? 'current-password'}
        className={[inputClass, 'pr-10', className].filter(Boolean).join(' ')}
        {...props}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-erp-muted transition-colors hover:bg-erp-hover hover:text-erp-text"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
})

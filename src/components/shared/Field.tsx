import { ReactNode } from 'react'
import { Label } from '@/components/ui/label'

interface FieldProps {
  label: string
  error?: string
  children: ReactNode
  className?: string
}

export function Field({ label, error, children, className }: FieldProps) {
  return (
    <div className={`space-y-1.5 w-full ${className || ''}`}>
      <Label className="text-xs font-medium text-slate-700">{label}</Label>
      <div className="w-full">{children}</div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

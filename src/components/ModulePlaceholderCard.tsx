import { LucideIcon, Construction, Layers } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ModulePlaceholderCardProps {
  title: string
  description?: string
  icon?: LucideIcon
}

export function ModulePlaceholderCard({
  title,
  description,
  icon: Icon = Construction,
}: ModulePlaceholderCardProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
              {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
            </div>
          </div>
        </div>
        <Badge
          variant="outline"
          className="w-fit border-indigo-200 bg-indigo-50/50 text-indigo-700 px-3 py-1 text-xs"
        >
          <Layers className="mr-1.5 h-3.5 w-3.5" />
          Módulo do Sistema
        </Badge>
      </div>

      <Card className="border border-dashed border-slate-300 bg-white shadow-xs transition-all hover:shadow-subtle">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50/80 text-indigo-600 ring-8 ring-indigo-50/40">
            <Icon className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Módulo em desenvolvimento.</h3>
          <p className="max-w-md text-sm text-slate-600 leading-relaxed mb-6">
            Este módulo estará disponível em uma próxima etapa. Estamos preparando recursos
            avançados para a gestão completa de {title.toLowerCase()}.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-medium text-slate-600">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Status: Em Breve — Holding Aguiar
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

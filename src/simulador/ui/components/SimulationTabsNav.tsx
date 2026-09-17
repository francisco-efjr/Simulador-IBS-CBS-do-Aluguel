import React from 'react'
import { Calculator, Layers, Scale, BookOpen, Code2 } from 'lucide-react'
import { ActiveTab } from './Navbar.tsx'

interface SimulationTabsNavProps {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  isProfessional?: boolean
}

interface NavItem {
  id: ActiveTab
  label: string
  icon: typeof Calculator
  professionalOnly?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'single', label: 'Contrato Individual', icon: Calculator },
  { id: 'portfolio', label: 'Gestão de Portfólio', icon: Layers },
  { id: 'comparative', label: 'Cenário Comparativo', icon: Scale },
  { id: 'legal', label: 'Dossiê Jurídico', icon: BookOpen, professionalOnly: true },
  { id: 'api', label: 'Integração & Cronograma', icon: Code2, professionalOnly: true },
]

export const PUBLIC_TABS: ActiveTab[] = NAV_ITEMS.filter((i) => !i.professionalOnly).map(
  (i) => i.id,
)

export const SimulationTabsNav: React.FC<SimulationTabsNavProps> = ({
  activeTab,
  setActiveTab,
  isProfessional = false,
}) => {
  const navItems = NAV_ITEMS.filter((item) => isProfessional || !item.professionalOnly)

  return (
    <div className="bg-surface/95 border border-sim-border rounded-2xl p-2 shadow-[0_2px_12px_rgba(0,0,0,0.04)] sticky top-16 z-30 backdrop-blur-md transition-colors">
      <nav
        className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
        role="tablist"
        aria-label="Módulos de simulação"
      >
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              id={`aba-${item.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`painel-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2.5 px-4 sm:px-5 min-h-[48px] rounded-xl text-base font-semibold transition-colors shrink-0 select-none cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent-bg/40 ${
                isActive
                  ? 'bg-accent-bg text-accent-fg'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted'
              } ${item.professionalOnly ? 'border border-dashed border-sim-border-strong' : ''}`}
            >
              <Icon className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

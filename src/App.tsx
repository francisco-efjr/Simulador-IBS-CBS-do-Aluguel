import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'

import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import RecuperarSenha from '@/pages/RecuperarSenha'
import ResetarSenha from '@/pages/ResetarSenha'
import LogsAtividade from '@/pages/LogsAtividade'
import Index from '@/pages/Index'
import Imoveis from '@/pages/Imoveis'
import Inquilinos from '@/pages/Inquilinos'
import Contratos from '@/pages/Contratos'
import Receitas from '@/pages/Receitas'
import Despesas from '@/pages/Despesas'
import IptuTaxas from '@/pages/IptuTaxas'
import Fornecedores from '@/pages/Fornecedores'
import Usuarios from '@/pages/Usuarios'
import DashboardFinanceiro from '@/pages/DashboardFinanceiro'
import DashboardImoveis from '@/pages/DashboardImoveis'
import Alertas from '@/pages/Alertas'
import Relatorios from '@/pages/Relatorios'
import ImportarExtrato from '@/pages/ImportarExtrato'
import ClassificarTransacoes from '@/pages/ClassificarTransacoes'
import HistoricoImportacoes from '@/pages/HistoricoImportacoes'
import Simulador from '@/pages/Simulador'
import NotFound from '@/pages/NotFound'

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />
          <Route path="/redefinir-senha" element={<ResetarSenha />} />
          <Route path="/resetar-senha" element={<ResetarSenha />} />

          {/* Simulador IBS/CBS: rota pública. Com sessão aberta ele se
              desenha dentro do shell do sistema (ver pages/Simulador). */}
          <Route path="/simulador" element={<Simulador />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/inicio" element={<Index />} />

              <Route element={<ProtectedRoute modulo="importar_extrato" />}>
                <Route path="/importar-extrato" element={<ImportarExtrato />} />
                <Route path="/historico-importacoes" element={<HistoricoImportacoes />} />
              </Route>

              <Route element={<ProtectedRoute modulo="classificar_transacoes" />}>
                <Route path="/classificar-transacoes" element={<ClassificarTransacoes />} />
              </Route>

              <Route element={<ProtectedRoute modulo="imoveis" />}>
                <Route path="/imoveis" element={<Imoveis />} />
              </Route>

              <Route element={<ProtectedRoute modulo="inquilinos" />}>
                <Route path="/inquilinos" element={<Inquilinos />} />
              </Route>

              <Route element={<ProtectedRoute modulo="contratos" />}>
                <Route path="/contratos" element={<Contratos />} />
              </Route>

              <Route element={<ProtectedRoute modulo="receitas" />}>
                <Route path="/receitas" element={<Receitas />} />
              </Route>

              <Route element={<ProtectedRoute modulo="despesas" />}>
                <Route path="/despesas" element={<Despesas />} />
              </Route>

              <Route element={<ProtectedRoute modulo="iptu_taxas" />}>
                <Route path="/iptu-taxas" element={<IptuTaxas />} />
              </Route>

              <Route element={<ProtectedRoute modulo="fornecedores" />}>
                <Route path="/fornecedores" element={<Fornecedores />} />
              </Route>

              <Route element={<ProtectedRoute modulo="dashboards" />}>
                <Route path="/dashboard-financeiro" element={<DashboardFinanceiro />} />
                <Route path="/dashboard-imoveis" element={<DashboardImoveis />} />
              </Route>

              <Route element={<ProtectedRoute modulo="alertas" />}>
                <Route path="/alertas" element={<Alertas />} />
              </Route>

              <Route element={<ProtectedRoute modulo="relatorios" />}>
                <Route path="/relatorios" element={<Relatorios />} />
              </Route>

              {/* Rotas administrativas protegidas com verificação de papel Admin */}
              <Route element={<ProtectedRoute requireAdmin />}>
                <Route path="/usuarios" element={<Usuarios />} />
                <Route path="/logs-atividade" element={<LogsAtividade />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App

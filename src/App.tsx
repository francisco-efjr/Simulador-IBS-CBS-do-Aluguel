import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/hooks/use-auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { LayoutCarregavel } from '@/components/LayoutCarregavel'
import { TelaCarregando } from '@/components/TelaCarregando'
import { ErroDoSistema } from '@/components/ErroDoSistema'
import Login from '@/pages/Login'
import Simulador from '@/pages/Simulador'
import StatusDesenvolvimento from '@/pages/StatusDesenvolvimento'
import NotFound from '@/pages/NotFound'

// Cada tela logada vira um pacote próprio: quem só abre o quadro público, o login ou o
// simulador não baixa o resto do sistema (jspdf, xlsx, gráficos...).
const Signup = lazy(() => import('@/pages/Signup'))
const RecuperarSenha = lazy(() => import('@/pages/RecuperarSenha'))
const ResetarSenha = lazy(() => import('@/pages/ResetarSenha'))
const LogsAtividade = lazy(() => import('@/pages/LogsAtividade'))
const Quadro = lazy(() => import('@/pages/Quadro'))
const Index = lazy(() => import('@/pages/Index'))
const Imoveis = lazy(() => import('@/pages/Imoveis'))
const Inquilinos = lazy(() => import('@/pages/Inquilinos'))
const Locadores = lazy(() => import('@/pages/Locadores'))
const Contratos = lazy(() => import('@/pages/Contratos'))
const ContratoFormulario = lazy(() => import('@/pages/ContratoFormulario'))
const Receitas = lazy(() => import('@/pages/Receitas'))
const Despesas = lazy(() => import('@/pages/Despesas'))
const IptuTaxas = lazy(() => import('@/pages/IptuTaxas'))
const Fornecedores = lazy(() => import('@/pages/Fornecedores'))
const Usuarios = lazy(() => import('@/pages/Usuarios'))
const DashboardFinanceiro = lazy(() => import('@/pages/DashboardFinanceiro'))
const DashboardImoveis = lazy(() => import('@/pages/DashboardImoveis'))
const Alertas = lazy(() => import('@/pages/Alertas'))
const Relatorios = lazy(() => import('@/pages/Relatorios'))
const ImportarExtrato = lazy(() => import('@/pages/ImportarExtrato'))
const ClassificarTransacoes = lazy(() => import('@/pages/ClassificarTransacoes'))
const HistoricoImportacoes = lazy(() => import('@/pages/HistoricoImportacoes'))

/** Pega a falha de qualquer tela; trocar de tela limpa o erro. */
const RotasComPaginaDeFalha = ({ children }: { children: React.ReactNode }) => {
  const { pathname } = useLocation()
  return <ErroDoSistema chave={pathname}>{children}</ErroDoSistema>
}

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RotasComPaginaDeFalha>
          <Suspense fallback={<TelaCarregando />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/recuperar-senha" element={<RecuperarSenha />} />
              <Route path="/redefinir-senha" element={<ResetarSenha />} />
              <Route path="/resetar-senha" element={<ResetarSenha />} />

              {/* Simulador IBS/CBS: rota pública. Com sessão aberta ele se
                desenha dentro do shell do sistema (ver pages/Simulador). */}
              <Route path="/simulador" element={<Simulador />} />

              {/* Fase de desenvolvimento: a raiz mostra o quadro público de
                andamento e o painel do sistema passou a viver em /inicio.
                Ao publicar, apagar a rota abaixo e devolver "/" ao <Index />.
                Ver o cabeçalho de pages/StatusDesenvolvimento. */}
              <Route path="/" element={<StatusDesenvolvimento />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<LayoutCarregavel />}>
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

                  <Route element={<ProtectedRoute modulo="locadores" />}>
                    <Route path="/locadores" element={<Locadores />} />
                  </Route>

                  <Route element={<ProtectedRoute modulo="contratos" />}>
                    <Route path="/contratos" element={<Contratos />} />
                    <Route path="/contratos/novo" element={<ContratoFormulario />} />
                    <Route path="/contratos/:id/editar" element={<ContratoFormulario />} />
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

                  <Route path="/quadro" element={<Quadro />} />

                  {/* Rotas administrativas protegidas com verificação de papel Admin */}
                  <Route element={<ProtectedRoute requireAdmin />}>
                    <Route path="/usuarios" element={<Usuarios />} />
                    <Route path="/logs-atividade" element={<LogsAtividade />} />
                  </Route>
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </RotasComPaginaDeFalha>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App

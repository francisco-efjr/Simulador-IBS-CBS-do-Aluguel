import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/use-auth'
import { App as SimuladorApp } from '@/simulador/ui/App'

/**
 * Simulador IBS/CBS da locação — rota pública.
 *
 * É o mesmo endereço nos dois casos: quem chega deslogado vê o simulador
 * autônomo (cabeçalho e rodapé próprios), e quem já tem sessão aberta vê o
 * mesmo simulador dentro do shell do sistema, com a sidebar do lado. Assim o
 * link antigo continua valendo e o item do menu não joga ninguém para fora.
 */
export default function Simulador() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-600">Carregando simulador...</p>
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <Layout>
        <SimuladorApp embedded />
      </Layout>
    )
  }

  return <SimuladorApp />
}

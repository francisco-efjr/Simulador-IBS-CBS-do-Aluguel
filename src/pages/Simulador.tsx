import { LayoutCarregavel } from '@/components/LayoutCarregavel'
import { useAuth } from '@/hooks/use-auth'
import { TelaCarregando } from '@/components/TelaCarregando'
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
    return <TelaCarregando mensagem="Carregando simulador…" />
  }

  if (isAuthenticated) {
    return (
      <LayoutCarregavel>
        <SimuladorApp embedded />
      </LayoutCarregavel>
    )
  }

  return <SimuladorApp />
}

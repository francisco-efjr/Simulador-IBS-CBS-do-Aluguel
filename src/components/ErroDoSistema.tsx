import { Component, type ErrorInfo, type ReactNode } from 'react'
import { CloudOff } from 'lucide-react'
import { PaginaDeErro } from '@/components/organico/PaginaDeErro'
import { Button } from '@/components/ui/button'

/** Pedaço do código que não baixou (a internet caiu ou o sistema foi atualizado). */
const FALHA_DE_PACOTE =
  /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i

interface Props {
  children: ReactNode
  /** Muda quando a pessoa troca de tela: o erro de uma tela não segue para as outras. */
  chave?: string
}

interface Estado {
  erro: Error | null
}

/**
 * Página 500 (seção 08 do handoff): falha do sistema.
 *
 * Pega o que quebra ao desenhar uma tela e mostra "Algo deu errado do nosso
 * lado" em vez de uma página em branco. "Tentar de novo" refaz a tela; quando
 * o que falhou foi baixar um pedaço do código, recarrega a página, que é o que
 * resolve de fato. O erro técnico vai para o console, nunca para a tela.
 */
export class ErroDoSistema extends Component<Props, Estado> {
  state: Estado = { erro: null }

  static getDerivedStateFromError(erro: Error): Estado {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('500 Error: falha ao desenhar a tela', erro, info.componentStack)
  }

  componentDidUpdate(anterior: Props) {
    if (this.state.erro && anterior.chave !== this.props.chave) this.setState({ erro: null })
  }

  tentarDeNovo = () => {
    if (this.state.erro && FALHA_DE_PACOTE.test(String(this.state.erro.message))) {
      window.location.reload()
      return
    }
    this.setState({ erro: null })
  }

  render() {
    if (!this.state.erro) return this.props.children
    return (
      <PaginaDeErro
        icone={CloudOff}
        tom="argila"
        codigo="Erro 500"
        titulo="Algo deu errado do nosso lado"
        descricao="Não foi nada que você fez. Tente de novo em alguns minutos. Se continuar, fale com a administração."
        acoes={
          <>
            <Button size="lg" onClick={this.tentarDeNovo}>
              Tentar de novo
            </Button>
            <Button asChild variant="outline" size="lg">
              {/* Recarrega tudo: se o sistema estiver quebrado, o roteador também pode estar. */}
              <a href="/inicio">Ir para o início</a>
            </Button>
          </>
        }
      />
    )
  }
}

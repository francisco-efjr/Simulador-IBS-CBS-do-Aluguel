/* Página 404 (seção 08 do handoff): rota que não existe. */
import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { PaginaDeErro } from '@/components/organico'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

const NotFound = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    document.title = 'Página não encontrada'
    console.error('404 Error: User attempted to access non-existent route:', location.pathname)
  }, [location.pathname])

  return (
    <PaginaDeErro
      icone={Compass}
      codigo="Erro 404"
      titulo="Não encontramos esta página"
      descricao="O endereço pode ter mudado ou o link estava incompleto."
      acoes={
        <>
          <Button asChild size="lg">
            <Link to={isAuthenticated ? '/inicio' : '/'}>Ir para o início</Link>
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate(-1)}>
            Voltar à página anterior
          </Button>
        </>
      }
    />
  )
}

export default NotFound

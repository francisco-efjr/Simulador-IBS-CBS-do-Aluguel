/* Main entry point for the application - renders the root React component */
import { createRoot } from 'react-dom/client'
// Fontes self-host (só o eixo de peso; o navegador baixa só o subconjunto latino usado).
import '@fontsource-variable/fraunces/wght.css'
import '@fontsource-variable/nunito/wght.css'
import App from './App.tsx'
import { ConfiguracaoAusente } from './components/ConfiguracaoAusente.tsx'
import { CONFIGURACAO_AUSENTE } from './lib/dados/supabase.ts'
import './main.css'
// Tokens do módulo Simulador, escopados em .simulador-theme.
import './simulador/simulador.css'

createRoot(document.getElementById('root')!).render(
  CONFIGURACAO_AUSENTE ? <ConfiguracaoAusente /> : <App />,
)

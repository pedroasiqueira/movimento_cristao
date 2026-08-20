/*
 * Entrada da geração do HTML (scripts/prerender.mjs).
 *
 * O mesmo App do navegador, montado sob StaticRouter em vez de BrowserRouter.
 * Sem StrictMode de propósito: ele é auxílio de desenvolvimento e renderiza
 * duas vezes — mil páginas renderizadas em dobro, à toa.
 */
import '@/lib/compat'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App.jsx'

export function renderizar(caminho) {
  return renderToString(
    <StaticRouter location={caminho}>
      <App />
    </StaticRouter>,
  )
}

// A MESMA função que o navegador usa para aplicar a semente — é o que garante
// que o primeiro render do cliente encontre exatamente o estado que gerou o
// HTML, sem o que a hidratação divergiria.
export { semear } from './lib/mensagens'
export { semearMusicas } from './lib/musicas'

// A pré-renderização precisa gerar UM arquivo por endereço de música; que a
// forma do caminho venha daqui, e não de uma cópia no script, é o que impede
// o HTML estático de sair num endereço que o site não usa.
export { caminhoMusica } from './lib/musicas'

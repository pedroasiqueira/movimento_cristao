import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Cabecalho from '@/components/Cabecalho'
import Home from '@/pages/Home'

export default function App() {
  return (
    <BrowserRouter>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-azul focus:px-4 focus:py-3 focus:text-white"
      >
        Ir direto para o conteúdo
      </a>

      <Cabecalho />

      <main id="conteudo" className="mx-auto max-w-3xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/acervo" element={<AConstruir titulo="Acervo" />} />
          <Route path="/musicas" element={<AConstruir titulo="Músicas" />} />
          <Route path="/encontros" element={<AConstruir titulo="Encontros" />} />
          <Route path="/sobre" element={<AConstruir titulo="Sobre" />} />
          <Route path="*" element={<AConstruir titulo="Página não encontrada" />} />
        </Routes>
      </main>

      <footer className="mt-12 border-t border-borda py-8">
        <p className="mx-auto max-w-3xl px-4 text-sm text-tinta-suave">
          Arca da Sagrada Aliança – Movimento Cristão · Natal/RN, Brasil
        </p>
      </footer>
    </BrowserRouter>
  )
}

/* Marcador de desenvolvimento. Não é conteúdo publicável: nenhuma destas telas
   pode ir ao ar assim — ver PRD §4.3 e §4.4. */
function AConstruir({ titulo }) {
  return (
    <div className="rounded-lg border border-dashed border-borda px-6 py-12 text-center">
      <h1 className="font-leitura text-2xl font-bold text-tinta">{titulo}</h1>
      <p className="mt-2 text-tinta-suave">Ainda não construída.</p>
    </div>
  )
}

import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import Cabecalho from '@/components/Cabecalho'
import MenuLateral from '@/components/MenuLateral'
import Contato from '@/components/Contato'
import Home from '@/pages/Home'
import Acervo from '@/pages/Acervo'
import MensagemPagina from '@/pages/MensagemPagina'
import Musicas from '@/pages/Musicas'
import MusicaPagina from '@/pages/MusicaPagina'
import Encontros from '@/pages/Encontros'
import Sobre from '@/pages/Sobre'

export default function App() {
  return (
    <BrowserRouter>
      <VoltarAoTopo />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-azul focus:px-4 focus:py-3 focus:text-white"
      >
        Ir direto para o conteúdo
      </a>

      <Cabecalho />

      {/* Desktop: menu lateral fixo + coluna de conteúdo. Celular: só a coluna,
          com o menu no Cabecalho acima. A folha branca carrega o texto; o céu
          vive em volta. */}
      <div className="mx-auto w-full max-w-[88rem] lg:flex lg:items-start lg:gap-8 lg:px-8 lg:pt-8">
        <MenuLateral />

        <div className="min-w-0 flex-1">
          <div className="px-3 sm:px-6 lg:px-0">
            <main
              id="conteudo"
              className="mx-auto my-6 w-full max-w-5xl rounded-2xl border border-borda bg-papel px-4 py-8 shadow-sm sm:px-8 lg:mt-0"
            >
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/acervo" element={<Acervo />} />
                <Route path="/mensagem/:data" element={<MensagemPagina />} />
                <Route path="/musicas" element={<Musicas />} />
                <Route path="/musica/:id" element={<MusicaPagina />} />
                <Route path="/encontros" element={<Encontros />} />
                <Route path="/sobre" element={<Sobre />} />
                <Route path="*" element={<NaoEncontrada />} />
              </Routes>
            </main>
          </div>

          {/* Rodapé direto sobre o céu, alinhado à coluna de conteúdo. */}
          <footer className="pt-2 pb-10">
            <div className="mx-auto max-w-5xl space-y-5 px-4 sm:px-6">
              {/* Caminho de contato visível também no rodapé — FR-19 */}
              <Contato />
              <p className="text-sm text-tinta-suave">
                Arca da Sagrada Aliança – Movimento Cristão · Natal/RN, Brasil
              </p>
            </div>
          </footer>
        </div>
      </div>
    </BrowserRouter>
  )
}

/* Em SPA a rolagem fica onde estava ao trocar de página; para leitura longa
   isso desorienta. Toda navegação começa do topo. */
function VoltarAoTopo() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function NaoEncontrada() {
  return (
    <div className="rounded-lg border border-borda px-6 py-12 text-center">
      <h1 className="font-leitura text-2xl font-bold text-tinta">Página não encontrada</h1>
      <p className="mt-2 text-tinta-suave">O endereço aberto não existe neste site.</p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-azul px-5 font-medium text-white hover:bg-azul-escuro"
      >
        Ir para a mensagem do dia
      </Link>
    </div>
  )
}

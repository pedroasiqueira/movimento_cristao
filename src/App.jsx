import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
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
import AdminEntrada from '@/pages/AdminEntrada'
import AdminMusicaNova from '@/pages/AdminMusicaNova'

export default function App() {
  // A faixa do topo está fora de vista? Sinal único, medido no Cabecalho e
  // consumido em dois lugares: a barra compacta do celular e o título que
  // "desce" para o menu lateral no desktop.
  const [cabecalhoFora, setCabecalhoFora] = useState(false)

  // Identificação de administrador — o token JWT vem do POST /auth/login da
  // API (7 dias). A presença do token controla o que a interface MOSTRA;
  // a proteção real é da API, que rejeita escrita sem token válido. Se o
  // token expirar, a próxima gravação devolve 401 e a tela pede novo login.
  const [tokenAdmin, setTokenAdmin] = useState(() => {
    try {
      localStorage.removeItem('mc:admin') // chave da fase sem backend, aposentada
      return localStorage.getItem('mc:token')
    } catch {
      return null
    }
  })
  const admin = Boolean(tokenAdmin)

  function entrarAdmin(token) {
    try {
      localStorage.setItem('mc:token', token)
    } catch {
      // Sem armazenamento (navegador embutido restrito): vale só nesta visita.
    }
    setTokenAdmin(token)
  }

  function sairAdmin() {
    try {
      localStorage.removeItem('mc:token')
    } catch {
      // Sem armazenamento: nada a limpar.
    }
    setTokenAdmin(null)
  }

  return (
    <BrowserRouter>
      <VoltarAoTopo />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-azul focus:px-4 focus:py-3 focus:text-white"
      >
        Ir direto para o conteúdo
      </a>

      <Cabecalho
        foraDeVista={cabecalhoFora}
        aoMudar={setCabecalhoFora}
        admin={admin}
        aoSairAdmin={sairAdmin}
      />

      {/* Desktop: menu lateral fixo + coluna de conteúdo. Celular: só a coluna,
          com o menu no Cabecalho acima. A folha branca carrega o texto; o céu
          vive em volta. Sem items-start: o aside precisa esticar até a altura
          da coluna de conteúdo, senão o sticky do menu não tem onde viajar. */}
      <div className="mx-auto w-full max-w-[88rem] lg:flex lg:gap-8 lg:px-8 lg:pt-8">
        <MenuLateral mostrarTitulo={cabecalhoFora} admin={admin} aoSairAdmin={sairAdmin} />

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
                <Route
                  path="/admin"
                  element={<AdminEntrada admin={admin} aoEntrar={entrarAdmin} aoSair={sairAdmin} />}
                />
                {/* Guarda visual; a proteção real é a API exigir o token. */}
                <Route
                  path="/admin/musica/nova"
                  element={
                    admin ? (
                      <AdminMusicaNova token={tokenAdmin} />
                    ) : (
                      <Navigate to="/admin" replace />
                    )
                  }
                />
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

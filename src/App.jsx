import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom'
import Cabecalho from '@/components/Cabecalho'
import MenuLateral from '@/components/MenuLateral'
import BarraInferior from '@/components/BarraInferior'
import ControleFonteFlutuante from '@/components/ControleFonteFlutuante'
import Contato from '@/components/Contato'
import Home from '@/pages/Home'
import Acervo from '@/pages/Acervo'
import MensagemPagina from '@/pages/MensagemPagina'
import Musicas from '@/pages/Musicas'
import MusicaPagina from '@/pages/MusicaPagina'
import Encontros from '@/pages/Encontros'
import Sobre from '@/pages/Sobre'
import { ITENS_ADMIN } from '@/lib/navegacao'

// A Área Admin é de UMA pessoa; os visitantes não baixam essas telas
// (~1.300 linhas) — os chunks só descem ao abrir /admin.
const AdminEntrada = lazy(() => import('@/pages/AdminEntrada'))
const AdminMensagemNova = lazy(() => import('@/pages/AdminMensagemNova'))
const AdminMusicaNova = lazy(() => import('@/pages/AdminMusicaNova'))

export default function App() {
  // A faixa do topo está fora de vista? Sinal medido no Cabecalho, com um
  // consumidor em cada largura: no desktop, o título que "desce" para o menu
  // lateral; no celular, a pílula de tamanho de letra que acende no pé da
  // janela quando o controle do topo sai de vista.
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

      <Cabecalho aoMudar={setCabecalhoFora} admin={admin} aoSairAdmin={sairAdmin} />

      {/* A navegação do celular fica aqui, e não dentro do Cabecalho, porque
          deixou de ser cabeçalho: é barra fixa no pé da janela. Nesta posição
          a ordem de leitura continua a de sempre — identidade, ajuste,
          navegação, conteúdo — e o menu vem antes do <main> nas duas larguras,
          como já acontece com o MenuLateral. Importa para quem usa teclado:
          a 200% de zoom o viewport cai abaixo de lg, o MenuLateral some e
          esta barra vira a ÚNICA navegação; se viesse por último, seria
          preciso atravessar um Acervo inteiro para alcançá-la. */}
      <BarraInferior />

      <Estrutura
        cabecalhoFora={cabecalhoFora}
        admin={admin}
        tokenAdmin={tokenAdmin}
        entrarAdmin={entrarAdmin}
        sairAdmin={sairAdmin}
      />

      {/* Por último de propósito, ao contrário da barra de navegação acima: a
          pílula é atalho para um controle que já existe na faixa do topo, não
          um caminho novo. Deixá-la no fim preserva a ordem de leitura
          (identidade, ajuste, navegação, conteúdo) e não põe mais uma parada
          de teclado antes do conteúdo. */}
      <ControleFonteFlutuante visivel={cabecalhoFora} />
    </BrowserRouter>
  )
}

/* A moldura precisa saber a rota (useLocation só existe sob o BrowserRouter):
   nas telas de cadastro do admin o menu lateral começa recolhido e a folha
   branca ganha a largura — escrever e conferir a prévia pedem espaço. O
   administrador pode reabrir; a escolha dura até trocar de página. */
function Estrutura({ cabecalhoFora, admin, tokenAdmin, entrarAdmin, sairAdmin }) {
  const { pathname } = useLocation()
  const telaDeCadastro =
    ITENS_ADMIN.some((item) => item.para === pathname) ||
    pathname.startsWith('/admin/mensagem/editar/')
  const [menuReaberto, setMenuReaberto] = useState(false)
  useEffect(() => setMenuReaberto(false), [pathname])
  const menuRecolhido = telaDeCadastro && !menuReaberto

  /* Desktop: menu lateral fixo + coluna de conteúdo. Celular: só a coluna,
     com o menu no Cabecalho acima. A folha branca carrega o texto; o céu
     vive em volta. Sem items-start: o aside precisa esticar até a altura
     da coluna de conteúdo, senão o sticky do menu não tem onde viajar. */
  return (
    <div className="mx-auto w-full max-w-[88rem] lg:flex lg:gap-8 lg:px-8 lg:pt-8">
      <MenuLateral
        mostrarTitulo={cabecalhoFora}
        admin={admin}
        aoSairAdmin={sairAdmin}
        recolhido={menuRecolhido}
        aoAlternar={telaDeCadastro ? () => setMenuReaberto((estava) => !estava) : undefined}
      />

      <div className="min-w-0 flex-1">
        {/* Os recuos laterais são os únicos do site em px, e não em rem: eles
            travam no que medem hoje no primeiro degrau. Em rem cresciam junto
            com a letra e roubavam largura justamente quando o texto mais
            precisa — medido, comiam 18% de um celular de 320px no degrau 1 e
            26% no degrau 4, e a coluna de leitura encolhia 24px bem no nível
            em que cada caractere conta. Mesmo princípio da escada acima e do
            teto da pílula: a moldura não cresce às custas da leitura. */}
        <div className="px-[12px] sm:px-[24px] lg:px-0">
          <main
            id="conteudo"
            className={
              'mx-auto my-6 w-full rounded-2xl border border-borda bg-papel px-[16px] py-8 shadow-sm transition-[max-width] duration-300 ease-out sm:px-[32px] lg:mt-0 ' +
              (menuRecolhido ? 'max-w-[88rem]' : 'max-w-5xl')
            }
          >
            <Suspense fallback={<p className="text-tinta-suave">Carregando…</p>}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/acervo" element={<Acervo />} />
              <Route path="/mensagem/:data" element={<MensagemPagina admin={admin} />} />
              <Route path="/musicas" element={<Musicas />} />
              <Route path="/musica/:id" element={<MusicaPagina />} />
              <Route path="/encontros" element={<Encontros />} />
              <Route
                path="/admin"
                element={
                  <AdminEntrada admin={admin} aoEntrar={entrarAdmin} aoSair={sairAdmin} />
                }
              />
              {/* Guarda visual; a proteção real é a API exigir o token. */}
              <Route
                path="/admin/mensagem/nova"
                element={
                  admin ? (
                    <AdminMensagemNova token={tokenAdmin} />
                  ) : (
                    <Navigate to="/admin" replace />
                  )
                }
              />
              {/* Edição de mensagem publicada — o mesmo formulário, preenchido. */}
              <Route
                path="/admin/mensagem/editar/:data"
                element={
                  admin ? (
                    <AdminMensagemNova token={tokenAdmin} />
                  ) : (
                    <Navigate to="/admin" replace />
                  )
                }
              />
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
            </Suspense>
          </main>
        </div>

        {/* Rodapé direto sobre o céu, alinhado à coluna de conteúdo.
            O pb-24 do celular é o que devolve o pé da página: a barra inferior
            é fixa e, com os 40px de antes, taparia o caminho de contato
            (FR-19) — o último elemento tocável do site. Folgado de propósito:
            o min-h-12 da barra é um mínimo, e sobrar céu embaixo é inofensivo
            enquanto faltar respiro é um link inalcançável. */}
        <footer className="pt-2 pb-24 lg:pb-10">
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

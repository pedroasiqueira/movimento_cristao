import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import ControleFonte from './ControleFonte'

/*
  Menu raso: cinco itens, sem submenus — PRD §6.
  Sem menu sanfona: para o público a que o site atende, esconder a navegação
  atrás de um ícone custa mais do que ocupar espaço na tela.

  Rótulo curto é o da barra compacta que aparece ao rolar — pedido do Pedro:
  quem rolou está lendo, então a navegação volta fininha, só as seções.
*/
const ITENS = [
  { para: '/', rotulo: 'Mensagem do dia', curto: 'Início', fim: true },
  { para: '/acervo', rotulo: 'Acervo', curto: 'Acervo' },
  { para: '/musicas', rotulo: 'Músicas', curto: 'Músicas' },
  { para: '/encontros', rotulo: 'Encontros', curto: 'Encontros' },
  { para: '/sobre', rotulo: 'Sobre', curto: 'Sobre' },
]

export default function Cabecalho() {
  const refCabecalho = useRef(null)
  const [compacto, setCompacto] = useState(false)

  // A barra compacta entra quando o cabeçalho completo sai da tela — e some
  // quando ele volta. Observação passiva: nada roda a cada pixel de rolagem.
  useEffect(() => {
    const el = refCabecalho.current
    if (!el || !('IntersectionObserver' in window)) return
    const observador = new IntersectionObserver(
      ([entrada]) => setCompacto(!entrada.isIntersecting),
      { threshold: 0 },
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  return (
    <>
      {/* O cabeçalho é uma nuvem: branco difuso sobre o azul, sem contorno,
          rareando até encontrar o céu do fundo sem emenda. Ver .cabecalho-nuvem. */}
      <header ref={refCabecalho} className="cabecalho-nuvem">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Simbolo />
              <div className="leading-tight">
                <p className="font-semibold text-azul">Arca da Sagrada Aliança</p>
                <p className="text-sm text-tinta-suave">Movimento Cristão · Natal/RN</p>
              </div>
            </div>
            <ControleFonte />
          </div>

          <nav aria-label="Navegação principal" className="mt-4">
            <ul className="flex flex-wrap gap-2">
              {ITENS.map(({ para, rotulo, fim }) => (
                <li key={para}>
                  <NavLink
                    to={para}
                    end={fim}
                    className={({ isActive }) =>
                      'flex min-h-12 items-center rounded-lg px-4 transition-colors ' +
                      (isActive
                        ? 'bg-azul text-white'
                        : 'text-tinta hover:bg-azul-claro hover:text-azul-escuro')
                    }
                  >
                    {rotulo}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>

      {/* Barra compacta: fixa no topo enquanto a página está rolada.
          Altura no limite: os itens são exatamente os 48px mínimos de alvo de
          toque do §7 — mais estreito que isso quebraria a acessibilidade. */}
      {compacto && (
        <nav
          aria-label="Navegação rápida"
          className="fixed inset-x-0 top-0 z-40 border-b border-borda bg-papel shadow-sm"
        >
          <ul className="mx-auto flex max-w-3xl justify-center gap-2 px-2 sm:justify-start sm:px-4">
            {ITENS.map(({ para, curto, fim }) => (
              <li key={para}>
                <NavLink
                  to={para}
                  end={fim}
                  className={({ isActive }) =>
                    'flex h-12 items-center rounded-lg px-2 text-[0.9rem] sm:px-3.5 sm:text-[0.95rem] ' +
                    (isActive
                      ? 'bg-azul text-white'
                      : 'text-tinta hover:bg-azul-claro hover:text-azul-escuro')
                  }
                >
                  {curto}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </>
  )
}

/* Marcador provisório no lugar do símbolo do Movimento.
   O arquivo original, de preferência vetorial, ainda não foi obtido — PRD §12,
   questão 6. O símbolo não deve ser redesenhado: isto é só um lugar reservado. */
function Simbolo() {
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-azul-claro"
      aria-hidden
    >
      <svg viewBox="0 0 24 24" className="h-7 w-7 text-azul" fill="currentColor">
        <path d="M12 1.5l2.1 6.4 6.4-2.1-3.9 5.6 5.6 3.9-6.8.4.4 6.8-3.8-5.6-3.8 5.6.4-6.8-6.8-.4 5.6-3.9L3.5 5.8l6.4 2.1z" />
      </svg>
    </div>
  )
}

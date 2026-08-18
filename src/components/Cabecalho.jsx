import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import ControleFonte from './ControleFonte'
import ModoCompacto from './ModoCompacto'
import { ITENS, ITENS_ADMIN } from '@/lib/navegacao'

/**
 * O estado "faixa fora de vista" mora no App: além da barra compacta daqui
 * (celular), o MenuLateral o consome para receber o título no desktop.
 * Observação passiva via IntersectionObserver: nada roda a cada pixel.
 */
export default function Cabecalho({ foraDeVista, aoMudar, admin = false, aoSairAdmin }) {
  const refCabecalho = useRef(null)

  useEffect(() => {
    const el = refCabecalho.current
    if (!el || !('IntersectionObserver' in window)) return
    const observador = new IntersectionObserver(
      ([entrada]) => aoMudar(!entrada.isIntersecting),
      { threshold: 0 },
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [aoMudar])

  return (
    <>
      {/* O cabeçalho é uma nuvem: branco difuso sobre o azul, sem contorno,
          rareando até encontrar o céu do fundo sem emenda. Ver .cabecalho-nuvem.
          A faixa existe em todas as larguras — pedido do Pedro: o título mora
          no cabeçalho da página, não só no menu. No desktop ela carrega apenas
          a identidade; navegação e controle de fonte vivem no MenuLateral. */}
      <header ref={refCabecalho} className="cabecalho-nuvem">
        <div className="mx-auto max-w-5xl px-4 py-4 lg:max-w-[88rem] lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Simbolo />
              <div className="leading-tight">
                <p className="font-semibold text-azul">Arca da Sagrada Aliança</p>
                <p className="text-sm text-tinta-suave">Movimento Cristão · Natal/RN</p>
              </div>
            </div>
            <div className="lg:hidden">
              <ControleFonte />
            </div>
          </div>

          <nav aria-label="Navegação principal" className="mt-4 lg:hidden">
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

          {/* Fim do menu do celular — mesma posição relativa do desktop. */}
          <div className="lg:hidden">
            <ModoCompacto />
          </div>

          {/* Área Admin no celular — mesmo sinal do cartão do desktop.
              A barra compacta de rolagem não a exibe: continua só as seções. */}
          {admin && (
            <div className="mt-3 lg:hidden">
              <p className="text-xs font-semibold tracking-wide text-azul-escuro uppercase">
                Área Admin
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {ITENS_ADMIN.map(({ para, rotulo }) => (
                  <li key={para}>
                    <NavLink
                      to={para}
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
                <li>
                  <button
                    type="button"
                    onClick={aoSairAdmin}
                    className="flex min-h-12 items-center gap-1.5 rounded-lg px-4 text-tinta-suave transition-colors hover:bg-azul-claro hover:text-azul-escuro"
                  >
                    <LogOut size={18} aria-hidden />
                    Sair
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Barra compacta: fixa no topo enquanto a página está rolada.
          Altura no limite: no modo padrão os itens têm exatamente os 48px
          mínimos de alvo de toque do §7. A única exceção é o modo compacto
          (42px), escolha explícita do usuário — ver a declaração canônica
          do piso no index.css. */}
      {foraDeVista && (
        <nav
          aria-label="Navegação rápida"
          className="fixed inset-x-0 top-0 z-40 border-b border-borda bg-papel shadow-sm lg:hidden"
        >
          <ul className="mx-auto flex max-w-5xl justify-center gap-2 px-2 sm:justify-start sm:px-4">
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
export function Simbolo() {
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

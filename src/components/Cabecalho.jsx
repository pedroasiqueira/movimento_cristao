import { useEffect, useId, useRef } from 'react'
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

/* O símbolo do Movimento: a estrela de nove pontas, mesmo desenho do favicon
   (public/favicon.svg) — proporções e cores medidas da imagem de referência
   dada pelo Pedro em 19/08/2026. Substitui o marcador provisório; PRD §12,
   questão 6, resolvida.
   O id do gradiente vem do useId porque o símbolo aparece duas vezes na mesma
   página no desktop (cabeçalho e MenuLateral), e dois ids iguais fariam o
   segundo apontar para o gradiente do primeiro. */
export function Simbolo() {
  const idGradiente = `estrela-${useId()}`

  return (
    <svg
      viewBox="12 12 488 488"
      className="h-11 w-11 shrink-0"
      aria-hidden
    >
      <defs>
        <radialGradient id={idGradiente} gradientUnits="userSpaceOnUse" cx="256" cy="256" r="240">
          <stop offset="0%" stopColor="#02DFFE" />
          <stop offset="19%" stopColor="#01D5FA" />
          <stop offset="37%" stopColor="#01B5FB" />
          <stop offset="62%" stopColor="#028BF4" />
          <stop offset="100%" stopColor="#1268D8" />
        </radialGradient>
      </defs>
      <path d="M 256.00 16.00 Q 271.19 102.66 288.67 166.24 Q 342.93 128.77 410.27 72.15 Q 366.20 148.30 338.72 208.24 Q 404.37 214.41 492.35 214.32 Q 409.65 244.33 350.07 272.59 Q 396.39 319.51 463.85 376.00 Q 381.20 345.83 317.40 329.17 Q 322.72 394.89 338.08 481.53 Q 294.17 405.29 256.00 351.52 Q 217.83 405.29 173.92 481.53 Q 189.28 394.89 194.60 329.17 Q 130.80 345.83 48.15 376.00 Q 115.61 319.51 161.93 272.59 Q 102.35 244.33 19.65 214.32 Q 107.63 214.41 173.28 208.24 Q 145.80 148.30 101.73 72.15 Q 169.07 128.77 223.33 166.24 Q 240.81 102.66 256.00 16.00 Z" fill={`url(#${idGradiente})`} />
    </svg>
  )
}

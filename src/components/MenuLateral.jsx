import { NavLink } from 'react-router-dom'
import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import ControleFonte from './ControleFonte'
import ModoCompacto from './ModoCompacto'
import { Simbolo } from './Cabecalho'
import { ITENS, ITENS_ADMIN } from '@/lib/navegacao'

/**
 * Menu lateral do desktop — pedido do Pedro: na tela grande o menu vai para
 * o lado e o conteúdo ganha a largura. Fica fixo enquanto a página rola
 * (sticky), então trocar de seção no meio da leitura nunca exige voltar ao
 * topo. O título do Movimento mora na faixa do Cabecalho; quando ela sai de
 * vista ao rolar, o título "desce" para o topo deste cartão com transição —
 * e volta para a faixa quando a página retorna ao topo. No celular este
 * componente não existe: lá o menu segue em cima, com a barra compacta.
 *
 * Nas telas de cadastro da Área Admin o menu pode se recolher a um trilho
 * estreito (pedido do Pedro, 17/08/2026): escrever e conferir a prévia
 * pedem a largura. `aoAlternar` presente = a tela oferece o recolhimento;
 * `recolhido` diz o estado. overflow-x-clip (e não hidden, que mataria o
 * sticky) corta o cartão largo enquanto o trilho encolhe.
 */
export default function MenuLateral({
  mostrarTitulo = false,
  admin = false,
  aoSairAdmin,
  recolhido = false,
  aoAlternar,
}) {
  return (
    <aside
      className={
        'hidden shrink-0 overflow-x-clip transition-[width] duration-300 ease-out lg:block ' +
        (recolhido ? 'w-12' : 'w-72')
      }
    >
      {/* Os cartões rolam juntos: o sticky é o contêiner, não o cartão.
          (sticky já é referência para o botão absoluto do trilho — não
          juntar relative aqui: as duas classes disputam o position.) */}
      <div className="sticky top-6">
        {/* Trilho: só o botão de reabrir, no lugar onde o menu estava. */}
        {aoAlternar && (
          <button
            type="button"
            onClick={aoAlternar}
            aria-label="Mostrar menu"
            title="Mostrar menu"
            className={
              'absolute top-0 left-0 flex size-12 items-center justify-center rounded-xl border border-borda bg-papel text-tinta shadow-sm transition-opacity duration-300 hover:bg-azul-claro hover:text-azul-escuro ' +
              (recolhido ? 'opacity-100' : 'pointer-events-none opacity-0')
            }
          >
            <PanelLeftOpen size={20} aria-hidden />
          </button>
        )}

        {/* Recolhido, o menu sai do fluxo (absolute): se ficasse, sua altura
            invisível seguiria limitando o sticky e o trilho subiria junto
            com o fim da página. */}
        <div
          inert={recolhido}
          className={
            'w-72 transition-opacity duration-300 ' +
            (recolhido ? 'pointer-events-none absolute top-0 left-0 opacity-0' : 'opacity-100')
          }
        >
          {aoAlternar && (
            <button
              type="button"
              onClick={aoAlternar}
              className="mb-3 flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-tinta-suave transition-colors hover:bg-azul-claro hover:text-azul-escuro"
            >
              <PanelLeftClose size={18} aria-hidden />
              Recolher menu
            </button>
          )}
          <div className="rounded-2xl border border-borda bg-papel p-5 shadow-sm">
            {/* Sempre montado: grid-rows anima a altura sem chute de max-height;
              o translate faz o bloco descer, contando que ele veio da faixa. */}
            <div
              aria-hidden={!mostrarTitulo}
              className={
                'grid transition-[grid-template-rows] duration-300 ease-out ' +
                (mostrarTitulo ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')
              }
            >
              <div className="overflow-hidden">
                <div
                  className={
                    'flex items-center gap-3 transition-all duration-300 ease-out ' +
                    (mostrarTitulo ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0')
                  }
                >
                  <Simbolo />
                  <div className="leading-tight">
                    <p className="font-semibold text-azul">Arca da Sagrada Aliança</p>
                    <p className="text-sm text-tinta-suave">Movimento Cristão · Natal/RN</p>
                  </div>
                </div>
                <div className="mt-4 mb-4 border-t border-borda" />
              </div>
            </div>

            <nav aria-label="Navegação principal">
              <ul className="space-y-1.5">
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

            <div className="mt-5 border-t border-borda pt-4">
              <ControleFonte />
              <ModoCompacto />
            </div>
          </div>

          {/* Área Admin — pedido do Pedro: cartão abaixo do menu, só com o
            administrador identificado. Fase 1: identificação local, sem
            autenticação real (ver o estado admin no App). */}
          {admin && (
            <div className="mt-4 rounded-2xl border border-borda bg-papel p-5 shadow-sm">
              <p className="text-sm font-semibold tracking-wide text-azul-escuro uppercase">
                Área Admin
              </p>
              <nav aria-label="Área Admin">
                <ul className="mt-3 space-y-1.5">
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
                </ul>
              </nav>
              <button
                type="button"
                onClick={aoSairAdmin}
                className="mt-2 flex min-h-12 w-full items-center gap-2 rounded-lg px-4 text-tinta-suave transition-colors hover:bg-azul-claro hover:text-azul-escuro"
              >
                <LogOut size={20} aria-hidden />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}

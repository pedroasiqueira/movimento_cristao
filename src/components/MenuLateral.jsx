import { NavLink } from 'react-router-dom'
import ControleFonte from './ControleFonte'
import { Simbolo } from './Cabecalho'
import { ITENS } from '@/lib/navegacao'

/**
 * Menu lateral do desktop — pedido do Pedro: na tela grande o menu vai para
 * o lado e o conteúdo ganha a largura. Fica fixo enquanto a página rola
 * (sticky), então trocar de seção no meio da leitura nunca exige voltar ao
 * topo. O título do Movimento mora na faixa do Cabecalho; quando ela sai de
 * vista ao rolar, o título "desce" para o topo deste cartão com transição —
 * e volta para a faixa quando a página retorna ao topo. No celular este
 * componente não existe: lá o menu segue em cima, com a barra compacta.
 */
export default function MenuLateral({ mostrarTitulo = false }) {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-6 rounded-2xl border border-borda bg-papel p-5 shadow-sm">
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
        </div>
      </div>
    </aside>
  )
}

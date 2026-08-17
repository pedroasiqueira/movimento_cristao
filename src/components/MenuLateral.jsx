import { NavLink } from 'react-router-dom'
import ControleFonte from './ControleFonte'
import { Simbolo } from './Cabecalho'
import { ITENS } from '@/lib/navegacao'

/**
 * Menu lateral do desktop — pedido do Pedro: na tela grande o menu vai para
 * o lado e o conteúdo ganha a largura. Fica fixo enquanto a página rola
 * (sticky), então trocar de seção no meio da leitura nunca exige voltar ao
 * topo. No celular este componente não existe: lá o menu segue em cima
 * (Cabecalho), com a barra compacta ao rolar.
 */
export default function MenuLateral() {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="sticky top-6 rounded-2xl border border-borda bg-papel p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Simbolo />
          <div className="leading-tight">
            <p className="font-semibold text-azul">Arca da Sagrada Aliança</p>
            <p className="text-sm text-tinta-suave">Movimento Cristão · Natal/RN</p>
          </div>
        </div>

        <nav aria-label="Navegação principal" className="mt-5">
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

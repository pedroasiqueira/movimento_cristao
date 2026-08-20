import { NavLink } from 'react-router-dom'
import { ITENS } from '@/lib/navegacao'

/**
 * Barra inferior de navegação — celular e tablet (abaixo de lg).
 *
 * Substitui os DOIS menus que o celular tinha. A fileira de pílulas dentro
 * do cabeçalho quebrava em duas linhas na escala padrão e em três na escala
 * 3 — mais de 250px de menu antes de qualquer conteúdo, numa tela em que a
 * Mensagem do dia deveria ser a primeira coisa. E a barra compacta que
 * aparecia ao rolar simplesmente não cabia: somados rótulos, respiros e
 * pílulas ela media ~365px, então em 320 e em 360px "Início" e "Sobre"
 * ficavam para fora da janela, inalcançáveis. Um menu que só serve em
 * aparelho largo não é menu.
 *
 * O desenho é o de barra de abas, o que este público já usa todo dia no
 * WhatsApp: cinco colunas iguais, desenho em cima e palavra embaixo, sempre
 * visível, um toque para qualquer seção. Sem sanduíche — §6 do PRD proíbe
 * acrescentar um nível de navegação aqui: "cada nível a mais é custo real".
 *
 * GEOMETRIA. grid-cols-5 faz cada coluna valer exatamente 20vw: não entra
 * rem nenhum na conta horizontal, então a barra não se desmonta na escala 3
 * nem no modo compacto — é a única peça do site que precisa sobreviver a
 * uma letra 44% maior dentro de uma janela que não cresceu, e uma grade não
 * pode quebrar linha. O afastamento de 8px entre alvos (§7) vem do m-1 do
 * item, e não de um gap do contêiner: assim a coluna continua 20vw e a
 * margem ainda insere a pílula do item ativo dentro da faixa. min-h-12 é o
 * piso de 48px de §7; no modo compacto ele vira 42px e o afastamento 7px,
 * a isenção já declarada no index.css. Em 320px o alvo mede 56x48 na escala
 * padrão e 52x69 na escala 3 — nunca abaixo do piso.
 *
 * O rótulo tem regra própria (.barra-inferior .rotulo, no index.css): cresce
 * com a escala de leitura até o limite da coluna e para ali.
 *
 * O estado ativo não depende de cor: bloco preenchido (perceptível em escala
 * de cinza), peso da letra e aria-current, que o NavLink põe sozinho.
 *
 * Sem env(safe-area-inset-bottom): o index.html não declara viewport-fit=cover,
 * então o viewport de layout do iOS já exclui a faixa do indicador de home e
 * o env() resolveria 0 — seria código morto. Acrescentar cover mudaria o
 * viewport do site INTEIRO e obrigaria a auditar todo padding horizontal
 * contra o entalhe em paisagem: risco grande por ganho cosmético.
 */
export default function BarraInferior() {
  return (
    <nav
      aria-label="Navegação principal"
      className="barra-inferior fixed inset-x-0 bottom-0 z-40 border-t border-borda bg-papel lg:hidden"
    >
      <ul className="grid grid-cols-5">
        {ITENS.map(({ para, rotulo, icone: Icone, fim }) => (
          <li key={para}>
            <NavLink
              to={para}
              end={fim}
              className={({ isActive }) =>
                'm-1 flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-lg transition-colors ' +
                (isActive
                  ? 'bg-azul font-semibold text-white'
                  : 'text-tinta hover:bg-azul-claro hover:text-azul-escuro')
              }
            >
              {/* size-6 como classe, e não size={24}: o CSS vence os atributos
                  width/height do SVG, então o desenho acompanha o modo
                  compacto. Mesmo idioma do ControleFonte. */}
              <Icone className="size-6 shrink-0" aria-hidden />
              <span className="rotulo w-full truncate text-center">{rotulo}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

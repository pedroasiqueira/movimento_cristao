import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { ajustarEscala, assinarEscala, escalaTexto, ESCALA_MAX } from '@/lib/escala'

/**
 * Controle global de tamanho de texto — FR-17. A forma completa, com rótulo e
 * indicador: vive no menu lateral (desktop) e na faixa do topo (celular).
 *
 * O mecanismo e o porquê do rem estão em lib/escala.js, onde mora o estado —
 * compartilhado porque este controle tem irmãos na tela (a pílula flutuante
 * do celular, ControleFonteFlutuante.jsx) e todos precisam contar a mesma
 * história.
 *
 * "A−" e "A+", e não os sinais soltos que estavam aqui antes. O rótulo
 * "Tamanho da letra" ao lado só aparece de sm (640px) para cima, ou seja, em
 * NENHUM celular: lá o controle era um − e um + em volta de um "1 de 4" que
 * não diz do que fala — podia ser zoom, volume, quantidade. A letra dentro do
 * botão carrega o assunto sozinha, é a convenção que este público já viu em
 * jornal e site de banco, e é o mesmo desenho da pílula flutuante.
 */
export default function ControleFonte() {
  const escala = useSyncExternalStore(assinarEscala, escalaTexto)

  // O alvo de 48px vem de §7 e é maior que qualquer size do shadcn, por isso a
  // altura vai explícita em vez de usar size="icon". (No modo compacto cai
  // para 42px — isenção deliberada; ver a declaração canônica no index.css.)
  // O text-base sobe o glifo do text-sm padrão do Button: a letra é o
  // conteúdo do botão agora, não um ícone ao lado de um rótulo.
  const alvo = 'size-12 text-base font-semibold'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="hidden text-sm text-tinta-suave sm:inline">Tamanho da letra</span>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          className={alvo}
          onClick={() => ajustarEscala(-1)}
          disabled={escala === 0}
          aria-label="Diminuir o tamanho da letra"
        >
          <span aria-hidden>A−</span>
        </Button>

        <span
          className="min-w-[3.5rem] text-center text-sm tabular-nums text-tinta-suave"
          role="status"
          aria-live="polite"
        >
          {escala + 1} de {ESCALA_MAX + 1}
        </span>

        <Button
          variant="outline"
          className={alvo}
          onClick={() => ajustarEscala(1)}
          disabled={escala === ESCALA_MAX}
          aria-label="Aumentar o tamanho da letra"
        >
          <span aria-hidden>A+</span>
        </Button>
      </div>
    </div>
  )
}

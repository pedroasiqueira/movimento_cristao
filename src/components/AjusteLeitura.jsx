import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

/*
 * Ajuste local de leitura — FR-18.
 * Aumenta apenas o corpo do conteúdo da página, sem tocar no menu nem no
 * restante do site. Compõe com a preferência global (FR-17) como
 * multiplicador: o corpo usa `em`, então o resultado é global × local,
 * com teto — a consequência exigida pelo FR.
 */
const PASSOS = [1, 1.18, 1.36]

/** aoMudar(passo, multiplicador) — a página aplica o multiplicador em `em`. */
export default function AjusteLeitura({ passo, aoMudar }) {
  return (
    <div className="my-4 flex items-center gap-2 rounded-lg bg-papel-suave px-3 py-2">
      <span className="text-sm text-tinta-suave">Letra deste texto</span>
      <Button
        variant="outline"
        className="size-12 [&_svg]:size-6"
        onClick={() => aoMudar(Math.max(0, passo - 1), PASSOS[Math.max(0, passo - 1)])}
        disabled={passo === 0}
        aria-label="Diminuir a letra apenas deste texto"
      >
        <Minus aria-hidden />
      </Button>
      <span className="min-w-[3rem] text-center text-sm tabular-nums text-tinta-suave" aria-live="polite">
        {passo + 1} de {PASSOS.length}
      </span>
      <Button
        variant="outline"
        className="size-12 [&_svg]:size-6"
        onClick={() => aoMudar(Math.min(PASSOS.length - 1, passo + 1), PASSOS[Math.min(PASSOS.length - 1, passo + 1)])}
        disabled={passo === PASSOS.length - 1}
        aria-label="Aumentar a letra apenas deste texto"
      >
        <Plus aria-hidden />
      </Button>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

const CHAVE = 'mc:escala-texto'
const MAX = 3

/**
 * Controle global de tamanho de texto — FR-17.
 *
 * Mexe no font-size do <html>; como todo o CSS do site usa rem, o site inteiro
 * acompanha. A preferência fica no navegador, sem cadastro.
 *
 * Limite conhecido, registrado no PRD: o caminho de acesso previsto é abrir o
 * link de dentro do WhatsApp, cujo navegador embutido isola o armazenamento e
 * pode descartá-lo entre sessões. Por isso o mecanismo principal de
 * acessibilidade não é este controle, e sim o site respeitar a escala de fonte
 * já configurada no aparelho — o que o uso de rem garante.
 */
export default function ControleFonte() {
  const [escala, setEscala] = useState(0)

  useEffect(() => {
    const salvo = Number(localStorage.getItem(CHAVE) ?? 0)
    if (salvo > 0) setEscala(Math.min(salvo, MAX))
  }, [])

  useEffect(() => {
    document.documentElement.dataset.escala = String(escala)
    localStorage.setItem(CHAVE, String(escala))
  }, [escala])

  // O alvo de 48px vem de §7 e é maior que qualquer size do shadcn, por isso a
  // altura vai explícita em vez de usar size="icon".
  const alvo = 'size-12 [&_svg]:size-6'

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-sm text-tinta-suave sm:inline">Tamanho da letra</span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          className={alvo}
          onClick={() => setEscala((e) => Math.max(0, e - 1))}
          disabled={escala === 0}
          aria-label="Diminuir o tamanho da letra"
        >
          <Minus aria-hidden />
        </Button>

        <span
          className="min-w-[3.5rem] text-center text-sm tabular-nums text-tinta-suave"
          role="status"
          aria-live="polite"
        >
          {escala + 1} de {MAX + 1}
        </span>

        <Button
          variant="outline"
          className={alvo}
          onClick={() => setEscala((e) => Math.min(MAX, e + 1))}
          disabled={escala === MAX}
          aria-label="Aumentar o tamanho da letra"
        >
          <Plus aria-hidden />
        </Button>
      </div>
    </div>
  )
}

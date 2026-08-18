import { useState } from 'react'
import { compactoAtivo, definirCompacto } from '@/lib/compacto'

/*
 * Opção discreta no fim do menu lateral (desktop) — Pedro, 18/08/2026.
 * O site abre para todos no dimensionamento acessível (85% do público é
 * 60+); quem preferir uma interface de medidas convencionais reduz por
 * aqui, e a escolha fica guardada no navegador. Discreto de propósito:
 * é uma exceção, não um convite.
 */
export default function ModoCompacto() {
  const [ativo, setAtivo] = useState(compactoAtivo)

  function alternar() {
    definirCompacto(!ativo)
    setAtivo(!ativo)
  }

  return (
    <button
      type="button"
      onClick={alternar}
      className="mt-4 text-xs text-tinta-suave underline underline-offset-2 transition-colors hover:text-azul-escuro"
    >
      {ativo ? 'Voltar ao tamanho padrão (maior)' : 'Reduzir o tamanho da interface'}
    </button>
  )
}

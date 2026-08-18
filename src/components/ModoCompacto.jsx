import { useSyncExternalStore } from 'react'
import { assinarCompacto, compactoAtivo, definirCompacto } from '@/lib/compacto'

/*
 * Opção discreta no fim dos menus (lateral no desktop, faixa no celular) —
 * Pedro, 18/08/2026. O site abre para todos no dimensionamento acessível
 * (85% do público é 60+); quem preferir uma interface de medidas
 * convencionais reduz por aqui, e a escolha fica guardada no navegador.
 * Precisa existir também no celular: a preferência é por navegador, e sem
 * um controle abaixo de lg quem ligasse no desktop ficaria preso no modo
 * ao estreitar a janela.
 *
 * A discrição vem da tipografia (letra miúda, cor apagada) — nunca da área
 * de clique: o alvo segue o padrão do site (min-h-12).
 *
 * Sem aria-pressed, de propósito: o ARIA APG manda escolher UM padrão de
 * toggle — rótulo de ação que muda (este caso) OU rótulo fixo com
 * aria-pressed. Combinar os dois faz o leitor de tela anunciar contradições;
 * "Voltar ao tamanho padrão" já comunica que o modo está ativo.
 */
export default function ModoCompacto() {
  // Duas instâncias sempre montadas — o estado vem do store para as duas
  // mostrarem sempre o mesmo rótulo.
  const ativo = useSyncExternalStore(assinarCompacto, compactoAtivo)
  const rotulo = ativo
    ? 'Voltar ao tamanho padrão (maior)'
    : 'Reduzir o tamanho da interface'

  return (
    <button
      type="button"
      onClick={() => definirCompacto(!ativo)}
      title={rotulo}
      className="mt-2 flex min-h-12 items-center rounded-lg px-2 text-xs text-tinta-suave underline underline-offset-2 transition-colors hover:text-azul-escuro"
    >
      {rotulo}
    </button>
  )
}

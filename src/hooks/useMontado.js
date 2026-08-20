import { useEffect, useState } from 'react'

/**
 * Verdadeiro só depois da montagem no navegador.
 *
 * Existe por causa do HTML pré-renderizado: o que depende do dia de HOJE não
 * pode ser gerado no build, porque a data do build é uma data qualquer. Uma
 * página gerada em 18/08 dizendo "esta é a mensagem de hoje" continuaria
 * dizendo isso em 25/08 — e apresentar uma mensagem de uma semana atrás como
 * a do dia é exatamente o que FR-2 proíbe.
 *
 * Servidor e PRIMEIRO render do cliente devolvem `false`, então a hidratação
 * casa; o efeito de montagem libera o conteúdo real, já calculado pelo relógio
 * de quem está lendo. Quem usa isto deve reservar a altura do que vai entrar,
 * senão o conteúdo abaixo salta quando ele aparece.
 */
export function useMontado() {
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])
  return montado
}

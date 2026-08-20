/**
 * Pub/sub mínimo dos dados do site (mensagens e músicas).
 *
 * Desde que o primeiro render deixou de esperar a API (main.jsx), os dados
 * chegam DEPOIS das páginas: quem os mostra precisa saber quando mudaram.
 * As libs de dados chamam notificar() ao trocar o que guardam; os componentes
 * assinam via useSyncExternalStore(assinar, versaoDosDados) e releem os
 * módulos. Vive fora de qualquer componente para não quebrar o fast refresh.
 */

let versao = 0
const ouvintes = new Set()

export function assinar(ouvinte) {
  ouvintes.add(ouvinte)
  return () => ouvintes.delete(ouvinte)
}

export function versaoDosDados() {
  return versao
}

export function notificar() {
  versao++
  for (const ouvinte of ouvintes) ouvinte()
}

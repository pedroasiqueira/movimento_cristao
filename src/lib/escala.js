/*
  Escala de texto do site — FR-17, que desde 20/08/2026 absorveu também o
  FR-18 (o ajuste local que existia dentro da Mensagem e da Música).

  Escreve html[data-escala], e é o index.css que decide o que cada degrau
  significa — hoje duas medidas por degrau: a raiz, que move a interface
  inteira via rem, e --tamanho-leitura, que move o corpo dos textos num ritmo
  bem mais rápido. Este arquivo não sabe de tamanhos; só do degrau. A
  preferência fica no navegador, sem cadastro.

  Limite conhecido, registrado no PRD: o caminho de acesso previsto é abrir o
  link de dentro do WhatsApp, cujo navegador embutido isola o armazenamento e
  pode descartá-lo entre sessões. Por isso o mecanismo principal de
  acessibilidade não é este controle, e sim o site respeitar a escala de fonte
  já configurada no aparelho — o que o uso de rem garante.

  O estado mora aqui, e não no componente, porque o controle existe em TRÊS
  instâncias sempre montadas (menu lateral, faixa do celular e pílula
  flutuante) — com um useState em cada, mudar numa deixaria as outras
  mentindo. Mesmo desenho do modo compacto (lib/compacto.js), com uma
  diferença: a fonte de verdade é a variável de módulo, não uma releitura do
  localStorage a cada snapshot. Sem armazenamento (o caso do WhatsApp acima),
  reler devolveria sempre 0 e o controle não sairia do lugar; assim ele
  funciona na visita inteira e o localStorage é só a persistência.
*/

const CHAVE = 'mc:escala-texto'

/** Quatro degraus (0..3). O que cada um vale — raiz e corpo — está no index.css. */
export const ESCALA_MAX = 3

const ouvintes = new Set()

function lerSalva() {
  try {
    // O valor vem de fora (storage do navegador): pode faltar, vir de uma
    // versão antiga ou ter sido editado à mão. Saneia e prende na faixa.
    const salvo = Math.trunc(Number(localStorage.getItem(CHAVE)))
    return Number.isFinite(salvo) ? Math.min(Math.max(salvo, 0), ESCALA_MAX) : 0
  } catch {
    return 0
  }
}

let atual = lerSalva()

export function escalaTexto() {
  return atual
}

/** Troca o nível e persiste — o CSS reage na hora, sem recarregar. */
function definirEscala(nivel) {
  const limitado = Math.min(Math.max(nivel, 0), ESCALA_MAX)
  if (limitado === atual) return
  atual = limitado
  document.documentElement.dataset.escala = String(limitado)
  try {
    localStorage.setItem(CHAVE, String(limitado))
  } catch {
    // Sem armazenamento: vale só nesta visita.
  }
  for (const avisar of ouvintes) avisar()
}

/**
 * Um degrau para cima ou para baixo, a partir do valor de AGORA — é o que os
 * botões usam. Parece o mesmo que definirEscala(escala ± 1) com o valor do
 * render, mas não é: dois toques dentro do mesmo quadro leriam os dois o
 * valor antigo e o segundo viraria no-op. Mesma razão de setState(fn) no React.
 */
export function ajustarEscala(passo) {
  definirEscala(atual + passo)
}

export function assinarEscala(avisar) {
  ouvintes.add(avisar)
  return () => ouvintes.delete(avisar)
}

/** main.jsx, antes do primeiro render — nada pintado, nenhum flash de tamanho. */
export function aplicarEscalaInicial() {
  document.documentElement.dataset.escala = String(atual)
}

import mensagens from '@/data/mensagens.json'

/** Fuso do Movimento. A data de referência nunca vem do relógio do aparelho — FR-1. */
const FUSO = 'America/Fortaleza'

/** Acima disto, a home deixa de apresentar a Mensagem como se fosse de hoje — FR-2. */
const DIAS_ATE_DEFASAGEM = 2

const DIAS_SEMANA = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
]

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
]

/** Data de hoje no fuso do Movimento, como AAAA-MM-DD. */
export function hojeNoMovimento() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

/** Converte AAAA-MM-DD em Date ao meio-dia UTC, longe de qualquer borda de fuso. */
function paraData(iso) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d, 12))
}

export function diasEntre(isoA, isoB) {
  return Math.round((paraData(isoB) - paraData(isoA)) / 86400000)
}

/** "segunda-feira, 17 de agosto de 2026" */
export function porExtenso(iso) {
  const d = paraData(iso)
  return `${DIAS_SEMANA[d.getUTCDay()]}, ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}

/** "17/08/2026" */
export function porNumero(iso) {
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

export function ehDomingo(iso) {
  return paraData(iso).getUTCDay() === 0
}

/** Ordenadas da mais recente para a mais antiga. */
export const acervo = [...mensagens].sort((a, b) => b.data.localeCompare(a.data))

export function buscarPorData(iso) {
  return acervo.find((m) => m.data === iso) ?? null
}

/**
 * O que a home mostra em destaque — FR-1 e FR-2.
 *
 * Devolve a Mensagem mais a situação em que ela está:
 *   'hoje'      — é a Mensagem do dia corrente.
 *   'recente'   — não há a de hoje, mas a defasagem é normal. Inclui o domingo,
 *                 em que a Mensagem vem em áudio e a de sábado permanece.
 *   'defasada'  — passou do limite. A home muda o enquadramento em vez de
 *                 seguir fingindo destaque diário.
 */
export function destaqueDaHome(hoje = hojeNoMovimento()) {
  const doDia = buscarPorData(hoje)
  if (doDia) return { mensagem: doDia, situacao: 'hoje', diasAtras: 0 }

  const ultima = acervo[0]
  if (!ultima) return { mensagem: null, situacao: 'vazio', diasAtras: 0 }

  const diasAtras = diasEntre(ultima.data, hoje)

  // Domingo tem Mensagem em áudio, não em texto: a de sábado continua valendo
  // e isso não é atraso. Padrão confirmado no corpus — 7 domingos, 7 sem texto.
  if (ehDomingo(hoje) && diasAtras <= 1) {
    return { mensagem: ultima, situacao: 'recente', diasAtras }
  }

  return {
    mensagem: ultima,
    situacao: diasAtras <= DIAS_ATE_DEFASAGEM ? 'recente' : 'defasada',
    diasAtras,
  }
}

/** Todas as Tags em uso, com quantas Mensagens cada uma tem. */
export function tagsEmUso() {
  const contagem = new Map()
  for (const m of acervo) {
    for (const t of m.tags ?? []) contagem.set(t, (contagem.get(t) ?? 0) + 1)
  }
  return [...contagem.entries()]
    .map(([tag, total]) => ({ tag, total }))
    .sort((a, b) => b.total - a.total || a.tag.localeCompare(b.tag))
}

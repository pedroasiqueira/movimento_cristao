import mensagens from '@/data/mensagens.json'
import { apiGet } from './api'

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

/*
  Linha que é inteiramente uma citação — FR-4.
  Aceita aspas tipográficas e retas: o corpus tem os dois tipos, porque a fonte
  varia (addendum §1.4). Uma detecção que só aceitasse aspas curvas perderia
  mais da metade das citações. As marcas do WhatsApp podem envolver a linha
  (o corpus real cita em itálico: `_“…”_`) — toleradas nas duas pontas.
  Exportada para o formulário admin usar o MESMO critério no botão de citação.
*/
export const CITACAO = /^\s*[_*]*\s*["“”].*["“”][.,;:!?)]*[_*]*\s*$/

/**
 * Quebra o corpo em blocos de texto normal e blocos de citação, na ordem.
 * Cada bloco guarda `inicio`/`fim` (índices de linha no corpo) — é o que
 * permite à prévia do admin achar o bloco onde o cursor está digitando.
 * Vive aqui (e não no componente Mensagem, que a renderiza) para o admin
 * importar sem quebrar o fast refresh de arquivos de componente.
 */
export function emBlocos(corpo) {
  const blocos = []
  corpo.split('\n').forEach((linha, i) => {
    const tipo = CITACAO.test(linha) && linha.trim().length > 1 ? 'citacao' : 'texto'
    const ultimo = blocos.at(-1)
    if (ultimo?.tipo === tipo) {
      ultimo.linhas.push(linha)
      ultimo.fim = i
    } else {
      blocos.push({ tipo, linhas: [linha], inicio: i, fim: i })
    }
  })
  return blocos.filter((b) => b.linhas.join('\n').trim() !== '')
}

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

/** 0 = domingo … 6 = sábado. */
export function diaDaSemana(iso) {
  return paraData(iso).getUTCDay()
}

export function somarDias(iso, n) {
  const d = paraData(iso)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/** "agosto de 2026" a partir de qualquer data do mês. */
export function rotuloMes(iso) {
  const d = paraData(iso)
  return `${MESES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`
}

const ordenar = (lista) => [...lista].sort((a, b) => b.data.localeCompare(a.data))

/**
 * Ordenadas da mais recente para a mais antiga.
 * Nasce dos JSONs empacotados (reserva) e é trocado pelo banco em
 * carregarMensagens(), chamada antes do primeiro render (main.jsx) — export
 * `let`: o binding é vivo, quem importa vê a lista nova.
 */
export let acervo = ordenar(mensagens)

/** Documento da API → forma que as páginas usam (só os campos do schema). */
const daApi = (m) => ({
  data: m.data,
  titulo: m.titulo,
  corpo: m.corpo,
  assinatura: m.assinatura ?? null,
  proveniencia: m.proveniencia ?? null,
  canal: m.canal ?? null,
  tags: m.tags ?? [],
})

/**
 * Troca a reserva pelos dados do banco. Nunca lança: com a API fora do ar ou
 * o banco vazio, os JSONs empacotados seguem valendo — o site nunca abre
 * vazio (FR-2).
 */
export async function carregarMensagens() {
  try {
    const lista = await apiGet('/mensagens')
    if (Array.isArray(lista) && lista.length > 0) {
      acervo = ordenar(lista.map(daApi))
    } else {
      console.warn('API sem mensagens — usando os dados empacotados.')
    }
  } catch (erro) {
    console.warn('API indisponível — usando os dados empacotados.', erro)
  }
}

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

/**
 * Acervo agrupado por mês, do mais recente ao mais antigo — FR-5.
 * Cada grupo: { chave: '2026-08', rotulo: 'agosto de 2026', itens: [...] }.
 */
export function acervoPorMes(lista = acervo) {
  const grupos = []
  for (const m of lista) {
    const chave = m.data.slice(0, 7)
    const ultimo = grupos.at(-1)
    if (ultimo?.chave === chave) ultimo.itens.push(m)
    else grupos.push({ chave, rotulo: rotuloMes(m.data), itens: [m] })
  }
  return grupos
}

/**
 * Mensagem anterior e seguinte no tempo — FR-5.
 * "Anterior" é a mais antiga que a atual; "seguinte", a mais recente.
 */
export function vizinhas(iso) {
  const i = acervo.findIndex((m) => m.data === iso)
  if (i === -1) return { anterior: null, seguinte: null }
  return {
    anterior: acervo[i + 1] ?? null, // acervo está do mais recente ao mais antigo
    seguinte: acervo[i - 1] ?? null,
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

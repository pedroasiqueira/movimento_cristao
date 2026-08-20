import { apiGet } from './api'
import {
  gravarDestaqueLocal,
  gravarNoCache,
  lerDestaqueLocal,
  lerDoCache,
  limparCache,
} from './cache'
import { notificar } from './store'

/** Fuso do Movimento. A data de referência vem do relógio DO SERVIDOR
 *  (/mensagens/destaque); o do aparelho é só o último recurso — FR-1. */
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

/** Data de hoje no fuso do Movimento pelo relógio do aparelho — só reserva. */
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

/** "agosto" — só o nome do mês, para quando o ano já está dito ao lado.
 *  Aceita 'AAAA-MM' (a chave dos grupos) e 'AAAA-MM-DD': lê o número direto
 *  em vez de passar por paraData, que sem o dia devolveria Invalid Date. */
export function nomeDoMes(iso) {
  return MESES[Number(iso.slice(5, 7)) - 1]
}

const ordenar = (lista) => [...lista].sort((a, b) => b.data.localeCompare(a.data))

/*
 * ————————————————————————————————————————————————————————————————————————
 * O acervo em memória.
 *
 * Desde a separação listagem/conteúdo (análise de 19/08/2026), o navegador
 * não recebe mais o corpo das 900+ mensagens de uma vez. O que circula:
 *
 *   acervo    — o ÍNDICE: { data, titulo, tags } de todas, mais recente
 *               primeiro. ~12 KB comprimido. Alimenta Acervo, vizinhas,
 *               tags e a busca offline.
 *   destaque  — UMA mensagem completa (a de hoje ou a mais recente) com a
 *               data de referência do servidor. É o primeiro conteúdo da
 *               home, ~2 KB.
 *   completas — as mensagens inteiras já lidas nesta visita, por data.
 *
 * Cada fonte tem reserva: API → cache local → /dados/*.json empacotados no
 * host estático. O site nunca abre vazio (FR-2) e nada disso bloqueia o
 * primeiro render (main.jsx). Mudou algo aqui → notificar() avisa quem está
 * na tela (store.js).
 * Export `let`: o binding é vivo, quem importa vê a lista nova.
 */
export let acervo = []

let totalAcervo = 0
let hojeServidor = null
let mensagemDestaque = null
let carregandoDestaque = true
let carregandoIndice = true
const completas = new Map()

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

/* As reservas empacotadas em public/dados/ (geradas por
   scripts/gerar-reserva.mjs no build) — só são baixadas quando a API falha.
   A promessa é guardada: cada arquivo desce no máximo uma vez por visita. */
let promessaReservaIndice = null
function reservaIndice() {
  promessaReservaIndice ??= fetch('/dados/indice.json')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
  return promessaReservaIndice
}

let promessaReservaRecentes = null
function reservaRecentes() {
  promessaReservaRecentes ??= fetch('/dados/recentes.json')
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
  return promessaReservaRecentes
}

/**
 * Antes do primeiro render (main.jsx), síncrono e barato: a segunda visita
 * pinta a home com o destaque guardado no localStorage, antes de qualquer
 * requisição — e atualiza por trás.
 */
export function iniciarMensagens() {
  const guardado = lerDestaqueLocal()
  if (guardado?.mensagem) {
    mensagemDestaque = guardado.mensagem
    totalAcervo = guardado.total ?? 0
    carregandoDestaque = false
  }
}

/** A resposta da lista, venha do formato novo ({total, itens}) ou de uma API
 *  antiga ainda no formato completo (lista de documentos) — tolerância que
 *  torna a ordem de implantação site/API indiferente. */
function normalizarLista(resposta) {
  const brutos = Array.isArray(resposta) ? resposta : resposta?.itens
  if (!Array.isArray(brutos) || brutos.length === 0) return null
  return {
    total: Array.isArray(resposta) ? resposta.length : (resposta.total ?? brutos.length),
    itens: brutos.map((m) => ({ data: m.data, titulo: m.titulo, tags: m.tags ?? [] })),
  }
}

function aplicarIndice({ total, itens }) {
  acervo = ordenar(itens)
  totalAcervo = total
  carregandoIndice = false
  notificar()
}

async function carregarDestaque(forcar = false) {
  try {
    const d = await apiGet('/mensagens/destaque', 5000, forcar ? { cache: 'reload' } : {})
    if (d?.mensagem) {
      hojeServidor = d.hoje ?? null
      totalAcervo = d.total ?? totalAcervo
      mensagemDestaque = daApi(d.mensagem)
      completas.set(mensagemDestaque.data, mensagemDestaque)
      gravarDestaqueLocal({ total: d.total, mensagem: mensagemDestaque })
      carregandoDestaque = false
      notificar()
      return
    }
    console.warn('API sem mensagens — usando a reserva empacotada.')
  } catch (erro) {
    console.warn('API indisponível para o destaque — usando a reserva.', erro)
  }
  // Sem dados bons da API: a reserva só entra se nada melhor já estiver na
  // tela (o destaque do localStorage é mais novo que o do último build).
  if (!mensagemDestaque) {
    const reserva = await reservaRecentes()
    const primeira = reserva?.itens?.[0]
    if (primeira) {
      mensagemDestaque = daApi(primeira)
      completas.set(mensagemDestaque.data, mensagemDestaque)
      totalAcervo = totalAcervo || (reserva.total ?? 0)
    }
  }
  carregandoDestaque = false
  notificar()
}

async function carregarIndice(forcar = false) {
  // O índice guardado da visita anterior pinta o Acervo na hora…
  if (!forcar && acervo.length === 0) {
    const guardado = await lerDoCache('/cache/indice')
    if (guardado?.itens?.length) aplicarIndice(guardado)
  }
  // …e a API atualiza por cima quando responder.
  try {
    const resposta = await apiGet(
      '/mensagens?formato=lista',
      20000,
      forcar ? { cache: 'reload' } : {},
    )
    const lista = normalizarLista(resposta)
    if (lista) {
      aplicarIndice(lista)
      void gravarNoCache('/cache/indice', lista)
      return
    }
    console.warn('API sem mensagens — usando a reserva empacotada.')
  } catch (erro) {
    console.warn('API indisponível para o índice — usando a reserva.', erro)
  }
  if (acervo.length === 0) {
    const reserva = await reservaIndice()
    const lista = reserva ? normalizarLista(reserva) : null
    if (lista) {
      aplicarIndice(lista)
      return
    }
    // API E host estático fora do ar ao mesmo tempo: o Acervo mostra o estado
    // vazio — último recurso aceito.
    console.warn('Reserva empacotada indisponível — acervo vazio.')
  }
  carregandoIndice = false
  notificar()
}

/**
 * Carrega destaque e índice, cada um com sua reserva — o site nunca abre
 * vazio (FR-2) e nunca lança. Chamada no boot (main.jsx, SEM await: o render
 * não espera) e após salvar no admin — aí com { forcar: true }, que descarta
 * os caches locais para a correção (FR-20) aparecer de imediato.
 */
export async function carregarMensagens({ forcar = false } = {}) {
  if (forcar) {
    completas.clear()
    await limparCache()
  }
  await Promise.allSettled([carregarDestaque(forcar), carregarIndice(forcar)])
}

/**
 * A mensagem INTEIRA de uma data — memória → cache local → API → reserva.
 * Devolve { estado, mensagem }: 'ok' com a mensagem; 'nao-encontrada' quando
 * o endereço não existe; 'indisponivel' quando existe mas não há como baixar
 * agora (sem rede). Cache local revalidado por trás — uma correção (FR-20)
 * substitui a cópia guardada na visita seguinte com rede.
 */
export async function carregarMensagem(data) {
  if (!data) return { estado: 'nao-encontrada', mensagem: null }
  const guardada = completas.get(data)
  if (guardada) return { estado: 'ok', mensagem: guardada }

  const chave = `/cache/mensagem/${data}`
  const doCache = await lerDoCache(chave)
  if (doCache) {
    completas.set(data, doCache)
    void apiGet(`/mensagens/${data}`, 12000)
      .then((m) => {
        const nova = daApi(m)
        completas.set(data, nova)
        void gravarNoCache(chave, nova)
        notificar()
      })
      .catch(() => {})
    return { estado: 'ok', mensagem: doCache }
  }

  try {
    const mensagem = daApi(await apiGet(`/mensagens/${data}`, 12000))
    completas.set(data, mensagem)
    void gravarNoCache(chave, mensagem)
    return { estado: 'ok', mensagem }
  } catch (erro) {
    if (erro.status === 404) return { estado: 'nao-encontrada', mensagem: null }
    const reserva = await reservaRecentes()
    const bruta = reserva?.itens?.find((m) => m.data === data)
    if (bruta) {
      const mensagem = daApi(bruta)
      completas.set(data, mensagem)
      return { estado: 'ok', mensagem }
    }
    // Sem rede e fora das recentes: se o índice conhece a data, ela existe —
    // só não dá para baixar agora.
    return {
      estado: buscarPorData(data) ? 'indisponivel' : 'nao-encontrada',
      mensagem: null,
    }
  }
}

/** Item do ÍNDICE (sem corpo) — existência, título, tags, vizinhança. */
export function buscarPorData(iso) {
  return acervo.find((m) => m.data === iso) ?? null
}

/** O que a home consome; muda → notificar() (store.js) avisa. */
export function estadoDestaque() {
  return {
    carregando: carregandoDestaque,
    hoje: hojeServidor,
    total: totalAcervo || acervo.length,
    mensagem: mensagemDestaque,
  }
}

export function estadoAcervo() {
  return { carregando: carregandoIndice && acervo.length === 0, total: totalAcervo || acervo.length }
}

/**
 * O que a home mostra em destaque — FR-1 e FR-2.
 *
 * Devolve a Mensagem mais a situação em que ela está:
 *   'hoje'         — é a Mensagem do dia corrente.
 *   'recente'      — não há a de hoje, mas a defasagem é normal. Inclui o
 *                    domingo, em que a Mensagem vem em áudio e a de sábado
 *                    permanece.
 *   'defasada'     — passou do limite. A home muda o enquadramento em vez de
 *                    seguir fingindo destaque diário.
 *   'carregando'   — ainda não há o que mostrar, mas está a caminho.
 *   'indisponivel' — nem API, nem cache, nem reserva; o índice pode existir.
 *   'vazio'        — não há mensagem nenhuma em fonte nenhuma.
 *
 * O dia corrente é o do relógio do SERVIDOR quando a API respondeu; o do
 * aparelho só serve de reserva — celular com data errada não muda o site.
 */
export function destaqueDaHome(hoje = hojeServidor ?? hojeNoMovimento()) {
  const mensagem = mensagemDestaque
  if (!mensagem) {
    if (carregandoDestaque) return { mensagem: null, situacao: 'carregando', diasAtras: 0 }
    return {
      mensagem: null,
      situacao: acervo.length > 0 ? 'indisponivel' : 'vazio',
      diasAtras: 0,
    }
  }
  if (mensagem.data === hoje) return { mensagem, situacao: 'hoje', diasAtras: 0 }

  const diasAtras = diasEntre(mensagem.data, hoje)

  // Domingo tem Mensagem em áudio, não em texto: a de sábado continua valendo
  // e isso não é atraso. Padrão confirmado no corpus — 7 domingos, 7 sem texto.
  if (ehDomingo(hoje) && diasAtras <= 1) {
    return { mensagem, situacao: 'recente', diasAtras }
  }

  return {
    mensagem,
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
 * Os meses agrupados por ano, do mais recente ao mais antigo — FR-5.
 * Cada ano: { ano: '2026', meses: [grupo de acervoPorMes, ...] }.
 * Deriva de acervoPorMes em vez de reler as datas: os grupos ja chegam
 * contiguos e ordenados, entao o mesmo at(-1) que agrupa mes agrupa ano.
 */
export function acervoPorAno(grupos = acervoPorMes()) {
  const anos = []
  for (const g of grupos) {
    const ano = g.chave.slice(0, 4)
    const ultimo = anos.at(-1)
    if (ultimo?.ano === ano) ultimo.meses.push(g)
    else anos.push({ ano, meses: [g] })
  }
  return anos
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

import { apiGet } from './api'
import { acervo } from './mensagens'

/**
 * Busca no Acervo — FR-7.
 *
 * Desde que o corpo das mensagens deixou de viajar para o navegador (análise
 * de 19/08/2026), a busca por conteúdo acontece na API (GET /mensagens/busca),
 * que roda O MESMO algoritmo que vivia aqui: normalização de acento e caixa,
 * remoção de palavras vazias, equivalências curadas, ranking por onde o termo
 * aparece (título 3, tag 2, corpo 1). A fonte única do vocabulário passou a
 * ser movimento_cristao_api/src/mensagens/busca.util.ts — o tokenizador
 * abaixo é o ESPELHO dela para a queda offline (título + tags, só o que o
 * índice leve tem) e precisa acompanhar qualquer mudança de lá.
 *
 * O que a busca não é (fora de escopo declarado no PRD): interpretação
 * semântica de perguntas. "O que é ser fraternal" funciona porque as palavras
 * vazias caem fora e "fraternal" equivale a "fraternidade" — não porque o
 * site entendeu a pergunta.
 */

const PALAVRAS_VAZIAS = new Set(
  (
    'a o e é de da do das dos que em um uma uns umas para por com no na nos nas ' +
    'se ao aos à às as os não mas como mais ou ser sua seu suas seus este esta ' +
    'isso isto aquilo qual quais quando onde quem tem ter há sobre entre sem ' +
    'ainda já só pode podem foi são está estão me te lhe nós vós eles elas ele ela'
  ).split(' '),
)

/*
 * Grupos de variações que devem se encontrar. Curados à mão — o conjunto de
 * aceitação de FR-7 exige os dois primeiros pares. A lista precisa de dono
 * (nota em FR-7); enquanto não tiver, cresce em busca.util.ts (API), com
 * parcimônia — e é copiada aqui.
 */
const EQUIVALENCIAS = [
  ['fraternal', 'fraterno', 'fraterna', 'fraternos', 'fraternas', 'fraternidade'],
  ['angustia', 'angustias', 'angustiado', 'angustiada'],
  ['perdao', 'perdoar', 'perdoa', 'perdoado', 'perdoados'],
  ['paz', 'pacificador', 'pacificadores'],
  ['amor', 'amar', 'amado', 'amados', 'amai'],
  ['oracao', 'oracoes', 'orar', 'ora'],
  ['familia', 'familias'],
  ['verdade', 'verdadeiro', 'verdadeira', 'verdadeiros', 'verdadeiras'],
]

const CANONICO = new Map()
for (const grupo of EQUIVALENCIAS) {
  for (const termo of grupo) CANONICO.set(termo, grupo[0])
}

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function tokens(texto) {
  return normalizar(texto)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !PALAVRAS_VAZIAS.has(t))
    .map((t) => CANONICO.get(t) ?? t)
}

/* Índice de conjuntos de tokens canônicos por campo — SÓ título e tags, que
   é o que o índice leve traz. Preguiçoso e amarrado à referência do acervo:
   quando o acervo troca (dados do banco chegando), remonta-se sozinho. */
let INDICE = null
let indexadoDe = null

function indice() {
  if (indexadoDe !== acervo) {
    INDICE = acervo.map((m) => ({
      mensagem: m,
      titulo: new Set(tokens(m.titulo)),
      tags: new Set(tokens((m.tags ?? []).join(' '))),
    }))
    indexadoDe = acervo
  }
  return INDICE
}

/**
 * A queda offline: mesmo ranking, sem o corpo. Título pesa 3, Tag pesa 2,
 * por termo encontrado; ordena por termos encontrados, pontos, data.
 */
function buscarNoIndice(consulta) {
  const termos = [...new Set(tokens(consulta))]
  if (termos.length === 0) return []

  return indice().map(({ mensagem, titulo, tags }) => {
    let pontos = 0
    let encontrados = 0
    for (const t of termos) {
      const p = (titulo.has(t) ? 3 : 0) + (tags.has(t) ? 2 : 0)
      if (p > 0) encontrados++
      pontos += p
    }
    return { mensagem, pontos, encontrados }
  })
    .filter((r) => r.encontrados > 0)
    .sort(
      (a, b) =>
        b.encontrados - a.encontrados ||
        b.pontos - a.pontos ||
        b.mensagem.data.localeCompare(a.mensagem.data),
    )
    .map((r) => r.mensagem)
}

/** Quantos resultados a tela recebe de uma vez — o suficiente para qualquer
 *  consulta razoável, sem despejar centenas de cartões num celular antigo. */
const LIMITE = 60

/**
 * Devolve { itens, total, origem } — mais relevantes primeiro.
 *   origem 'indice'  — filtro sem termos (só tag), resolvido aqui mesmo;
 *   origem 'api'     — busca completa, título+tags+corpo, na API;
 *   origem 'titulos' — API fora do ar: busca local só em título e tags,
 *                      e a tela avisa a diferença.
 */
export async function buscarMensagens(consulta, tag = null) {
  const q = consulta.trim()

  // Sem termos digitados o filtro por tag é resolvido no índice local:
  // funciona offline e não custa uma requisição.
  if (!q) {
    const itens = tag ? acervo.filter((m) => m.tags?.includes(tag)) : acervo
    return { itens, total: itens.length, origem: 'indice' }
  }

  try {
    const parametros = new URLSearchParams({ q, limite: String(LIMITE) })
    if (tag) parametros.set('tag', tag)
    const r = await apiGet(`/mensagens/busca?${parametros}`, 10000)
    return { itens: r.itens ?? [], total: r.total ?? 0, origem: 'api' }
  } catch {
    const locais = buscarNoIndice(q).filter((m) => !tag || m.tags?.includes(tag))
    return { itens: locais.slice(0, LIMITE), total: locais.length, origem: 'titulos' }
  }
}

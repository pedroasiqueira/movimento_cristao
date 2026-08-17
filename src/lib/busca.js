import { acervo } from './mensagens'

/**
 * Busca por termos no Acervo — FR-7.
 *
 * O que ela é: normalização de acento e caixa, remoção de palavras vazias,
 * equivalência de variações curadas, ranking por onde o termo aparece.
 * O que ela não é (fora de escopo declarado no PRD): interpretação semântica
 * de perguntas. "O que é ser fraternal" funciona porque as palavras vazias
 * caem fora e "fraternal" equivale a "fraternidade" — não porque o site
 * entendeu a pergunta.
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
 * (nota em FR-7); enquanto não tiver, cresce aqui, com parcimônia.
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

/* Índice montado uma vez por Mensagem: conjuntos de tokens canônicos por campo.
   O corpo já vem sem os blocos institucionais — separação feita na importação,
   exatamente para que "Espírito da Verdade" não devolva o Acervo inteiro. */
const INDICE = acervo.map((m) => ({
  mensagem: m,
  titulo: new Set(tokens(m.titulo)),
  tags: new Set(tokens((m.tags ?? []).join(' '))),
  corpo: new Set(tokens(m.corpo)),
}))

/**
 * Devolve as Mensagens relacionadas aos termos, mais relevantes primeiro.
 * Relevância: título pesa 3, Tag pesa 2, corpo pesa 1, por termo encontrado.
 */
export function buscar(consulta) {
  const termos = [...new Set(tokens(consulta))]
  if (termos.length === 0) return []

  return INDICE.map(({ mensagem, titulo, tags, corpo }) => {
    let pontos = 0
    let encontrados = 0
    for (const t of termos) {
      const p = (titulo.has(t) ? 3 : 0) + (tags.has(t) ? 2 : 0) + (corpo.has(t) ? 1 : 0)
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

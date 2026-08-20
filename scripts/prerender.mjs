/*
 * Gera um HTML pronto por endereço — o que faz a Mensagem aparecer na primeira
 * pintura, sem esperar o JavaScript nem a API.
 *
 * Por que existe: medido em produção (20/08/2026), uma entrada a frio custava
 * ~120 KB, 81% deles JavaScript, e a página só pintava depois de baixar E
 * executar o bundle. As duas portas de entrada do site — a home e o link de
 * uma Mensagem compartilhado no WhatsApp — pagavam isso inteiro, e ainda
 * esperavam uma API com 1,1 s de TTFB. Com o HTML pronto, o texto está lá
 * antes de qualquer script rodar.
 *
 * Roda no postbuild, depois de `vite build` (que faz dist/) e de
 * `vite build --ssr` (que faz dist-ssr/entry-server.js).
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(raiz, 'dist')
const distSsr = resolve(raiz, 'dist-ssr')

const API = process.env.VITE_API_URL ?? ''
/* og:url e og:image exigem endereço absoluto. Sem SITE_URL as tags saem sem
   eles: melhor um card sem imagem que um card apontando para lugar nenhum. */
const SITE = (process.env.SITE_URL ?? '').replace(/\/$/, '')

/* O card do WhatsApp precisa de um PNG: o rastreador não renderiza SVG, e o
   apple-touch-icon é pequeno demais. Enquanto public/og.png não existir, a tag
   fica de fora — apontar para um 404 não melhora nada e esconde a pendência.
   No dia em que o arquivo entrar, a tag aparece sozinha. */
const TEM_IMAGEM = existsSync(resolve(raiz, 'public/og.png'))
if (SITE && !TEM_IMAGEM) {
  console.warn('[prerender] public/og.png não existe — cards compartilhados sairão sem imagem.')
}

const { renderizar, semear, semearMusicas } = await import(
  resolve(distSsr, 'entry-server.js')
)

/* ————————————————————————————————— dados ————————————————————————————————— */

/** O Railway hiberna: a primeira chamada é cold start e pode estourar. */
async function buscar(caminho, tentativa = 1) {
  try {
    const r = await fetch(`${API}${caminho}`, { signal: AbortSignal.timeout(30_000) })
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return await r.json()
  } catch (erro) {
    if (tentativa < 3) {
      await new Promise((ok) => setTimeout(ok, tentativa * 3000))
      return buscar(caminho, tentativa + 1)
    }
    console.warn(`[prerender] ${caminho} falhou: ${erro.message}`)
    return null
  }
}

const paraMensagem = (m) => ({
  data: m.data,
  titulo: m.titulo,
  corpo: m.corpo,
  assinatura: m.assinatura ?? null,
  proveniencia: m.proveniencia ?? null,
  canal: m.canal ?? null,
  tags: m.tags ?? [],
})

const doIndice = ({ data, titulo, tags }) => ({ data, titulo, tags: tags ?? [] })

/* A cópia versionada do acervo, que gerar-reserva.mjs já usa. É a rede de
   segurança: o build NUNCA pode quebrar por causa da API. */
function doCorpus() {
  const bruto = JSON.parse(readFileSync(resolve(raiz, 'src/data/mensagens.json'), 'utf8'))
  return bruto.map(paraMensagem).sort((a, b) => b.data.localeCompare(a.data))
}

const corpus = doCorpus()
let fonte = 'api'
let mensagens = (await buscar('/mensagens?formato=completo'))?.map(paraMensagem) ?? null

if (mensagens) mensagens.sort((a, b) => b.data.localeCompare(a.data))

/* Guarda de sanidade. Um banco meio migrado responderia 200 com um punhado de
   mensagens, e o resultado seria publicar centenas de páginas faltando — com
   o CDN espalhando o estrago. Na dúvida, o corpus versionado. */
if (!mensagens || mensagens.length < corpus.length * 0.9) {
  if (mensagens) {
    console.error(
      `[prerender] A API devolveu ${mensagens.length} mensagens, menos de 90% das ${corpus.length} do corpus — usando o corpus.`,
    )
  } else {
    console.error('[prerender] API indisponível — usando o corpus versionado.')
  }
  mensagens = corpus
  fonte = 'corpus'
}

const musicasApi = fonte === 'api' ? await buscar('/musicas?incluir=despublicadas') : null
const musicas = Array.isArray(musicasApi)
  ? musicasApi.map((m) => ({
      id: m.slug,
      titulo: m.titulo,
      autores: m.autores ?? [],
      secoes: m.secoes ?? [],
      despublicada: Boolean(m.despublicada),
      exemplo: Boolean(m.exemplo),
    }))
  : []

const indice = mensagens.map(doIndice)
const total = mensagens.length

/* ————————————————————————————————— molde ————————————————————————————————— */

const molde = readFileSync(resolve(dist, 'index.html'), 'utf8')
const [anteCabeca, resto] = molde.split('<!--mc:head-->')
const [, posCabeca] = resto.split('<!--/mc:head-->')
const [anteRaiz, posRaiz] = posCabeca.split('<div id="root"></div>')

if (!anteCabeca || !posRaiz) {
  throw new Error('index.html sem os marcadores <!--mc:head--> / <div id="root">.')
}

const escaparAtributo = (t) =>
  t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Início do corpo, sem as marcas do WhatsApp, cortado em fronteira de palavra. */
function resumir(corpo, limite = 160) {
  const limpo = corpo.replace(/[*_]/g, '').replace(/\s+/g, ' ').trim()
  if (limpo.length <= limite) return limpo
  const cortado = limpo.slice(0, limite)
  return cortado.slice(0, cortado.lastIndexOf(' ')) + '…'
}

const BASE = 'Arca da Sagrada Aliança – Movimento Cristão'

function cabeca({ titulo, cartao, descricao, caminho, tipo = 'website', publicado }) {
  const url = SITE ? `${SITE}${caminho}` : null
  // O <title> da aba leva o nome do site junto para orientar quem navega em
  // várias abas; o og:title não, porque no card do WhatsApp o sufixo só
  // consome os poucos caracteres que aparecem antes do corte.
  const nomeCartao = cartao ?? titulo
  return [
    `<title>${escaparAtributo(titulo)}</title>`,
    url && `<link rel="canonical" href="${url}" />`,
    `<meta name="description" content="${escaparAtributo(descricao)}" />`,
    `<meta property="og:type" content="${tipo}" />`,
    `<meta property="og:title" content="${escaparAtributo(nomeCartao)}" />`,
    `<meta property="og:description" content="${escaparAtributo(descricao)}" />`,
    url && `<meta property="og:url" content="${url}" />`,
    SITE && TEM_IMAGEM && `<meta property="og:image" content="${SITE}/og.png" />`,
    SITE && TEM_IMAGEM && `<meta property="og:image:width" content="1200" />`,
    SITE && TEM_IMAGEM && `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="pt_BR" />`,
    publicado && `<meta property="article:published_time" content="${publicado}" />`,
  ]
    .filter(Boolean)
    .join('\n    ')
}

/* `</script>` dentro do corpo de uma Mensagem fecharia a tag e quebraria a
   página inteira — escapar o `<` é o que impede isso. */
const semearNoHtml = (dados) =>
  `<script>window.__MC__=${JSON.stringify(dados).replace(/</g, '\\u003c')}</script>`

let escritas = 0
function gerar(caminho, meta, semente) {
  semear(semente.mensagens)
  semearMusicas(semente.musicas ?? [])
  const corpo = renderizar(caminho)
  const html =
    anteCabeca +
    cabeca(meta) +
    anteRaiz +
    `<div id="root">${corpo}</div>` +
    semearNoHtml({ rota: caminho, ...semente }) +
    posRaiz

  const destino =
    caminho === '/' ? resolve(dist, 'index.html') : resolve(dist, `.${caminho}/index.html`)
  mkdirSync(dirname(destino), { recursive: true })
  writeFileSync(destino, html)
  escritas++
}

/* ———————————————————————————————— páginas ———————————————————————————————— */

const destaque = mensagens[0] ?? null

// A home. `hoje` fica NULO de propósito: a data do build não é a data de quem
// lê, e semeá-la faria a home afirmar "esta é a mensagem de hoje" com base
// numa data velha (FR-2). Quem depende do dia corrente está atrás de
// useMontado e só aparece depois da hidratação.
gerar(
  '/',
  {
    titulo: BASE,
    descricao: destaque
      ? resumir(destaque.corpo)
      : 'Mensagens diárias, músicas e encontros da Arca da Sagrada Aliança – Movimento Cristão, de Natal/RN.',
    caminho: '/',
  },
  { mensagens: { total, destaque }, musicas: [] },
)

// Uma página por Mensagem — a porta de entrada do link compartilhado.
mensagens.forEach((m, i) => {
  // Só as três do índice que `vizinhas` precisa (anterior, atual, seguinte),
  // em vez dos 66 KB do índice inteiro em cada uma das novecentas páginas.
  const vizinhanca = [mensagens[i - 1], m, mensagens[i + 1]].filter(Boolean).map(doIndice)
  gerar(
    `/mensagem/${m.data}`,
    {
      titulo: `${m.titulo} · ${BASE}`,
      cartao: m.titulo,
      descricao: resumir(m.corpo),
      caminho: `/mensagem/${m.data}`,
      tipo: 'article',
      publicado: m.data,
    },
    { mensagens: { total, mensagem: m, indice: vizinhanca }, musicas: [] },
  )
})

// O Acervo é a única que recebe o índice inteiro: é dele que ela vive.
gerar(
  '/acervo',
  {
    titulo: `Acervo · ${BASE}`,
    cartao: 'Acervo de mensagens',
    descricao: `Todas as ${total} mensagens publicadas, organizadas por data e por assunto.`,
    caminho: '/acervo',
  },
  { mensagens: { total, indice, indiceCompleto: true }, musicas: [] },
)

gerar(
  '/musicas',
  {
    titulo: `Músicas · ${BASE}`,
    cartao: 'Músicas',
    descricao: 'As letras das músicas cantadas nos encontros, para acompanhar e reler.',
    caminho: '/musicas',
  },
  { mensagens: { total }, musicas },
)

musicas
  .filter((m) => !m.despublicada)
  .forEach((m) => {
    gerar(
      `/musica/${m.id}`,
      {
        titulo: `${m.titulo} · ${BASE}`,
        cartao: m.titulo,
        descricao: m.autores?.length
          ? `${m.titulo} — ${m.autores.join(', ')}. Letra completa.`
          : `${m.titulo}. Letra completa.`,
        caminho: `/musica/${m.id}`,
      },
      { mensagens: { total }, musicas: [m] },
    )
  })

for (const [caminho, titulo, descricao] of [
  ['/encontros', 'Encontros', 'O Movimento se reúne duas vezes por semana, de forma presencial e online.'],
  ['/sobre', 'Sobre', 'Conheça a Arca da Sagrada Aliança – Movimento Cristão, de Natal/RN.'],
]) {
  gerar(
    caminho,
    { titulo: `${titulo} · ${BASE}`, cartao: titulo, descricao, caminho },
    { mensagens: { total }, musicas: [] },
  )
}

/* Como se descobre, meses depois, que um deploy saiu degradado. */
mkdirSync(resolve(dist, 'dados'), { recursive: true })
writeFileSync(
  resolve(dist, 'dados/build.json'),
  JSON.stringify({ geradoEm: new Date().toISOString(), fonte, total, paginas: escritas }),
)

rmSync(distSsr, { recursive: true, force: true })
console.log(`Pré-renderizadas ${escritas} páginas (fonte: ${fonte}, ${total} mensagens).`)

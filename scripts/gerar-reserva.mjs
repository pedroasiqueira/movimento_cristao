/*
 * Gera a reserva empacotada em public/dados/ — o que o site usa quando a API
 * está fora do ar (FR-2). Roda no prebuild/predev; os arquivos NÃO são
 * versionados (o insumo src/data/mensagens.json é a cópia versionada que o
 * PRD §7 exige).
 *
 * Dois arquivos, no lugar do acervo inteiro de ~2 MB que ia dentro do bundle:
 *   indice.json   — { total, itens: [{ data, titulo, tags }] } de todas
 *   recentes.json — { total, itens: [...] } com as N mais recentes completas
 * A parte completa não cresce com o acervo (é sempre N); só o índice cresce,
 * e ele pesa ~12 KB comprimido por mil mensagens.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RECENTES = 30

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const origem = resolve(raiz, 'src/data/mensagens.json')
const destino = resolve(raiz, 'public/dados')

const todas = JSON.parse(readFileSync(origem, 'utf8'))
  .map(({ data, titulo, corpo, assinatura, proveniencia, canal, tags }) => ({
    data,
    titulo,
    corpo,
    assinatura: assinatura ?? null,
    proveniencia: proveniencia ?? null,
    canal: canal ?? null,
    tags: tags ?? [],
  }))
  .sort((a, b) => b.data.localeCompare(a.data))

mkdirSync(destino, { recursive: true })

writeFileSync(
  resolve(destino, 'indice.json'),
  JSON.stringify({
    total: todas.length,
    itens: todas.map(({ data, titulo, tags }) => ({ data, titulo, tags })),
  }),
)

writeFileSync(
  resolve(destino, 'recentes.json'),
  JSON.stringify({ total: todas.length, itens: todas.slice(0, RECENTES) }),
)

console.log(
  `Reserva gerada em public/dados/: indice.json (${todas.length} itens) e recentes.json (${Math.min(RECENTES, todas.length)} completas).`,
)

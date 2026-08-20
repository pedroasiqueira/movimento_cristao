/**
 * Cache local dos dados — o que faz a segunda visita abrir na hora e a
 * leitura já feita sobreviver sem rede (PRD §7, rede fraca do Encontro).
 *
 * Duas camadas, cada uma no que faz melhor:
 * - localStorage: o destaque da home (~4 KB). Leitura SÍNCRONA — a home da
 *   segunda visita pinta antes de qualquer requisição.
 * - Cache Storage: o índice do acervo e as mensagens já lidas. Assíncrono e
 *   com espaço de sobra; onde não existir (navegador antigo, http puro),
 *   tudo degrada para "sem cache" sem quebrar nada.
 */

const NOME_CACHE = 'mc-dados-v1'
const CHAVE_DESTAQUE = 'mc:destaque'

const temCacheStorage = typeof caches !== 'undefined'

export async function lerDoCache(chave) {
  if (!temCacheStorage) return null
  try {
    const cache = await caches.open(NOME_CACHE)
    const resposta = await cache.match(chave)
    return resposta ? await resposta.json() : null
  } catch {
    return null
  }
}

export async function gravarNoCache(chave, valor) {
  if (!temCacheStorage) return
  try {
    const cache = await caches.open(NOME_CACHE)
    await cache.put(
      chave,
      new Response(JSON.stringify(valor), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  } catch {
    // Sem espaço ou sem permissão: o site funciona igual, só sem o atalho.
  }
}

/** Após salvar no admin: o que está guardado pode ter ficado velho. */
export async function limparCache() {
  if (!temCacheStorage) return
  try {
    await caches.delete(NOME_CACHE)
  } catch {
    // Nada a fazer.
  }
}

export function lerDestaqueLocal() {
  try {
    const bruto = localStorage.getItem(CHAVE_DESTAQUE)
    return bruto ? JSON.parse(bruto) : null
  } catch {
    return null
  }
}

export function gravarDestaqueLocal(destaque) {
  try {
    localStorage.setItem(CHAVE_DESTAQUE, JSON.stringify(destaque))
  } catch {
    // Sem armazenamento (navegador embutido restrito): vale só nesta visita.
  }
}

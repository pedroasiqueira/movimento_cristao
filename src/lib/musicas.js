import musicas from '@/data/musicas.json'

/*
 * As duas Músicas atuais são EXEMPLOS para avaliação de layout (flag
 * `exemplo: true`), porque o repertório real ainda não foi repassado pelo
 * Publicador — PRD §12, questão 4. O schema é o que as reais vão usar:
 * id, titulo, autores (lista, possivelmente vazia — FR-13), secoes com
 * tipo 'estrofe' | 'refrao' e linhas (versos preservados — FR-11).
 */

/** Ordenadas por título, para a listagem — FR-10. */
export const repertorio = [...musicas].sort((a, b) =>
  a.titulo.localeCompare(b.titulo, 'pt-BR'),
)

export function buscarMusica(id) {
  return repertorio.find((m) => m.id === id) ?? null
}

function normalizar(t) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/** Filtra por título ou trecho da letra — FR-10. */
export function filtrarMusicas(consulta) {
  const q = normalizar(consulta.trim())
  if (!q) return repertorio
  return repertorio.filter((m) => {
    const letra = m.secoes.map((s) => s.linhas.join(' ')).join(' ')
    return normalizar(m.titulo).includes(q) || normalizar(letra).includes(q)
  })
}

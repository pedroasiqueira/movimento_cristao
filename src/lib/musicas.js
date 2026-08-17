import musicas from '@/data/musicas.json'

/*
 * As duas Músicas atuais são EXEMPLOS para avaliação de layout (flag
 * `exemplo: true`), porque o repertório real ainda não foi repassado pelo
 * Publicador — PRD §12, questão 4. O schema é o que as reais vão usar:
 * id, titulo, autores (lista, possivelmente vazia — FR-13), secoes com
 * tipo 'estrofe' | 'refrao' e linhas (versos preservados — FR-11).
 */

/**
 * Ordenadas por título, para a listagem — FR-10.
 * Músicas com `despublicada: true` saem da listagem e da busca (FR-21),
 * mas o endereço continua respondendo com aviso — ver buscarMusica.
 */
export const repertorio = musicas
  .filter((m) => !m.despublicada)
  .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))

/** Devolve também as despublicadas: a página é quem exibe o aviso — FR-21. */
export function buscarMusica(id) {
  return musicas.find((m) => m.id === id) ?? null
}

function normalizar(t) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * Gera o id (endereço /musica/<id>) de uma nova Música a partir do título —
 * FR-14. Mesma normalização da busca: minúsculas, sem acento; o que não é
 * letra ou número vira hífen.
 */
export function gerarIdMusica(titulo) {
  return normalizar(titulo.trim())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
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

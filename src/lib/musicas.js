import musicasLocais from '@/data/musicas.json'
import { apiGet } from './api'
import { notificar } from './store'

/*
 * As Músicas nascem dos JSONs empacotados (reserva) e são trocadas pelo banco
 * em carregarMusicas(), chamada antes do primeiro render (main.jsx). Schema:
 * id (slug do endereço), titulo, autores (lista, possivelmente vazia — FR-13),
 * secoes com tipo 'estrofe' | 'refrao' e linhas (versos preservados — FR-11).
 */

const ordenar = (lista) =>
  [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))

// Inclui as despublicadas: buscarMusica precisa delas para a página de
// aviso do FR-21. Quem filtra para a listagem é `repertorio`.
let todas = musicasLocais

/**
 * Ordenadas por título, para a listagem — FR-10.
 * Músicas com `despublicada: true` saem da listagem e da busca (FR-21),
 * mas o endereço continua respondendo — ver buscarMusica.
 * Export `let`: binding vivo, atualizado por carregarMusicas().
 */
export let repertorio = ordenar(todas.filter((m) => !m.despublicada))

/** Documento da API → forma que as páginas usam (o slug do banco é o id daqui). */
const daApi = (m) => ({
  id: m.slug,
  titulo: m.titulo,
  autores: m.autores ?? [],
  secoes: m.secoes ?? [],
  despublicada: Boolean(m.despublicada),
  exemplo: Boolean(m.exemplo),
})

/**
 * Troca a reserva pelos dados do banco. Nunca lança: com a API fora do ar ou
 * o banco vazio, os JSONs empacotados seguem valendo.
 */
export async function carregarMusicas() {
  try {
    const lista = await apiGet('/musicas?incluir=despublicadas')
    if (Array.isArray(lista) && lista.length > 0) {
      todas = lista.map(daApi)
      repertorio = ordenar(todas.filter((m) => !m.despublicada))
      // O primeiro render não esperou por isto (main.jsx): avisa quem mostra.
      notificar()
    } else {
      console.warn('API sem músicas — usando os dados empacotados.')
    }
  } catch (erro) {
    console.warn('API indisponível — usando os dados empacotados.', erro)
  }
}

/** Devolve também as despublicadas: a página é quem exibe o aviso — FR-21. */
export function buscarMusica(id) {
  return todas.find((m) => m.id === id) ?? null
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

import musicasLocais from '@/data/musicas.json'
import { apiGet } from './api'
import { notificar } from './store'

/*
 * As Músicas nascem dos JSONs empacotados (reserva) e são trocadas pelo banco
 * em carregarMusicas(), chamada sob demanda por garantirMusicas(). Schema:
 * id (o código sorteado do endereço), titulo, autores (lista, possivelmente
 * vazia — FR-13), secoes com tipo 'estrofe' | 'refrao' e linhas (versos
 * preservados — FR-11).
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

/** Documento da API → forma que as páginas usam (o `codigo` do banco é o id
 *  daqui; o nome muda na fronteira porque `id` colide com uma virtual do
 *  Mongoose do lado do servidor). */
const daApi = (m) => ({
  id: m.codigo,
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

/*
 * As Músicas saíram do boot (análise de 20/08/2026): eram uma terceira ida à
 * API disputando espaço com o destaque, numa origem de 1,1 s de TTFB, para uma
 * página que a maioria dos visitantes não abre. Agora descem quando alguém
 * entra em /musicas — e no ócio, depois da primeira pintura.
 *
 * A promessa é guardada: as duas telas de música podem pedir sem virar duas
 * requisições.
 */
let promessaMusicas = null
export function garantirMusicas() {
  promessaMusicas ??= carregarMusicas()
  return promessaMusicas
}

/** Semeia o repertório — o que o HTML pré-renderizado embute e o que o
 *  servidor usa antes de renderizar. Escreve tudo de uma vez, como semear()
 *  de lib/mensagens.js, para não vazar estado entre páginas. */
export function semearMusicas(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return
  todas = lista
  repertorio = ordenar(todas.filter((m) => !m.despublicada))
}

/** Devolve também as despublicadas: a página é quem exibe o aviso — FR-21. */
export function buscarMusica(id) {
  return todas.find((m) => m.id === id) ?? null
}

function normalizar(t) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

/**
 * O trecho LEGÍVEL do endereço, a partir do título. Mesma normalização da
 * busca: minúsculas, sem acento; o que não é letra ou número vira hífen.
 *
 * Até 20/08/2026 isto gerava o id — o endereço era o slug do título, e
 * corrigir o título condenava a música a um endereço que mentia para sempre.
 * Agora quem resolve é o código sorteado pelo servidor; este trecho é enfeite,
 * para quem recebe o link no WhatsApp saber o que vai abrir. Trocá-lo à mão na
 * barra de endereço não muda a música que aparece (ver MusicaPagina).
 */
export function slugDoTitulo(titulo) {
  return normalizar(titulo.trim())
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * O endereço de uma Música — FR-14. Único lugar que sabe a forma do caminho;
 * a listagem, a página, a tela do admin e a pré-renderização passam por aqui.
 *
 * Título sem letra nem número ("♪♪♪") não deixa trecho legível nenhum, e o
 * caminho sai só com o código: um segmento vazio no fim daria caminho com
 * barra dupla na pré-renderização e faria a página se redirecionar em laço.
 */
export const caminhoMusica = (m) => {
  const legivel = slugDoTitulo(m.titulo)
  return legivel ? `/musica/${m.id}/${legivel}` : `/musica/${m.id}`
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

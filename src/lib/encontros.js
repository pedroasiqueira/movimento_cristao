import { hojeNoMovimento, somarDias, diaDaSemana } from './mensagens'
import { EXCECOES_ENCONTROS } from '@/config'

/*
 * Encontros: quartas-feiras (3) e sábados (6) — FR-15.
 * A recorrência é calculada por regra, nunca escrita como lista de datas:
 * listas manuais envelhecem sozinhas e viram o "conteúdo fantasma" que o
 * addendum §7 condena. Exceções (feriado, recesso) vivem em config.js e
 * sobrepõem a regra, com aviso — a outra metade do FR-15.
 */
const DIAS_DE_ENCONTRO = new Set([3, 6])

/** Próximos encontros a partir de hoje, no fuso do Movimento. */
export function proximosEncontros(quantos = 4) {
  const lista = []
  let dia = hojeNoMovimento()
  while (lista.length < quantos) {
    if (DIAS_DE_ENCONTRO.has(diaDaSemana(dia))) {
      lista.push({ data: dia, cancelado: EXCECOES_ENCONTROS.includes(dia) })
    }
    dia = somarDias(dia, 1)
  }
  return lista
}

import { CITACAO, hojeNoMovimento } from './mensagens'

/*
  Interpreta uma mensagem colada inteira — como ela circula no WhatsApp
  (*negrito*, _itálico_, citações em _“…”_) ou no formato original em
  Markdown (# Título, **negrito**, > citação) — e devolve os campos do
  cadastro: {titulo, data|null, assinatura, corpo, proveniencia, canal,
  avisos[]}. O corpo sai no padrão do site (marcas do WhatsApp), que é o
  que a página renderiza e o banco guarda.

  Espelha as regras de reconstruir_mensagens.py (raiz do repo), que refez o
  corpus a partir do dump: mudou lá, muda aqui.
*/

/** Junta os pares partidos pelo WhatsApp: `*a* *b*` -> `*a b*` (idem _). */
function normalizarEmendas(texto) {
  return texto.replaceAll('_ _', ' ').replaceAll('* *', ' ')
}

function semMarcas(texto) {
  return normalizarEmendas(texto).replace(/[*_]/g, '').replace(/ {2,}/g, ' ').trim()
}

/** Referências bíblicas entre parênteses, ex.: "(João 14:6; Mateus 5:8)". */
const REFERENCIAS = /^\((?:[A-ZÀ-Ü][a-zà-ü]+ \d+[\d:;,.\-– ]*)+\)$/

function ehProveniencia(linha) {
  const plano = semMarcas(linha)
  if (plano.includes('canal')) return false
  if (plano.includes('Espírito da Verdade') || plano.includes('João 16:12')) return true
  return REFERENCIAS.test(plano)
}

function ehCanal(linha) {
  const plano = semMarcas(linha)
  return plano.includes('Arca') && plano.includes('canal')
}

/** `[dd/mm, hh:mm] Nome: resto` — cabeçalho de mensagem copiada da conversa. */
const CABECALHO = /^\[(\d{2})\/(\d{2}), \d{2}:\d{2}\] [^:]+: /

/**
 * Markdown (formato original das mensagens) -> dialeto do WhatsApp.
 * Ordem importa: o negrito `**x**` é protegido antes de o itálico `*x*`
 * virar `_x_`, senão um comeria o outro.
 */
function deMarkdown(texto) {
  // No original o `**…**` pode atravessar linhas; no WhatsApp marca não
  // atravessa linha — cada linha do trecho vira um negrito próprio,
  // protegido por \u0000 até o passo do itálico terminar.
  texto = texto.replace(/\*\*([^*]+)\*\*/g, (tudo, conteudo) =>
    conteudo
      .split('\n')
      .map((l) => (l.trim() ? `\u0000${l.trim()}\u0000` : l))
      .join('\n'),
  )
  return texto
    .split('\n')
    .map((linha) => {
      linha = linha.replace(/^#+\s*/, '')
      if (/^>\s?/.test(linha)) {
        linha = linha.replace(/^>\s?/, '')
        if (linha.trim() && !CITACAO.test(linha)) linha = `"${linha.trim()}"`
      }
      linha = linha.replace(/\*([^*\n]+)\*/g, '_$1_')
      return linha.replaceAll('\u0000', '*')
    })
    .join('\n')
}

export function interpretarMensagem(textoColado) {
  const avisos = []
  let texto = textoColado.replace(/\r\n?/g, '\n')

  // Cabeçalho da conversa (se veio de uma cópia do histórico): sai do texto
  // e a data vira sugestão para o campo Dia (o ano não vem no cabeçalho).
  let data = null
  const cab = CABECALHO.exec(texto.trimStart())
  if (cab) {
    const ano = hojeNoMovimento().slice(0, 4)
    data = `${ano}-${cab[2]}-${cab[1]}`
    texto = texto.trimStart().slice(cab[0].length)
  }

  const ehMarkdown = /^#/m.test(texto) || /^>\s/m.test(texto) || texto.includes('**')
  if (ehMarkdown) texto = deMarkdown(texto)
  texto = normalizarEmendas(texto)

  const linhas = texto.split('\n').map((l) => l.trimEnd())
  while (linhas.length && !linhas[0].trim()) linhas.shift()

  const titulo = linhas.length ? semMarcas(linhas.shift()) : ''
  if (!titulo) avisos.push('Não reconheci o título (esperado na primeira linha).')

  while (linhas.length && !linhas[0].trim()) linhas.shift()
  let assinatura = null
  if (
    linhas.length &&
    linhas[0].includes('Arca da Sagrada Aliança') &&
    linhas[0].length < 120
  ) {
    assinatura = semMarcas(linhas.shift())
  } else {
    avisos.push('Sem a linha de assinatura (Arca da Sagrada Aliança…) após o título.')
  }

  // Rodapé: só as linhas institucionais CONTÍGUAS no fim — "Espírito da
  // Verdade" também aparece em citações no meio do corpo e não pode sair.
  const proveniencia = []
  let canal = null
  while (linhas.length) {
    const ultima = linhas[linhas.length - 1].trim()
    if (!ultima) linhas.pop()
    else if (canal === null && ehCanal(ultima)) canal = semMarcas(linhas.pop())
    else if (ehProveniencia(ultima)) proveniencia.unshift(semMarcas(linhas.pop()))
    else break
  }
  if (!canal && proveniencia.length === 0) {
    avisos.push('Sem rodapé de proveniência/canal — confira se a mensagem veio completa.')
  }

  const corpo = linhas
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!corpo) avisos.push('O corpo da mensagem ficou vazio.')

  return {
    titulo,
    data,
    assinatura,
    corpo,
    proveniencia: proveniencia.join(' ') || null,
    canal,
    avisos,
  }
}

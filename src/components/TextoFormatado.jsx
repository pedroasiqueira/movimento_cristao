/*
  Marcas de formatação do WhatsApp — *negrito* e _itálico_. As mensagens
  nascem lá (PRD §3), então colar já traz as marcas; aqui elas viram
  formatação de verdade. Como no WhatsApp: não atravessam linhas e não
  colam em espaço (o conteúdo começa e termina em caractere visível).

  Componente próprio (e não função no Mensagem.jsx) porque a prévia da
  home também formata texto cru — e arquivo de componente não deve
  exportar função avulsa (fast refresh).
*/
const NEGRITO = /\*(\S(?:[^*\n]*\S)?)\*/
const ITALICO = /_(\S(?:[^_\n]*\S)?)_/

/** Texto cru → nós React com as marcas aplicadas (aninhamento incluso). */
function comFormato(texto) {
  const nos = []
  let resto = texto
  while (resto) {
    const negrito = NEGRITO.exec(resto)
    const italico = ITALICO.exec(resto)
    const marca =
      negrito && italico
        ? negrito.index <= italico.index
          ? negrito
          : italico
        : (negrito ?? italico)
    if (!marca) {
      nos.push(resto)
      break
    }
    if (marca.index > 0) nos.push(resto.slice(0, marca.index))
    const Formato = marca === negrito ? 'strong' : 'em'
    nos.push(<Formato key={nos.length}>{comFormato(marca[1])}</Formato>)
    resto = resto.slice(marca.index + marca[0].length)
  }
  return nos
}

export default function TextoFormatado({ texto }) {
  return comFormato(texto)
}

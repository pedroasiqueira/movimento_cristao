import { emBlocos, porExtenso } from '@/lib/mensagens'

/*
  Marcas de formatação do WhatsApp — *negrito* e _itálico_. As mensagens
  nascem lá (PRD §3), então colar já traz as marcas; aqui elas viram
  formatação de verdade. Como no WhatsApp: não atravessam linhas e não
  colam em espaço (o conteúdo começa e termina em caractere visível).
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

export default function Mensagem({ mensagem, comoTitulo: Titulo = 'h1' }) {
  const { titulo, data, corpo, assinatura, proveniencia, canal } = mensagem

  return (
    <article>
      <header className="mb-6">
        <Titulo className="text-balance font-leitura text-2xl leading-tight font-bold text-tinta sm:text-3xl">
          {titulo}
        </Titulo>
        <p className="mt-2 text-sm text-tinta-suave">
          <time dateTime={data}>{porExtenso(data)}</time>
        </p>
        {assinatura && (
          <p className="mt-1 text-sm text-tinta-suave">{assinatura}</p>
        )}
      </header>

      <div className="texto-mensagem">
        {emBlocos(corpo).map((bloco, i) =>
          bloco.tipo === 'citacao' ? (
            <blockquote
              key={i}
              className="my-5 border-l-4 border-azul bg-azul-claro py-3 pr-4 pl-5 text-azul-escuro"
            >
              {comFormato(bloco.linhas.join('\n').trim())}
            </blockquote>
          ) : (
            <div key={i}>{comFormato(bloco.linhas.join('\n'))}</div>
          ),
        )}
      </div>

      {/*
        Proveniência e declaração de canal são a posição do Movimento sobre a
        origem do texto, e não moldura da interface — por isso são exibidas
        sempre que existirem (FR-4). Ficam fora do índice de busca, o que é
        decisão separada e invisível aqui.
      */}
      {(proveniencia || canal) && (
        <footer className="mt-8 border-t border-borda pt-4 text-sm leading-relaxed text-tinta-suave">
          {proveniencia && <p>{proveniencia}</p>}
          {canal && <p className={proveniencia ? 'mt-2' : ''}>{canal}</p>}
        </footer>
      )}
    </article>
  )
}

import { emBlocos, porExtenso } from '@/lib/mensagens'

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
              {bloco.linhas.join('\n').trim()}
            </blockquote>
          ) : (
            <div key={i}>{bloco.linhas.join('\n')}</div>
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

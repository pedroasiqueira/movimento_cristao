import { Link } from 'react-router-dom'
import { porNumero } from '@/lib/mensagens'

/** Item da listagem do Acervo: título e data no mínimo — FR-5. */
export default function CartaoMensagem({ mensagem }) {
  return (
    <Link
      to={`/mensagem/${mensagem.data}`}
      className="block rounded-lg border border-borda px-4 py-4 transition-colors hover:border-azul hover:bg-azul-claro"
    >
      <h3 className="font-leitura text-lg leading-snug font-bold text-tinta">
        {mensagem.titulo}
      </h3>
      <p className="mt-1 text-sm text-tinta-suave">
        <time dateTime={mensagem.data}>{porNumero(mensagem.data)}</time>
        {mensagem.tags?.length > 0 && <> · {mensagem.tags.join(' · ')}</>}
      </p>
    </Link>
  )
}

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { filtrarMusicas, repertorio } from '@/lib/musicas'
import { useTitulo } from '@/hooks/useTitulo'

/**
 * Listagem de Músicas — FR-10: alcançável do menu em um toque, com busca por
 * título e por trecho da letra. O repertório real tem mais de cinquenta; a
 * busca já está aqui para não nascer depois, quando a rolagem não bastar.
 */
export default function Musicas() {
  useTitulo('Músicas')
  const [consulta, setConsulta] = useState('')
  const resultado = useMemo(() => filtrarMusicas(consulta), [consulta])
  const soExemplos = repertorio.every((m) => m.exemplo)

  return (
    <>
      <h1 className="font-leitura text-3xl font-bold text-tinta">Músicas</h1>
      <p className="mt-2 text-tinta-suave">
        As letras das músicas cantadas nos encontros do Movimento.
      </p>

      {soExemplos && (
        <div className="mt-4 rounded-lg border border-dashed border-borda bg-papel-suave px-4 py-3 text-sm text-tinta-suave">
          As músicas abaixo são <strong className="text-tinta">exemplos de demonstração</strong>,
          apenas para avaliar o layout. As letras reais do Movimento serão cadastradas no lugar.
        </div>
      )}

      <div className="relative mt-6">
        <Search
          size={22}
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-tinta-suave"
        />
        <input
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Buscar pelo título ou por um trecho da letra…"
          aria-label="Buscar música pelo título ou por um trecho da letra"
          className="h-14 w-full rounded-lg border border-borda bg-papel pr-4 pl-12 text-tinta placeholder:text-tinta-suave focus:border-azul"
        />
      </div>

      <p className="mt-4 text-sm text-tinta-suave" role="status">
        {resultado.length} {resultado.length === 1 ? 'música' : 'músicas'}
      </p>

      {resultado.length === 0 ? (
        <div className="mt-4 rounded-lg border border-borda bg-papel-suave px-5 py-6">
          <p className="text-tinta">Nenhuma música encontrada com essas palavras.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {resultado.map((m) => (
            <Link
              key={m.id}
              to={`/musica/${m.id}`}
              className="block rounded-lg border border-borda px-4 py-4 hover:border-azul hover:bg-azul-claro"
            >
              <h2 className="font-leitura text-lg font-bold text-tinta">{m.titulo}</h2>
              <p className="mt-1 text-sm text-tinta-suave">
                {m.autores?.length > 0 ? m.autores.join(', ') : 'Autoria desconhecida'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}

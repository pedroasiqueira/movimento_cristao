import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CartaoMensagem from '@/components/CartaoMensagem'
import { acervo, acervoPorMes, tagsEmUso } from '@/lib/mensagens'
import { buscar } from '@/lib/busca'
import { useTitulo } from '@/hooks/useTitulo'

/**
 * O Acervo — FR-5 (navegar por data), FR-7 (buscar por texto),
 * FR-8 (filtrar por Tag). Realiza UJ-1 (Maria, por assunto) e UJ-2 (João,
 * por termos com variações).
 *
 * A busca e as Tags ficam recolhidas atrás de "Buscar mensagens" — pedido do
 * Pedro após usar a tela: abertas, empurravam a primeira Mensagem para além
 * de uma tela inteira de rolagem. Quem chega por um link com ?tag= encontra
 * o painel já aberto, com o filtro à vista. Fechar o painel limpa busca e
 * filtro: fechar significa voltar à lista completa, sem filtro escondido.
 */
export default function Acervo() {
  useTitulo('Acervo')
  const [parametros, setParametros] = useSearchParams()
  const tagAtiva = parametros.get('tag')
  const [consulta, setConsulta] = useState('')
  const [buscaAberta, setBuscaAberta] = useState(() => Boolean(tagAtiva))
  const tags = useMemo(tagsEmUso, [])

  // Chegou por link com ?tag= (da home ou de uma Mensagem): painel à vista.
  useEffect(() => {
    if (tagAtiva) setBuscaAberta(true)
  }, [tagAtiva])

  const resultado = useMemo(() => {
    let lista = consulta.trim() ? buscar(consulta) : acervo
    if (tagAtiva) lista = lista.filter((m) => m.tags?.includes(tagAtiva))
    return lista
  }, [consulta, tagAtiva])

  const filtrando = Boolean(consulta.trim() || tagAtiva)
  const grupos = useMemo(
    () => (filtrando ? null : acervoPorMes(resultado)),
    [filtrando, resultado],
  )

  function definirTag(tag) {
    setParametros(tag ? { tag } : {}, { replace: true })
  }

  function fecharBusca() {
    setConsulta('')
    definirTag(null)
    setBuscaAberta(false)
  }

  return (
    <>
      <h1 className="font-leitura text-3xl font-bold text-tinta">Acervo</h1>
      <p className="mt-2 text-tinta-suave">
        Todas as mensagens publicadas, organizadas por data e por assunto.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {buscaAberta ? (
          <Button variant="outline" className="min-h-12 gap-2 px-5" onClick={fecharBusca}>
            <X aria-hidden />
            Fechar busca
          </Button>
        ) : (
          <Button
            className="min-h-12 gap-2 px-5"
            onClick={() => setBuscaAberta(true)}
            aria-expanded={buscaAberta}
          >
            <Search aria-hidden />
            Buscar mensagens
          </Button>
        )}
        {!buscaAberta && (
          <span className="text-sm text-tinta-suave">{acervo.length} mensagens no acervo</span>
        )}
      </div>

      {buscaAberta && (
        <div className="mt-4 rounded-lg border border-borda bg-papel-suave p-4">
          {/* Busca — FR-7 */}
          <div className="relative">
            <Search
              size={22}
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-tinta-suave"
            />
            <input
              type="search"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Buscar por palavra ou assunto…"
              aria-label="Buscar mensagens por palavra ou assunto"
              className="h-14 w-full rounded-lg border border-borda bg-papel pr-4 pl-12 text-tinta placeholder:text-tinta-suave focus:border-azul"
            />
          </div>

          {/* Tags visíveis e clicáveis, sem exigir que a pessoa saiba os nomes — FR-8 */}
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por assunto">
            {tags.map(({ tag, total }) => (
              <Button
                key={tag}
                variant={tag === tagAtiva ? 'default' : 'secondary'}
                className="min-h-12 px-4"
                onClick={() => definirTag(tag === tagAtiva ? null : tag)}
                aria-pressed={tag === tagAtiva}
              >
                {tag}
                <span className={tag === tagAtiva ? 'opacity-80' : 'text-tinta-suave'}>
                  {total}
                </span>
              </Button>
            ))}
          </div>

          <p className="mt-4 text-sm text-tinta-suave" role="status">
            {filtrando
              ? `${resultado.length} ${resultado.length === 1 ? 'mensagem encontrada' : 'mensagens encontradas'}`
              : `${acervo.length} mensagens no acervo`}
          </p>
        </div>
      )}

      {/* Sem resultado: as Tags são o caminho alternativo, nunca tela vazia — FR-7 */}
      {resultado.length === 0 && (
        <div className="mt-4 rounded-lg border border-borda bg-papel-suave px-5 py-6">
          <p className="text-tinta">Nenhuma mensagem encontrada com essas palavras.</p>
          <p className="mt-1 text-sm text-tinta-suave">
            Tente outra palavra, ou navegue pelos assuntos logo acima.
          </p>
        </div>
      )}

      {/* Filtrando: lista corrida por relevância. Sem filtro: grupos por mês — FR-5 */}
      {filtrando ? (
        <div className="mt-4 space-y-3">
          {resultado.map((m) => (
            <CartaoMensagem key={m.data} mensagem={m} />
          ))}
        </div>
      ) : (
        grupos && (
          <>
            <nav aria-label="Ir direto para um mês" className="mt-5 flex flex-wrap gap-2">
              {grupos.map((g) => (
                <a
                  key={g.chave}
                  href={`#mes-${g.chave}`}
                  className="flex min-h-12 items-center rounded-lg bg-papel-suave px-4 text-tinta hover:bg-azul-claro hover:text-azul-escuro"
                >
                  {g.rotulo}
                </a>
              ))}
            </nav>

            {grupos.map((g) => (
              <section key={g.chave} aria-labelledby={`titulo-${g.chave}`} className="mt-8">
                <h2
                  id={`titulo-${g.chave}`}
                  className="scroll-mt-4 border-b border-borda pb-2 text-lg font-semibold text-azul-escuro"
                >
                  <span id={`mes-${g.chave}`} className="scroll-mt-6">
                    {g.rotulo}
                  </span>
                </h2>
                <div className="mt-4 space-y-3">
                  {g.itens.map((m) => (
                    <CartaoMensagem key={m.data} mensagem={m} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )
      )}
    </>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CartaoMensagem from '@/components/CartaoMensagem'
import { acervo, acervoPorMes, estadoAcervo, tagsEmUso } from '@/lib/mensagens'
import { buscarMensagens } from '@/lib/busca'
import { useTitulo } from '@/hooks/useTitulo'
import { useDadosVivos } from '@/hooks/useMensagens'

/**
 * O Acervo — FR-5 (navegar por data), FR-7 (buscar por texto),
 * FR-8 (filtrar por Tag). Realiza UJ-1 (Maria, por assunto) e UJ-2 (João,
 * por termos com variações).
 *
 * A tela trabalha sobre o ÍNDICE leve (data/título/tags); a busca por
 * conteúdo acontece na API e, sem rede, cai para título+tags com aviso.
 * Nada de centenas de cartões de uma vez: a vista inicial mostra os meses
 * recentes e os botões de mês — que antes eram âncoras — passaram a FILTRAR,
 * mantendo o DOM pequeno em qualquer celular (era o custo escondido de
 * renderizar as 900+ de uma vez).
 *
 * A busca e as Tags ficam recolhidas atrás de "Buscar mensagens" — pedido do
 * Pedro após usar a tela: abertas, empurravam a primeira Mensagem para além
 * de uma tela inteira de rolagem. Quem chega por um link com ?tag= encontra
 * o painel já aberto, com o filtro à vista. Fechar o painel limpa busca e
 * filtro: fechar significa voltar à lista completa, sem filtro escondido.
 */

/** A vista inicial fecha o mês em que esta contagem é atingida. */
const CARTOES_NA_ENTRADA = 30

export default function Acervo() {
  useTitulo('Acervo')
  useDadosVivos()
  const [parametros, setParametros] = useSearchParams()
  const tagAtiva = parametros.get('tag')
  const [consulta, setConsulta] = useState('')
  const [buscaAberta, setBuscaAberta] = useState(() => Boolean(tagAtiva))
  const [mesAtivo, setMesAtivo] = useState(null)
  // Sem memo: a tela re-renderiza quando o índice chega (useDadosVivos) e
  // estes cálculos custam ~1 ms sobre o índice leve — memoizar contra um
  // binding externo só confundiria o rastreio de dependências.
  const tags = tagsEmUso()
  const { carregando } = estadoAcervo()

  // Chegou por link com ?tag= (da home ou de uma Mensagem): painel à vista.
  useEffect(() => {
    if (tagAtiva) setBuscaAberta(true)
  }, [tagAtiva])

  const buscando = Boolean(consulta.trim())
  const filtrando = buscando || Boolean(tagAtiva)
  const resultado = useBusca(consulta, tagAtiva)

  const grupos = filtrando ? null : acervoPorMes(acervo)

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
          <span className="text-sm text-tinta-suave">
            {carregando ? 'Carregando o acervo…' : `${acervo.length} mensagens no acervo`}
          </span>
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
              className="h-12 w-full rounded-lg border border-borda bg-papel pr-4 pl-12 text-tinta placeholder:text-tinta-suave focus:border-azul"
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
            {resultado.buscandoAinda
              ? 'Buscando…'
              : filtrando
                ? `${resultado.total} ${resultado.total === 1 ? 'mensagem encontrada' : 'mensagens encontradas'}` +
                  (resultado.itens.length < resultado.total
                    ? ` — mostrando as ${resultado.itens.length} mais relevantes`
                    : '')
                : `${acervo.length} mensagens no acervo`}
          </p>

          {/* Sem rede a busca cobre menos (o corpo mora no servidor): dizer
              isso vale mais que fingir que nada mudou. */}
          {buscando && !resultado.buscandoAinda && resultado.origem === 'titulos' && (
            <p className="mt-2 text-sm text-tinta-suave" role="status">
              Sem conexão com o servidor — buscando apenas nos títulos e assuntos.
            </p>
          )}
        </div>
      )}

      {/* Sem resultado: as Tags são o caminho alternativo, nunca tela vazia — FR-7 */}
      {filtrando && !resultado.buscandoAinda && resultado.itens.length === 0 && (
        <div className="mt-4 rounded-lg border border-borda bg-papel-suave px-5 py-6">
          <p className="text-tinta">Nenhuma mensagem encontrada com essas palavras.</p>
          <p className="mt-1 text-sm text-tinta-suave">
            Tente outra palavra, ou navegue pelos assuntos logo acima.
          </p>
        </div>
      )}

      {/* Filtrando: lista corrida por relevância. Sem filtro: por mês — FR-5 */}
      {filtrando ? (
        <div className="mt-4 space-y-3">
          {resultado.itens.map((m) => (
            <CartaoMensagem key={m.data} mensagem={m} />
          ))}
        </div>
      ) : (
        grupos && (
          <ListaPorMes grupos={grupos} mesAtivo={mesAtivo} aoEscolherMes={setMesAtivo} />
        )
      )}
    </>
  )
}

/**
 * Digitou → espera 300 ms de silêncio → busca (API; sem rede, índice local).
 * Respostas fora de ordem são descartadas: só a consulta corrente conta.
 */
function useBusca(consulta, tagAtiva) {
  const [resultado, setResultado] = useState(() => ({
    itens: [],
    total: 0,
    origem: 'indice',
    // Chegou já filtrando (link com ?tag=): nasce "buscando" para não piscar
    // um "nenhuma mensagem encontrada" antes de o efeito rodar.
    buscandoAinda: Boolean(consulta.trim() || tagAtiva),
  }))
  const idDaBusca = useRef(0)
  const versao = useDadosVivos()

  useEffect(() => {
    const id = ++idDaBusca.current
    if (!consulta.trim() && !tagAtiva) {
      setResultado({ itens: [], total: 0, origem: 'indice', buscandoAinda: false })
      return undefined
    }
    setResultado((r) => ({ ...r, buscandoAinda: true }))
    const espera = setTimeout(async () => {
      const r = await buscarMensagens(consulta, tagAtiva)
      if (idDaBusca.current === id) setResultado({ ...r, buscandoAinda: false })
    }, consulta.trim() ? 300 : 0)
    return () => clearTimeout(espera)
  }, [consulta, tagAtiva, versao])

  return resultado
}

/**
 * A navegação por data — FR-5. Os botões de mês filtram: a vista inicial
 * traz os meses mais recentes (até ~30 cartões) e cada mês abre sozinho,
 * no lugar da rolagem única com o acervo inteiro.
 */
function ListaPorMes({ grupos, mesAtivo, aoEscolherMes }) {
  const visiveis = useMemo(() => {
    const doMes = mesAtivo && grupos.filter((g) => g.chave === mesAtivo)
    if (doMes?.length) return doMes
    const iniciais = []
    let cartoes = 0
    for (const g of grupos) {
      iniciais.push(g)
      cartoes += g.itens.length
      if (cartoes >= CARTOES_NA_ENTRADA) break
    }
    return iniciais
  }, [grupos, mesAtivo])

  const haMaisMeses = visiveis.length < grupos.length

  return (
    <>
      <nav aria-label="Escolher um mês" className="mt-5 flex flex-wrap gap-2">
        {grupos.map((g) => (
          <Button
            key={g.chave}
            variant={g.chave === mesAtivo ? 'default' : 'secondary'}
            className="min-h-12 px-4"
            onClick={() => aoEscolherMes(g.chave === mesAtivo ? null : g.chave)}
            aria-pressed={g.chave === mesAtivo}
          >
            {g.rotulo}
          </Button>
        ))}
      </nav>

      {visiveis.map((g) => (
        <section key={g.chave} aria-labelledby={`titulo-${g.chave}`} className="mt-8">
          <h2
            id={`titulo-${g.chave}`}
            className="border-b border-borda pb-2 text-lg font-semibold text-azul-escuro"
          >
            {g.rotulo}
          </h2>
          <div className="mt-4 space-y-3">
            {g.itens.map((m) => (
              <CartaoMensagem key={m.data} mensagem={m} />
            ))}
          </div>
        </section>
      ))}

      {!mesAtivo && haMaisMeses && (
        <p className="mt-8 rounded-lg bg-papel-suave px-5 py-4 text-sm text-tinta-suave">
          Estas são as mensagens mais recentes. Para ver as anteriores, escolha
          um mês logo acima.
        </p>
      )}
    </>
  )
}

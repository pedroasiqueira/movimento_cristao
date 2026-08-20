import { useEffect, useId, useRef, useState } from 'react'
import { CalendarDays, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { acervoPorAno, nomeDoMes } from '@/lib/mensagens'

/**
 * Escolher um mês do acervo — FR-5, em dois toques (ano → mês).
 *
 * Substitui a fileira que trazia UM botão por mês do acervo inteiro: eram 39
 * em agosto/2026, ~370px antes da primeira Mensagem no desktop e a tela toda
 * no celular (prints filtros-mobile.png/filtros-desktop.png). Como aquela
 * fileira crescia 12 botões por ano, o problema só pioraria — daí o corte por
 * ano: agora cresce UM botão por ano, e fechado o controle é uma linha só.
 *
 * Fechado por padrão porque quem chega ao Acervo quase sempre quer as
 * mensagens recentes, que a vista de entrada já mostra; filtrar é o pedido
 * incomum. Mesmo desenho do painel de "Buscar mensagens" logo acima, pela
 * mesma razão e com as mesmas classes.
 *
 * A tela monta este componente DUAS vezes (topo e fim da lista) — por isso o
 * useId no painel e nenhum estado global aqui dentro.
 *
 * A raiz é `display: contents`: quem posiciona é o pai. No topo é isso que
 * deixa o gatilho ao lado de "Buscar mensagens", na mesma linha, enquanto o
 * painel — w-full — quebra para baixo em largura inteira. Os dois pontos de
 * uso montam o componente dentro de um flex-wrap com gap, que já dá o
 * espaçamento; por isso o painel não tem margem própria.
 */
export default function FiltroMes({ grupos, mesAtivo, aoEscolherMes }) {
  const idPainel = useId()
  const gatilho = useRef(null)
  const [aberto, setAberto] = useState(false)
  const [anoEscolhido, setAnoEscolhido] = useState(null)

  // Escape fecha e devolve o foco — mesmo contrato do Modo canto (MusicaPagina).
  useEffect(() => {
    if (!aberto) return undefined
    const aoTeclar = (e) => {
      if (e.key !== 'Escape') return
      setAberto(false)
      gatilho.current?.focus()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto])

  // Enquanto o índice não chega (acervo é binding vivo), a página já diz
  // "Carregando o acervo…": um controle vazio aqui só confundiria. Com um
  // mês só, filtrar não muda nada — o acervo inteiro já está na tela.
  if (grupos.length < 2) return null

  const anos = acervoPorAno(grupos)
  // Derivado, sem efeito de sincronia: sem ninguém ter tocado nos anos, o
  // painel abre no ano do mês ativo — inclusive quando ele veio de um link
  // com ?mes= — e, sem mês, no ano mais recente.
  const anoAberto = anoEscolhido ?? mesAtivo?.slice(0, 4) ?? anos[0].ano
  const meses = anos.find((a) => a.ano === anoAberto)?.meses ?? []
  const rotuloAtivo = grupos.find((g) => g.chave === mesAtivo)?.rotulo

  function escolher(chave) {
    const proximo = chave === mesAtivo ? null : chave
    aoEscolherMes(proximo)
    setAberto(false)
    // Escolheu um mês: quem recebe o foco (e leva a rolagem junto) é o título
    // do mês na lista — ver ListaPorMes. Desmarcou: não há destino, então o
    // foco volta ao gatilho, senão morreria no <body> com o painel fechado.
    if (!proximo) gatilho.current?.focus()
  }

  function limpar() {
    aoEscolherMes(null)
    gatilho.current?.focus()
  }

  return (
    <div className="contents">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          ref={gatilho}
          variant="outline"
          className="min-h-12 gap-2 px-5"
          onClick={() => setAberto(!aberto)}
          aria-expanded={aberto}
          aria-controls={aberto ? idPainel : undefined}
        >
          <CalendarDays aria-hidden />
          {mesAtivo ? 'Escolher outro mês' : 'Escolher o mês'}
          {aberto ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
        </Button>

        {mesAtivo && (
          <>
            {/* Texto simples de propósito: o anúncio de que a lista mudou vem
                do foco no título do mês. Um role="status" aqui falaria duas
                vezes a mesma coisa. */}
            <span className="text-tinta-suave">
              Mostrando <strong className="font-semibold text-tinta">{rotuloAtivo}</strong>
            </span>
            <Button variant="outline" className="min-h-12 gap-2 px-4" onClick={limpar}>
              <X aria-hidden />
              Ver todos os meses
            </Button>
          </>
        )}
      </div>

      {aberto && (
        <div id={idPainel} className="w-full rounded-lg border border-borda bg-papel-suave p-4">
          {/* Um ano só (acervo novo): a fileira não escolheria nada. */}
          {anos.length > 1 && (
            <>
              <p className="text-sm font-semibold text-tinta">Ano</p>
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Escolher o ano">
                {anos.map(({ ano }) => (
                  <Button
                    key={ano}
                    variant={ano === anoAberto ? 'default' : 'secondary'}
                    className="min-h-12 px-5"
                    onClick={() => setAnoEscolhido(ano)}
                    aria-pressed={ano === anoAberto}
                  >
                    {ano}
                  </Button>
                ))}
              </div>
            </>
          )}

          <p className={'text-sm font-semibold text-tinta' + (anos.length > 1 ? ' mt-5' : '')}>
            Mês de {anoAberto}
          </p>
          {/* Colunas pela largura do TEXTO, não por breakpoint: as media
              queries do Tailwind medem rem contra os 16px do navegador e
              ignoram html[data-escala], então um sm:grid-cols-3 fixo estouraria
              com "setembro" a 320px na escala maior. Com auto-fill a grade cai
              para uma coluna em vez de vazar. */}
          <div
            className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2 sm:grid-cols-[repeat(auto-fill,minmax(10rem,1fr))]"
            role="group"
            aria-label={`Escolher o mês de ${anoAberto}`}
          >
            {meses.map((g) => (
              <Button
                key={g.chave}
                variant={g.chave === mesAtivo ? 'default' : 'secondary'}
                className="min-h-12 justify-between px-4"
                onClick={() => escolher(g.chave)}
                aria-pressed={g.chave === mesAtivo}
              >
                <span className="capitalize">{nomeDoMes(g.chave)}</span>
                <span className={g.chave === mesAtivo ? 'opacity-80' : 'text-tinta-suave'}>
                  {g.itens.length}
                </span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

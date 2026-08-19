import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Bold, Check, ClipboardPaste, Italic, Plus, Quote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Mensagem from '@/components/Mensagem'
import { apiEnviar } from '@/lib/api'
import {
  CITACAO,
  buscarPorData,
  carregarMensagens,
  emBlocos,
  hojeNoMovimento,
  porExtenso,
  tagsEmUso,
} from '@/lib/mensagens'
import { interpretarMensagem } from '@/lib/interpretarMensagem'
import { multiplicadorInicial } from '@/lib/leitura'
import { useTitulo } from '@/hooks/useTitulo'

/**
 * Cadastro e edição da Mensagem do Dia — Área Admin.
 * FR-9: publicar agora é o padrão, com o mínimo de passos; programar é opção.
 * FR-6: as tags já usadas são oferecidas para reaproveitamento, clicáveis.
 * FR-4: a prévia usa o componente real da página — quebras de linha e
 * citações aparecem exatamente como o site vai mostrar.
 * FR-20: a mesma tela, aberta em /admin/mensagem/editar/:data, corrige uma
 * mensagem já publicada sem criar registro novo nem mudar o endereço.
 */
export default function AdminMensagemNova({ token }) {
  // Edição — a rota /admin/mensagem/editar/:data cai neste MESMO formulário
  // (FR-20): a mensagem abre preenchida, a data (o endereço permanente) fica
  // travada e o envio vira PATCH em vez de POST.
  const { data: dataEdicao } = useParams()
  const original = dataEdicao ? buscarPorData(dataEdicao) : null

  if (dataEdicao && !original) {
    return (
      <>
        <Link
          to="/admin"
          className="inline-flex min-h-12 items-center gap-1.5 text-azul underline underline-offset-2 hover:text-azul-escuro"
        >
          <ArrowLeft size={18} aria-hidden />
          Área Admin
        </Link>
        <h1 className="mt-2 font-leitura text-3xl font-bold text-tinta">
          Mensagem não encontrada
        </h1>
        <p className="mt-2 text-tinta-suave">
          Não há mensagem publicada no dia {dataEdicao} para editar.
        </p>
      </>
    )
  }

  // key: trocar de mensagem (ou sair da edição para o cadastro) recomeça limpo.
  return <Formulario key={original?.data ?? 'nova'} token={token} original={original} />
}

/** Um formulário, dois usos: cadastro (original nulo) e edição (preenchido). */
function Formulario({ token, original }) {
  const edicao = Boolean(original)
  useTitulo(edicao ? 'Editar mensagem' : 'Adicionar mensagem')
  const [data, setData] = useState(original ? original.data : hojeNoMovimento)
  const [titulo, setTitulo] = useState(original?.titulo ?? '')
  const [corpo, setCorpo] = useState(original?.corpo ?? '')
  const [assinatura, setAssinatura] = useState(original?.assinatura ?? '')
  const [proveniencia, setProveniencia] = useState(original?.proveniencia ?? '')
  const [canal, setCanal] = useState(original?.canal ?? '')
  const [tags, setTags] = useState(original ? [...original.tags] : [])
  const [novaTag, setNovaTag] = useState('')
  const [momento, setMomento] = useState('agora')
  const [quando, setQuando] = useState('')
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [salva, setSalva] = useState(null)

  // Duas portas de entrada: a mensagem colada inteira (a principal — a
  // tela sempre abre nela, decisão do Pedro 18/08/2026) ou os campos.
  // Na edição só os campos fazem sentido: o texto atual já está neles.
  const [entrada, setEntrada] = useState(edicao ? 'campos' : 'colar')
  const [textoColado, setTextoColado] = useState('')
  const [avisosColada, setAvisosColada] = useState([])
  const [colada, setColada] = useState(false)

  const emUso = useMemo(tagsEmUso, [])

  // A prévia (fixa na tela, com rolagem própria) acompanha o campo em
  // edição — pedido do Pedro (17/08/2026): título/dia/assinatura voltam ao
  // topo, proveniência/canal levam ao rodapé e o corpo segue o CURSOR
  // dentro do texto (editar a linha 3 mostra a linha 3, não o fim).
  // Reexecuta a cada tecla e a cada movimento do cursor.
  const previaRef = useRef(null)
  const [campoAtivo, setCampoAtivo] = useState(null)
  const [cursorCorpo, setCursorCorpo] = useState(0)
  useEffect(() => {
    const caixa = previaRef.current
    if (!caixa || !campoAtivo) return
    const rolarAte = (topo) => caixa.scrollTo({ top: Math.max(0, topo), behavior: 'smooth' })

    if (campoAtivo === 'proveniencia' || campoAtivo === 'canal') {
      const alvo = caixa.querySelector('footer')
      if (!alvo) return
      const fundo =
        alvo.getBoundingClientRect().bottom -
        caixa.getBoundingClientRect().top +
        caixa.scrollTop
      rolarAte(fundo - caixa.clientHeight + 16)
      return
    }

    if (campoAtivo !== 'corpo') {
      rolarAte(0)
      return
    }

    // O corpo renderizado descarta as linhas vazias do início; o cursor é
    // um índice no texto cru — desconta o que foi cortado antes de achar a
    // linha, e dela o bloco renderizado correspondente.
    const areaCorpo = caixa.querySelector('.texto-mensagem')
    if (!areaCorpo) return
    const limpo = corpo.replace(/^\n+|\s+$/g, '')
    const cortado = corpo.length - corpo.replace(/^\n+/, '').length
    const linha = limpo.slice(0, Math.max(0, cursorCorpo - cortado)).split('\n').length - 1
    const blocos = emBlocos(limpo)
    if (blocos.length === 0) return
    let indice = blocos.findLastIndex((b) => linha >= b.inicio)
    if (indice < 0) indice = 0
    const alvo = areaCorpo.children[indice]
    if (!alvo) return
    const bloco = blocos[indice]
    const fracao =
      bloco.fim > bloco.inicio
        ? Math.min(1, (linha - bloco.inicio) / (bloco.fim - bloco.inicio))
        : 0
    const r = alvo.getBoundingClientRect()
    const ponto =
      r.top - caixa.getBoundingClientRect().top + caixa.scrollTop + fracao * r.height
    // Ponto do cursor no meio do painel: dá contexto acima e abaixo.
    rolarAte(ponto - caixa.clientHeight / 2)
  }, [campoAtivo, cursorCorpo, titulo, data, assinatura, corpo, proveniencia, canal])

  // Botões de formatação — pedido do Pedro (17/08/2026): as marcas são as
  // do WhatsApp (*negrito*, _itálico_), as mesmas que já chegam ao colar
  // uma mensagem de lá; a citação é a linha inteira entre aspas (FR-4).
  const corpoRef = useRef(null)

  function focarCorpoEm(ini, fim) {
    requestAnimationFrame(() => {
      const area = corpoRef.current
      if (!area) return
      area.focus()
      area.setSelectionRange(ini, fim)
      setCursorCorpo(ini)
    })
  }

  /** Envolve a seleção com a marca; já marcada, desfaz. Espaços das pontas
      ficam fora — marca colada em espaço não formata, como no WhatsApp.
      Seleção de várias linhas ganha marca linha a linha — no WhatsApp a
      marca não atravessa linha. */
  function aplicarMarca(marca) {
    const area = corpoRef.current
    if (!area) return
    let ini = area.selectionStart
    let fim = area.selectionEnd
    const trecho = corpo.slice(ini, fim)
    ini += trecho.length - trecho.trimStart().length
    fim -= trecho.length - trecho.trimEnd().length
    const puro = corpo.slice(ini, fim)
    if (corpo[ini - 1] === marca && corpo[fim] === marca) {
      setCorpo(corpo.slice(0, ini - 1) + puro + corpo.slice(fim + 1))
      focarCorpoEm(ini - 1, fim - 1)
    } else if (puro.includes('\n')) {
      const marcada = new RegExp(`^(\\s*)\\${marca}(.+)\\${marca}(\\s*)$`)
      const linhas = puro.split('\n')
      const todasMarcadas = linhas.every((l) => !l.trim() || marcada.test(l))
      const novo = linhas
        .map((l) => {
          if (!l.trim() || (!todasMarcadas && marcada.test(l))) return l
          if (todasMarcadas) return l.replace(marcada, '$1$2$3')
          return l.replace(/^(\s*)(.*?)(\s*)$/, `$1${marca}$2${marca}$3`)
        })
        .join('\n')
      setCorpo(corpo.slice(0, ini) + novo + corpo.slice(fim))
      focarCorpoEm(ini, ini + novo.length)
    } else if (puro.length > 1 && puro.startsWith(marca) && puro.endsWith(marca)) {
      setCorpo(corpo.slice(0, ini) + puro.slice(1, -1) + corpo.slice(fim))
      focarCorpoEm(ini, fim - 2)
    } else if (ini === fim) {
      setCorpo(corpo.slice(0, ini) + marca + marca + corpo.slice(ini))
      focarCorpoEm(ini + 1, ini + 1)
    } else {
      setCorpo(corpo.slice(0, ini) + marca + puro + marca + corpo.slice(fim))
      focarCorpoEm(ini, fim + 2)
    }
  }

  /** Põe entre aspas a(s) linha(s) da seleção — linha inteira entre aspas
      vira o bloco de citação. Já entre aspas, desfaz. */
  function alternarCitacao() {
    const area = corpoRef.current
    if (!area) return
    const ini =
      area.selectionStart === 0 ? 0 : corpo.lastIndexOf('\n', area.selectionStart - 1) + 1
    const quebra = corpo.indexOf('\n', area.selectionEnd)
    const fim = quebra === -1 ? corpo.length : quebra
    const linhas = corpo.slice(ini, fim).split('\n')
    // Mesmo critério do site (CITACAO): aspas retas ou tipográficas, com ou
    // sem marcas do WhatsApp envolvendo a linha.
    const todasCitadas = linhas.every((l) => !l.trim() || CITACAO.test(l))
    const trecho = linhas
      .map((l) => {
        if (!l.trim()) return l
        if (todasCitadas)
          return l.replace(/^(\s*[_*]*\s*)["“](.*)["”]([.,;:!?)]*[_*]*\s*)$/, '$1$2$3')
        return l.replace(/^(\s*)(.*?)(\s*)$/, '$1"$2"$3')
      })
      .join('\n')
    setCorpo(corpo.slice(0, ini) + trecho + corpo.slice(fim))
    focarCorpoEm(ini, ini + trecho.length)
  }

  function alternarTag(tag) {
    setTags((atuais) =>
      atuais.includes(tag) ? atuais.filter((t) => t !== tag) : [...atuais, tag],
    )
  }

  function adicionarNovaTag() {
    const tag = novaTag.trim().toLowerCase()
    if (tag && !tags.includes(tag)) setTags((atuais) => [...atuais, tag])
    setNovaTag('')
  }

  async function salvar(e) {
    e.preventDefault()
    const encontrados = {}
    if (!data) encontrados.data = 'Escolha o dia da mensagem.'
    else if (!edicao && buscarPorData(data))
      encontrados.data = 'Já existe uma mensagem nesse dia.'
    if (!titulo.trim()) encontrados.titulo = 'A mensagem precisa de um título.'
    if (!corpo.trim()) encontrados.corpo = 'A mensagem precisa do texto.'
    if (momento === 'programar' && !quando)
      encontrados.quando = 'Escolha a data e a hora da publicação.'
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setSalvando(true)
    try {
      const corpoLimpo = corpo.replace(/^\n+|\s+$/g, '')
      if (edicao) {
        // FR-20: consertar é PATCH no mesmo endereço — nada de registro novo,
        // `data` e `publicarEm` ficam como estão. Campo opcional esvaziado
        // vai como null para ser apagado de verdade, não só omitido.
        await apiEnviar(
          'PATCH',
          `/mensagens/${original.data}`,
          {
            titulo: titulo.trim(),
            corpo: corpoLimpo,
            assinatura: assinatura.trim() || null,
            proveniencia: proveniencia.trim() || null,
            canal: canal.trim() || null,
            tags,
          },
          token,
        )
      } else {
        await apiEnviar(
          'POST',
          '/mensagens',
          {
            data,
            titulo: titulo.trim(),
            corpo: corpoLimpo,
            ...(assinatura.trim() && { assinatura: assinatura.trim() }),
            ...(proveniencia.trim() && { proveniencia: proveniencia.trim() }),
            ...(canal.trim() && { canal: canal.trim() }),
            tags,
            // FR-9: o horário digitado vale pelo relógio deste aparelho — o
            // Publicador escreve de Natal, o próprio fuso do Movimento.
            ...(momento === 'programar' && {
              publicarEm: new Date(quando).toISOString(),
            }),
          },
          token,
        )
      }
      // Acervo em memória recarregado: publicada agora, ela já aparece na
      // home, no acervo e na busca. Programada fica invisível até a hora.
      await carregarMensagens()
      setSalva({
        data,
        titulo: titulo.trim(),
        agendada: momento === 'programar',
        quando,
        edicao,
      })
      window.scrollTo(0, 0)
    } catch (falha) {
      setErros({
        api:
          falha.status === 401
            ? 'A sessão expirou. Saia e entre de novo na Área Admin.'
            : `Não foi possível salvar: ${falha.message}`,
      })
    } finally {
      setSalvando(false)
    }
  }

  function recomecar() {
    setData(hojeNoMovimento())
    setTitulo('')
    setCorpo('')
    setAssinatura('')
    setProveniencia('')
    setCanal('')
    setTags([])
    setNovaTag('')
    setMomento('agora')
    setQuando('')
    setErros({})
    setSalva(null)
    setTextoColado('')
    setAvisosColada([])
    setColada(false)
    setEntrada('colar')
  }

  /**
   * Modo "colar mensagem pronta" — pedido do Pedro (17/08/2026): a mensagem
   * inteira (formato do WhatsApp ou o original em Markdown) é interpretada
   * e os campos existentes são preenchidos para revisão; tags e "Quando
   * publicar" seguem manuais, e validação/prévia/envio são os de sempre.
   */
  function aplicarColada(texto) {
    if (!texto.trim()) return
    const lida = interpretarMensagem(texto)
    setTitulo(lida.titulo)
    setCorpo(lida.corpo)
    setAssinatura(lida.assinatura ?? '')
    setProveniencia(lida.proveniencia ?? '')
    setCanal(lida.canal ?? '')
    if (lida.data) setData(lida.data)
    setAvisosColada(lida.avisos)
    setColada(true)
    setEntrada('campos')
    setErros({})
    window.scrollTo(0, 0)
  }

  if (salva) return <Sucesso mensagem={salva} aoRecomecar={recomecar} />

  const temPrevia = Boolean(data && (titulo.trim() || corpo.trim()))

  return (
    <>
      <Link
        to="/admin"
        className="inline-flex min-h-12 items-center gap-1.5 text-azul underline underline-offset-2 hover:text-azul-escuro"
      >
        <ArrowLeft size={18} aria-hidden />
        Área Admin
      </Link>

      <h1 className="mt-2 font-leitura text-3xl font-bold text-tinta">
        {edicao ? 'Editar mensagem do dia' : 'Adicionar mensagem do dia'}
      </h1>
      <p className="mt-2 text-tinta-suave">
        {edicao
          ? 'Ajuste o texto e acompanhe na prévia como a página vai ficar.'
          : 'Cole ou escreva o texto e acompanhe na prévia como a página vai ficar.'}
      </p>

      {/* Duas formas de entrada; a colada preenche estes mesmos campos. */}
      {!edicao && (
        <div
          className="mt-5 flex flex-wrap gap-2"
          role="group"
          aria-label="Forma de cadastro"
        >
          <Button
            type="button"
            variant={entrada === 'colar' ? 'default' : 'outline'}
            className="min-h-12 gap-2 px-5"
            aria-pressed={entrada === 'colar'}
            onClick={() => setEntrada('colar')}
          >
            <ClipboardPaste aria-hidden />
            Colar mensagem pronta
          </Button>
          <Button
            type="button"
            variant={entrada === 'campos' ? 'default' : 'outline'}
            className="min-h-12 px-5"
            aria-pressed={entrada === 'campos'}
            onClick={() => setEntrada('campos')}
          >
            Preencher os campos
          </Button>
        </div>
      )}

      {entrada === 'colar' && (
        <div className="mt-6 max-w-3xl">
          <label htmlFor="mensagem-colada" className="mb-1.5 block font-medium text-tinta">
            Mensagem completa
          </label>
          <p className="mt-1 mb-1.5 text-sm text-tinta-suave">
            Cole a mensagem como ela circula no WhatsApp (ou no formato original). Título,
            assinatura, corpo e rodapés são reconhecidos e vão para os campos, para você revisar
            antes de publicar.
          </p>
          <textarea
            id="mensagem-colada"
            rows={16}
            value={textoColado}
            onChange={(e) => setTextoColado(e.target.value)}
            onPaste={(e) => {
              const texto = e.clipboardData.getData('text')
              if (texto.trim()) {
                e.preventDefault()
                setTextoColado(texto)
                aplicarColada(texto)
              }
            }}
            className="w-full rounded-lg border border-borda bg-papel px-4 py-3 leading-relaxed text-tinta focus:border-azul"
          />
          <Button
            type="button"
            className="mt-3 min-h-12 px-6"
            onClick={() => aplicarColada(textoColado)}
          >
            Preencher os campos com esta mensagem
          </Button>
        </div>
      )}

      {entrada === 'campos' && colada && (
        <div className="mt-6 rounded-lg border border-azul bg-azul-claro px-4 py-3">
          <p className="font-medium text-azul-escuro">
            Campos preenchidos a partir da mensagem colada — revise, escolha os assuntos e
            publique.
          </p>
          {avisosColada.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-tinta">
              {avisosColada.map((aviso) => (
                <li key={aviso}>{aviso}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {entrada === 'campos' && (
        <form onSubmit={salvar} noValidate className="mt-6 grid gap-8 lg:grid-cols-2">
          <div className="space-y-5">
            {/* Os campos seguem a ordem em que a página exibe a mensagem:
              título, data, assinatura, corpo, proveniência, canal —
              pedido do Pedro (17/08/2026). */}
            <div>
              <label htmlFor="mensagem-titulo" className="mb-1.5 block font-medium text-tinta">
                Título
              </label>
              <input
                id="mensagem-titulo"
                onFocus={() => setCampoAtivo('titulo')}
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="h-12 w-full rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
              />
              {erros.titulo && (
                <p className="mt-1.5 text-sm font-medium text-destructive">{erros.titulo}</p>
              )}
            </div>

            <div>
              <label htmlFor="mensagem-data" className="mb-1.5 block font-medium text-tinta">
                Dia da mensagem
              </label>
              <input
                id="mensagem-data"
                onFocus={() => setCampoAtivo('data')}
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                disabled={edicao}
                className="h-12 w-full rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul disabled:cursor-not-allowed disabled:opacity-60"
              />
              {erros.data && (
                <p className="mt-1.5 text-sm font-medium text-destructive">{erros.data}</p>
              )}
              {/* FR-3: o dia é o endereço permanente da mensagem. */}
              {data && (
                <p className="mt-1.5 text-sm text-tinta-suave">
                  Endereço: <span className="font-medium text-tinta">/mensagem/{data}</span>
                  {edicao && ' — permanente, a edição não o altera.'}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="mensagem-assinatura"
                className="mb-1.5 block font-medium text-tinta"
              >
                Assinatura <span className="font-normal text-tinta-suave">(opcional)</span>
              </label>
              <input
                id="mensagem-assinatura"
                onFocus={() => setCampoAtivo('assinatura')}
                type="text"
                value={assinatura}
                onChange={(e) => setAssinatura(e.target.value)}
                className="h-12 w-full rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
              />
            </div>

            <div>
              <label htmlFor="mensagem-corpo" className="mb-1.5 block font-medium text-tinta">
                Texto da mensagem
              </label>
              <p className="mt-1 mb-1.5 text-sm text-tinta-suave">
                As quebras de linha ficam como no original. Linha inteira entre aspas vira
                citação destacada, e as marcas do WhatsApp valem aqui: *negrito* e _itálico_ —
                colar de lá já traz a formatação.
              </p>
              <div className="mb-2 flex gap-2" role="group" aria-label="Formatação do texto">
                <Button
                  type="button"
                  variant="outline"
                  className="size-10 [&_svg]:size-5"
                  aria-label="Negrito"
                  title="Negrito"
                  onClick={() => aplicarMarca('*')}
                >
                  <Bold aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="size-10 [&_svg]:size-5"
                  aria-label="Itálico"
                  title="Itálico"
                  onClick={() => aplicarMarca('_')}
                >
                  <Italic aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="size-10 [&_svg]:size-5"
                  aria-label="Citação"
                  title="Citação — linha inteira entre aspas"
                  onClick={alternarCitacao}
                >
                  <Quote aria-hidden />
                </Button>
              </div>
              <textarea
                id="mensagem-corpo"
                ref={corpoRef}
                onFocus={() => setCampoAtivo('corpo')}
                rows={14}
                value={corpo}
                onChange={(e) => {
                  setCorpo(e.target.value)
                  setCursorCorpo(e.target.selectionStart)
                }}
                // onSelect também dispara em clique e setas: mover o cursor
                // sem digitar já leva a prévia ao trecho correspondente.
                onSelect={(e) => setCursorCorpo(e.target.selectionStart)}
                className="w-full rounded-lg border border-borda bg-papel px-4 py-3 leading-relaxed text-tinta focus:border-azul"
              />
              {erros.corpo && (
                <p className="mt-1.5 text-sm font-medium text-destructive">{erros.corpo}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="mensagem-proveniencia"
                className="mb-1.5 block font-medium text-tinta"
              >
                Nota de proveniência{' '}
                <span className="font-normal text-tinta-suave">(opcional)</span>
              </label>
              <input
                id="mensagem-proveniencia"
                onFocus={() => setCampoAtivo('proveniencia')}
                type="text"
                value={proveniencia}
                onChange={(e) => setProveniencia(e.target.value)}
                className="h-12 w-full rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
              />
            </div>

            <div>
              <label htmlFor="mensagem-canal" className="mb-1.5 block font-medium text-tinta">
                Declaração de canal{' '}
                <span className="font-normal text-tinta-suave">(opcional)</span>
              </label>
              <input
                id="mensagem-canal"
                onFocus={() => setCampoAtivo('canal')}
                type="text"
                value={canal}
                onChange={(e) => setCanal(e.target.value)}
                className="h-12 w-full rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
              />
            </div>

            <div>
              <p className="font-medium text-tinta">Assuntos (tags)</p>
              {/* FR-6: as já usadas vêm primeiro, para reaproveitar em vez de variar. */}
              {emUso.length > 0 && (
                <div
                  className="mt-2 flex flex-wrap gap-2"
                  role="group"
                  aria-label="Tags já usadas"
                >
                  {emUso.map(({ tag }) => (
                    <Button
                      key={tag}
                      type="button"
                      variant={tags.includes(tag) ? 'default' : 'secondary'}
                      className="min-h-12 px-4"
                      aria-pressed={tags.includes(tag)}
                      onClick={() => alternarTag(tag)}
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={novaTag}
                  onChange={(e) => setNovaTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      adicionarNovaTag()
                    }
                  }}
                  placeholder="Novo assunto…"
                  aria-label="Novo assunto"
                  className="h-12 w-full max-w-xs rounded-lg border border-borda bg-papel px-4 text-tinta placeholder:text-tinta-suave focus:border-azul"
                />
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-12 gap-1.5 px-4"
                  onClick={adicionarNovaTag}
                >
                  <Plus aria-hidden />
                  Adicionar
                </Button>
              </div>
              {tags.filter((t) => !emUso.some((u) => u.tag === t)).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags
                    .filter((t) => !emUso.some((u) => u.tag === t))
                    .map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        variant="default"
                        className="min-h-12 px-4"
                        aria-pressed
                        onClick={() => alternarTag(tag)}
                      >
                        {tag}
                      </Button>
                    ))}
                </div>
              )}
            </div>

            {/* Na edição a mensagem já está no ar: o agendamento não se aplica
                e `publicarEm` fica intocado no banco. */}
            {!edicao && (
              <fieldset>
                <legend className="font-medium text-tinta">Quando publicar</legend>
                <div className="mt-2 space-y-2">
                  <label className="flex min-h-12 items-center gap-3 rounded-lg border border-borda px-4">
                    <input
                      type="radio"
                      name="momento"
                      checked={momento === 'agora'}
                      onChange={() => setMomento('agora')}
                      className="size-5 accent-azul"
                    />
                    <span className="text-tinta">Publicar agora</span>
                  </label>
                  <label className="flex min-h-12 items-center gap-3 rounded-lg border border-borda px-4">
                    <input
                      type="radio"
                      name="momento"
                      checked={momento === 'programar'}
                      onChange={() => setMomento('programar')}
                      className="size-5 accent-azul"
                    />
                    <span className="text-tinta">Programar para</span>
                  </label>
                  {momento === 'programar' && (
                    <div className="pl-1">
                      <input
                        type="datetime-local"
                        value={quando}
                        onChange={(e) => setQuando(e.target.value)}
                        aria-label="Data e hora da publicação"
                        className="h-12 w-full max-w-xs rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
                      />
                      <p className="mt-1.5 text-sm text-tinta-suave">
                        Horário do fuso do Movimento (Natal). Até lá, a mensagem fica fora
                        do site.
                      </p>
                      {erros.quando && (
                        <p className="mt-1.5 text-sm font-medium text-destructive">
                          {erros.quando}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </fieldset>
            )}

            {erros.api && (
              <p role="alert" className="text-sm font-medium text-destructive">
                {erros.api}
              </p>
            )}

            <Button type="submit" disabled={salvando} className="min-h-12 px-6">
              {salvando
                ? 'Salvando…'
                : edicao
                  ? 'Salvar alterações'
                  : momento === 'programar'
                    ? 'Programar mensagem'
                    : 'Publicar mensagem'}
            </Button>
          </div>

          {/* Prévia viva com o componente real da página da Mensagem — FR-4. */}
          <div
            ref={previaRef}
            className="rounded-lg border border-borda bg-papel-suave p-5 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:self-start lg:overflow-y-auto lg:p-6"
          >
            <p className="text-sm font-semibold tracking-wide text-azul-escuro uppercase">
              Prévia
            </p>
            {temPrevia ? (
              <div className="mt-3" style={{ fontSize: `${multiplicadorInicial()}em` }}>
                <Mensagem
                  comoTitulo="h2"
                  mensagem={{
                    data,
                    titulo: titulo.trim() || 'Sem título',
                    corpo: corpo.replace(/^\n+|\s+$/g, ''),
                    assinatura: assinatura.trim() || null,
                    proveniencia: proveniencia.trim() || null,
                    canal: canal.trim() || null,
                    tags,
                  }}
                />
              </div>
            ) : (
              <p className="mt-4 text-sm text-tinta-suave">
                A mensagem aparece aqui conforme você escreve.
              </p>
            )}
          </div>
        </form>
      )}
    </>
  )
}

function Sucesso({ mensagem, aoRecomecar }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <Check size={24} aria-hidden className="shrink-0 text-azul" />
        <h1 className="font-leitura text-3xl font-bold text-tinta">
          {mensagem.edicao
            ? 'Mensagem atualizada'
            : mensagem.agendada
              ? 'Mensagem programada'
              : 'Mensagem publicada'}
        </h1>
      </div>
      <p className="mt-3 text-tinta-suave">
        <strong className="font-semibold text-tinta">{mensagem.titulo}</strong>{' '}
        {mensagem.agendada ? (
          <>
            entra no ar em{' '}
            <strong className="font-semibold text-tinta">
              {new Date(mensagem.quando).toLocaleString('pt-BR', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
            </strong>
            . Até lá, o endereço /mensagem/{mensagem.data} não responde.
          </>
        ) : mensagem.edicao ? (
          <>já está no site com as alterações — dia {porExtenso(mensagem.data)}.</>
        ) : (
          <>já está no site — dia {porExtenso(mensagem.data)}.</>
        )}
      </p>

      <div className="mt-5 flex flex-wrap gap-3">
        {!mensagem.agendada && (
          <Link
            to={`/mensagem/${mensagem.data}`}
            className="inline-flex min-h-12 items-center rounded-lg bg-azul px-5 font-medium text-white hover:bg-azul-escuro"
          >
            Ver a página da mensagem
          </Link>
        )}
        {!mensagem.edicao && (
          <Button variant="outline" className="min-h-12 px-5" onClick={aoRecomecar}>
            Cadastrar outra
          </Button>
        )}
      </div>

      <Link
        to="/admin"
        className="mt-6 inline-flex min-h-12 items-center gap-1.5 text-azul underline underline-offset-2 hover:text-azul-escuro"
      >
        <ArrowLeft size={18} aria-hidden />
        Voltar à Área Admin
      </Link>
    </div>
  )
}

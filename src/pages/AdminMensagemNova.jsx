import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Mensagem from '@/components/Mensagem'
import { apiEnviar } from '@/lib/api'
import {
  buscarPorData,
  carregarMensagens,
  emBlocos,
  hojeNoMovimento,
  porExtenso,
  tagsEmUso,
} from '@/lib/mensagens'
import { useTitulo } from '@/hooks/useTitulo'

/**
 * Cadastro da Mensagem do Dia — Área Admin.
 * FR-9: publicar agora é o padrão, com o mínimo de passos; programar é opção.
 * FR-6: as tags já usadas são oferecidas para reaproveitamento, clicáveis.
 * FR-4: a prévia usa o componente real da página — quebras de linha e
 * citações aparecem exatamente como o site vai mostrar.
 */
export default function AdminMensagemNova({ token }) {
  useTitulo('Adicionar mensagem')
  const [data, setData] = useState(hojeNoMovimento)
  const [titulo, setTitulo] = useState('')
  const [corpo, setCorpo] = useState('')
  const [assinatura, setAssinatura] = useState('')
  const [proveniencia, setProveniencia] = useState('')
  const [canal, setCanal] = useState('')
  const [tags, setTags] = useState([])
  const [novaTag, setNovaTag] = useState('')
  const [momento, setMomento] = useState('agora')
  const [quando, setQuando] = useState('')
  const [erros, setErros] = useState({})
  const [salvando, setSalvando] = useState(false)
  const [salva, setSalva] = useState(null)

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
    const rolarAte = (topo) =>
      caixa.scrollTo({ top: Math.max(0, topo), behavior: 'smooth' })

    if (campoAtivo === 'proveniencia' || campoAtivo === 'canal') {
      const alvo = caixa.querySelector('footer')
      if (!alvo) return
      const fundo =
        alvo.getBoundingClientRect().bottom - caixa.getBoundingClientRect().top + caixa.scrollTop
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
    const linha = limpo
      .slice(0, Math.max(0, cursorCorpo - cortado))
      .split('\n').length - 1
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
    const ponto = r.top - caixa.getBoundingClientRect().top + caixa.scrollTop + fracao * r.height
    // Ponto do cursor no meio do painel: dá contexto acima e abaixo.
    rolarAte(ponto - caixa.clientHeight / 2)
  }, [campoAtivo, cursorCorpo, titulo, data, assinatura, corpo, proveniencia, canal])

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
    else if (buscarPorData(data))
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
      // Acervo em memória recarregado: publicada agora, ela já aparece na
      // home, no acervo e na busca. Programada fica invisível até a hora.
      await carregarMensagens()
      setSalva({
        data,
        titulo: titulo.trim(),
        agendada: momento === 'programar',
        quando,
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
        Adicionar mensagem do dia
      </h1>
      <p className="mt-2 text-tinta-suave">
        Cole ou escreva o texto e acompanhe na prévia como a página vai ficar.
      </p>

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
              className="h-14 w-full rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
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
              className="h-14 w-full rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
            />
            {erros.data && (
              <p className="mt-1.5 text-sm font-medium text-destructive">{erros.data}</p>
            )}
            {/* FR-3: o dia é o endereço permanente da mensagem. */}
            {data && (
              <p className="mt-1.5 text-sm text-tinta-suave">
                Endereço: <span className="font-medium text-tinta">/mensagem/{data}</span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="mensagem-assinatura" className="mb-1.5 block font-medium text-tinta">
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
              As quebras de linha ficam como no original. Linha inteira entre
              aspas vira citação destacada.
            </p>
            <textarea
              id="mensagem-corpo"
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
              Nota de proveniência <span className="font-normal text-tinta-suave">(opcional)</span>
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
              Declaração de canal <span className="font-normal text-tinta-suave">(opcional)</span>
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
              <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Tags já usadas">
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
                    className="h-14 w-full max-w-xs rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
                  />
                  <p className="mt-1.5 text-sm text-tinta-suave">
                    Horário do fuso do Movimento (Natal). Até lá, a mensagem
                    fica fora do site.
                  </p>
                  {erros.quando && (
                    <p className="mt-1.5 text-sm font-medium text-destructive">{erros.quando}</p>
                  )}
                </div>
              )}
            </div>
          </fieldset>

          {erros.api && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {erros.api}
            </p>
          )}

          <Button type="submit" disabled={salvando} className="min-h-12 px-6">
            {salvando
              ? 'Salvando…'
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
          <p className="text-sm font-semibold tracking-wide text-azul-escuro uppercase">Prévia</p>
          {temPrevia ? (
            <div className="mt-3">
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
    </>
  )
}

function Sucesso({ mensagem, aoRecomecar }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center gap-3">
        <Check size={28} aria-hidden className="shrink-0 text-azul" />
        <h1 className="font-leitura text-3xl font-bold text-tinta">
          {mensagem.agendada ? 'Mensagem programada' : 'Mensagem publicada'}
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
        <Button variant="outline" className="min-h-12 px-5" onClick={aoRecomecar}>
          Cadastrar outra
        </Button>
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

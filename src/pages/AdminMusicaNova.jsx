import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Copy, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Letra from '@/components/Letra'
import { buscarMusica, gerarIdMusica } from '@/lib/musicas'
import { useTitulo } from '@/hooks/useTitulo'

/**
 * Cadastro de Música — Área Admin, Fase 1 (sem backend).
 * "Salvar" gera o JSON no schema de src/data/musicas.json para o Construtor
 * colar no arquivo — exatamente o fluxo de carga da Fase 1 (PRD §10.0).
 * Quando houver backend, este mesmo formulário passa a salvar de verdade.
 * O formulário só pede o que o schema tem: título, autores (FR-13) e a letra
 * em seções estrofe/refrão com um verso por linha (FR-11, FR-14).
 */

let SEQ = 0
const novaSecao = (tipo) => ({ chave: ++SEQ, tipo, texto: '' })

export default function AdminMusicaNova() {
  useTitulo('Adicionar música')
  const [titulo, setTitulo] = useState('')
  const [autores, setAutores] = useState('')
  const [secoes, setSecoes] = useState(() => [novaSecao('estrofe')])
  const [erros, setErros] = useState({})
  const [salva, setSalva] = useState(null)

  const id = gerarIdMusica(titulo)
  const listaAutores = autores.split(',').map((a) => a.trim()).filter(Boolean)
  // Versos aparados, linhas vazias fora, seções sem conteúdo descartadas —
  // é o objeto final; a prévia usa o mesmo, então o que se vê é o que sai.
  const secoesLimpas = secoes
    .map((s) => ({
      tipo: s.tipo,
      linhas: s.texto.split('\n').map((l) => l.trim()).filter(Boolean),
    }))
    .filter((s) => s.linhas.length > 0)

  function alterarSecao(chave, mudanca) {
    setSecoes((atuais) => atuais.map((s) => (s.chave === chave ? { ...s, ...mudanca } : s)))
  }

  function salvar(e) {
    e.preventDefault()
    const encontrados = {}
    if (!titulo.trim()) encontrados.titulo = 'A música precisa de um título.'
    else if (buscarMusica(id)) encontrados.id = 'Já existe uma música nesse endereço. Mude o título.'
    if (secoesLimpas.length === 0) encontrados.letra = 'Escreva ao menos um verso da letra.'
    setErros(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setSalva({ id, titulo: titulo.trim(), autores: listaAutores, secoes: secoesLimpas })
    window.scrollTo(0, 0)
  }

  function recomecar() {
    setTitulo('')
    setAutores('')
    setSecoes([novaSecao('estrofe')])
    setErros({})
    setSalva(null)
  }

  if (salva) return <Sucesso musica={salva} aoRecomecar={recomecar} />

  return (
    <>
      <Link
        to="/admin"
        className="inline-flex min-h-12 items-center gap-1.5 text-azul underline underline-offset-2 hover:text-azul-escuro"
      >
        <ArrowLeft size={18} aria-hidden />
        Área Admin
      </Link>

      <h1 className="mt-2 font-leitura text-3xl font-bold text-tinta">Adicionar música</h1>
      <p className="mt-2 text-tinta-suave">
        Preencha e acompanhe na prévia como a página da música vai ficar.
      </p>

      <form onSubmit={salvar} noValidate className="mt-6 grid gap-8 lg:grid-cols-2">
        <div className="space-y-5">
          <div>
            <label htmlFor="musica-titulo" className="mb-1.5 block font-medium text-tinta">
              Título
            </label>
            <input
              id="musica-titulo"
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="h-14 w-full rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
            />
            {erros.titulo && (
              <p className="mt-1.5 text-sm font-medium text-destructive">{erros.titulo}</p>
            )}
            {/* FR-14: o endereço nasce do título e não muda depois. */}
            {id && (
              <p className="mt-1.5 text-sm text-tinta-suave">
                Endereço: <span className="font-medium text-tinta">/musica/{id}</span>
              </p>
            )}
            {erros.id && (
              <p className="mt-1.5 text-sm font-medium text-destructive">{erros.id}</p>
            )}
          </div>

          <div>
            <label htmlFor="musica-autores" className="mb-1.5 block font-medium text-tinta">
              Autores
            </label>
            <input
              id="musica-autores"
              type="text"
              value={autores}
              onChange={(e) => setAutores(e.target.value)}
              placeholder="Separe por vírgula, se houver mais de um"
              className="h-14 w-full rounded-lg border border-borda bg-papel px-4 text-tinta placeholder:text-tinta-suave focus:border-azul"
            />
            {/* FR-13: desconhecida é dita, não escondida. */}
            <p className="mt-1.5 text-sm text-tinta-suave">
              Sem autores, a página mostra “Autoria desconhecida”.
            </p>
          </div>

          <div>
            <p className="font-medium text-tinta">Letra</p>
            <p className="mt-1 text-sm text-tinta-suave">
              Um verso por linha. Estrofes e refrões são blocos separados.
            </p>
            {erros.letra && (
              <p className="mt-1.5 text-sm font-medium text-destructive">{erros.letra}</p>
            )}

            <div className="mt-3 space-y-4">
              {secoes.map((s, i) => (
                <div key={s.chave} className="rounded-lg border border-borda bg-papel-suave p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-azul-escuro">
                      {s.tipo === 'refrao' ? 'Refrão' : 'Estrofe'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-12 px-4"
                        onClick={() =>
                          alterarSecao(s.chave, { tipo: s.tipo === 'refrao' ? 'estrofe' : 'refrao' })
                        }
                      >
                        Virar {s.tipo === 'refrao' ? 'estrofe' : 'refrão'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="size-12 [&_svg]:size-5"
                        aria-label={`Remover ${s.tipo === 'refrao' ? 'refrão' : 'estrofe'} ${i + 1}`}
                        onClick={() => setSecoes((atuais) => atuais.filter((x) => x.chave !== s.chave))}
                      >
                        <X aria-hidden />
                      </Button>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={s.texto}
                    onChange={(e) => alterarSecao(s.chave, { texto: e.target.value })}
                    aria-label={`Versos do bloco ${i + 1}`}
                    placeholder={'Primeiro verso\nSegundo verso…'}
                    className="mt-3 w-full rounded-lg border border-borda bg-papel px-4 py-3 leading-relaxed text-tinta placeholder:text-tinta-suave focus:border-azul"
                  />
                </div>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                className="min-h-12 gap-2 px-5"
                onClick={() => setSecoes((atuais) => [...atuais, novaSecao('estrofe')])}
              >
                <Plus aria-hidden />
                Estrofe
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="min-h-12 gap-2 px-5"
                onClick={() => setSecoes((atuais) => [...atuais, novaSecao('refrao')])}
              >
                <Plus aria-hidden />
                Refrão
              </Button>
            </div>
          </div>

          <Button type="submit" className="min-h-12 px-6">
            Salvar música
          </Button>
        </div>

        {/* Prévia viva, com o componente real da página da Música. */}
        <div className="rounded-lg border border-borda bg-papel-suave p-5 lg:p-6">
          <p className="text-sm font-semibold tracking-wide text-azul-escuro uppercase">Prévia</p>
          <h2 className="mt-3 font-leitura text-2xl font-bold text-tinta">
            {titulo.trim() || 'Sem título'}
          </h2>
          <p className="mt-1 text-tinta-suave">
            {listaAutores.length > 0 ? listaAutores.join(', ') : 'Autoria desconhecida'}
          </p>
          {secoesLimpas.length > 0 ? (
            <Letra secoes={secoesLimpas} className="texto-mensagem mt-2" />
          ) : (
            <p className="mt-4 text-sm text-tinta-suave">
              A letra aparece aqui conforme você escreve.
            </p>
          )}
        </div>
      </form>
    </>
  )
}

/**
 * Fase 1: o resultado é o JSON pronto para o Construtor colar em
 * src/data/musicas.json — a carga por arquivo do PRD §10.0.
 */
function Sucesso({ musica, aoRecomecar }) {
  const [copiado, setCopiado] = useState(false)
  const json = JSON.stringify(musica, null, 2)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(json)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      // Sem clipboard (contexto inseguro): o bloco está na tela para seleção manual.
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-leitura text-3xl font-bold text-tinta">Música pronta</h1>
      <p className="mt-2 text-tinta-suave">
        <strong className="font-semibold text-tinta">{musica.titulo}</strong> foi montada no
        formato do site. Cole o bloco abaixo dentro da lista em{' '}
        <code className="rounded bg-papel-suave px-1.5 py-0.5 text-sm">src/data/musicas.json</code>{' '}
        (com uma vírgula após o bloco anterior). Quando o backend existir, este passo some: o
        botão salvará direto no site.
      </p>

      <pre className="mt-5 overflow-x-auto rounded-lg border border-borda bg-papel-suave p-4 text-sm leading-relaxed text-tinta">
        {json}
      </pre>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button className="min-h-12 gap-2 px-5" onClick={copiar}>
          {copiado ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copiado ? 'Copiado!' : 'Copiar JSON'}
        </Button>
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

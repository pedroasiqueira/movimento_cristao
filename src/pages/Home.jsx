import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, CalendarDays, Music } from 'lucide-react'
import BotaoCompartilhar from '@/components/BotaoCompartilhar'
import TextoFormatado from '@/components/TextoFormatado'
import { acervo, destaqueDaHome, porExtenso } from '@/lib/mensagens'
import { proximosEncontros } from '@/lib/encontros'
import { useTitulo } from '@/hooks/useTitulo'
import sobre from '@/data/sobre.json'

/**
 * Início — a home como pequena landing, por decisão do Pedro (17/08/2026):
 * a Mensagem do Dia abre a página com ~40% do texto e um botão claro para a
 * página completa (FR-1, consequência revista), seguida do próximo Encontro,
 * dos atalhos para Acervo e Músicas, e de uma apresentação curta do Movimento.
 * Contida de propósito: SM-C3 lembra que cada elemento a mais custa para o
 * público 60+.
 */
export default function Home() {
  useTitulo(null)
  const { mensagem, situacao, diasAtras } = destaqueDaHome()

  if (!mensagem) {
    return <p className="text-tinta-suave">Ainda não há mensagens publicadas.</p>
  }

  return (
    <>
      {/* A leitura mora numa coluna de medida confortável; os atalhos usam a largura toda. */}
      <div className="mx-auto max-w-3xl">
        <Aviso situacao={situacao} data={mensagem.data} diasAtras={diasAtras} />
        <PreviaDaMensagem mensagem={mensagem} />
      </div>
      <ProximoEncontro />
      <Atalhos />
      <SobreResumo />
    </>
  )
}

/*
  FR-2: quando não há Mensagem do dia corrente, a home nunca finge que a
  anterior é de hoje. Domingo não é atraso: a Mensagem de domingo vem em áudio.
*/
function Aviso({ situacao, data, diasAtras }) {
  if (situacao === 'hoje') return null

  if (situacao === 'recente') {
    return (
      <p className="mb-6 rounded-lg bg-papel-suave px-4 py-3 text-sm text-tinta-suave">
        A mensagem de hoje ainda não foi publicada. Esta é a mais recente, de{' '}
        <strong className="font-semibold text-tinta">{porExtenso(data)}</strong>.
      </p>
    )
  }

  return (
    <div className="mb-6 rounded-lg border border-borda bg-papel-suave px-4 py-3">
      <p className="text-sm font-semibold text-tinta">Última mensagem publicada</p>
      <p className="mt-1 text-sm text-tinta-suave">
        Publicada há {diasAtras} dias, em {porExtenso(data)}. Enquanto isso, o{' '}
        <Link to="/acervo" className="font-medium text-azul underline underline-offset-2">
          acervo completo
        </Link>{' '}
        continua disponível.
      </p>
    </div>
  )
}

/**
 * Corta o corpo em ~40% das palavras. O corte atravessa a linha quando
 * preciso: as citações do corpus são uma linha única e longa, e cortar só
 * em fim de linha fazia a prévia chegar a 75% do texto. Marcas do WhatsApp
 * abertas no ponto do corte são fechadas para não sobrar `*`/`_` solto.
 */
function previa(corpo, fracao = 0.4) {
  const totalPalavras = corpo.split(/\s+/).filter(Boolean).length
  const alvo = Math.max(60, Math.round(totalPalavras * fracao))
  const saida = []
  let contadas = 0
  for (const linha of corpo.split('\n')) {
    const palavras = linha.split(/\s+/).filter(Boolean)
    if (contadas + palavras.length <= alvo) {
      saida.push(linha)
      contadas += palavras.length
      if (contadas === alvo) break
    } else {
      let parcial = palavras.slice(0, alvo - contadas).join(' ')
      for (const marca of ['*', '_']) {
        if ((parcial.split(marca).length - 1) % 2 === 1) parcial += marca
      }
      saida.push(parcial + '…')
      break
    }
  }
  return saida.join('\n')
}

function PreviaDaMensagem({ mensagem }) {
  const { titulo, data, corpo, assinatura } = mensagem

  return (
    <article>
      <header className="mb-5">
        <h1 className="text-balance font-leitura text-2xl leading-tight font-bold text-tinta sm:text-3xl">
          {titulo}
        </h1>
        <p className="mt-2 text-sm text-tinta-suave">
          <time dateTime={data}>{porExtenso(data)}</time>
        </p>
        {assinatura && <p className="mt-1 text-sm text-tinta-suave">{assinatura}</p>}
      </header>

      {/* ~40% do texto, esvanecendo — a leitura inteira mora na página própria (FR-3). */}
      <div className="previa-fade texto-mensagem">
        <TextoFormatado texto={previa(corpo)} />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          to={`/mensagem/${data}`}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-azul px-5 font-medium text-white hover:bg-azul-escuro"
        >
          Ler a mensagem completa
          <ArrowRight size={20} aria-hidden />
        </Link>
        {/* O convite vira um link — SM-2. */}
        <BotaoCompartilhar
          titulo={titulo}
          caminho={`/mensagem/${data}`}
          rotulo="Compartilhar"
        />
      </div>
    </article>
  )
}

function ProximoEncontro() {
  const proximo = proximosEncontros(4).find((e) => !e.cancelado)
  if (!proximo) return null

  return (
    <Link
      to="/encontros"
      className="mt-10 flex items-center gap-3 rounded-lg border border-borda bg-azul-claro/50 px-5 py-4 hover:border-azul hover:bg-azul-claro"
    >
      <CalendarDays size={24} aria-hidden className="shrink-0 text-azul" />
      <span>
        <span className="block text-sm text-tinta-suave">Próximo encontro</span>
        <span className="block font-medium text-tinta">{porExtenso(proximo.data)}</span>
      </span>
      <ArrowRight size={20} aria-hidden className="ml-auto shrink-0 text-azul" />
    </Link>
  )
}

function Atalhos() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Link
        to="/acervo"
        className="rounded-lg border border-borda px-5 py-5 hover:border-azul hover:bg-azul-claro"
      >
        <BookOpen size={24} aria-hidden className="text-azul" />
        <p className="mt-2 font-semibold text-tinta">Acervo de mensagens</p>
        <p className="mt-1 text-sm text-tinta-suave">
          {acervo.length} mensagens guardadas — encontre por data, palavra ou assunto.
        </p>
      </Link>

      <Link
        to="/musicas"
        className="rounded-lg border border-borda px-5 py-5 hover:border-azul hover:bg-azul-claro"
      >
        <Music size={24} aria-hidden className="text-azul" />
        <p className="mt-2 font-semibold text-tinta">Músicas</p>
        <p className="mt-1 text-sm text-tinta-suave">
          As letras das músicas cantadas nos encontros, para acompanhar e reler.
        </p>
      </Link>
    </div>
  )
}

function SobreResumo() {
  return (
    <div className="mt-10 border-t border-borda pt-8">
      <h2 className="text-lg font-semibold text-azul-escuro">O Movimento</h2>
      <p className="texto-mensagem mt-3">{sobre.paragrafos[0]}</p>
      <Link
        to="/sobre"
        className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-lg border-2 border-azul px-5 font-medium text-azul hover:bg-azul hover:text-white"
      >
        Conhecer o Movimento
        <ArrowRight size={20} aria-hidden />
      </Link>
    </div>
  )
}

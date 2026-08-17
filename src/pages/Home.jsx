import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Mensagem from '@/components/Mensagem'
import BotaoCompartilhar from '@/components/BotaoCompartilhar'
import { destaqueDaHome, porExtenso, tagsEmUso } from '@/lib/mensagens'
import { useTitulo } from '@/hooks/useTitulo'

/**
 * A home abre com a Mensagem do Dia em destaque, texto integral, data visível —
 * FR-1. A mesma tela serve a Membro e a Visitante: a aposta do PRD é que a
 * melhor apresentação do Movimento é a Mensagem de hoje, e não uma página
 * falando sobre si.
 */
export default function Home() {
  useTitulo(null)
  const { mensagem, situacao, diasAtras } = destaqueDaHome()

  if (!mensagem) {
    return (
      <p className="text-tinta-suave">Ainda não há mensagens publicadas.</p>
    )
  }

  return (
    <>
      <Aviso situacao={situacao} data={mensagem.data} diasAtras={diasAtras} />
      <Mensagem mensagem={mensagem} />
      <Rodape mensagem={mensagem} />
    </>
  )
}

/*
  FR-2: quando não há Mensagem do dia corrente, a home nunca finge que a
  anterior é de hoje. Até dois dias, o destaque segue normal — a data real já
  está visível junto ao título. Acima disso, o enquadramento muda, para o site
  não passar conteúdo antigo como se fosse do dia.

  Domingo não é atraso: a Mensagem de domingo vem em áudio, e a de sábado
  permanece em destaque.
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

function Rodape({ mensagem }) {
  const total = tagsEmUso().reduce((s, t) => s + t.total, 0)

  return (
    <div className="mt-10 border-t border-borda pt-6">
      {mensagem.tags?.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm text-tinta-suave">Assunto:</span>
          {mensagem.tags.map((t) => (
            <Link
              key={t}
              to={`/acervo?tag=${encodeURIComponent(t)}`}
              className="flex min-h-12 items-center rounded-lg bg-azul-claro px-4 text-azul-escuro hover:bg-azul hover:text-white"
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        {/* O convite vira um link — SM-2. A folha nativa do celular cai no WhatsApp. */}
        <BotaoCompartilhar
          titulo={mensagem.titulo}
          caminho={`/mensagem/${mensagem.data}`}
          rotulo="Compartilhar esta mensagem"
        />
        <Link
          to="/acervo"
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-azul px-5 font-medium text-azul hover:bg-azul hover:text-white"
        >
          Ver todas as mensagens
          <ArrowRight size={20} aria-hidden />
        </Link>
      </div>
      <p className="mt-3 text-sm text-tinta-suave">
        {total > 0 && 'O acervo reúne as mensagens publicadas, organizadas por data e por assunto.'}
      </p>
    </div>
  )
}

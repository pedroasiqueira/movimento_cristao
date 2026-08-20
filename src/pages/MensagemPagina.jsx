import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Pencil } from 'lucide-react'
import Mensagem from '@/components/Mensagem'
import BotaoCompartilhar from '@/components/BotaoCompartilhar'
import BotaoExcluir from '@/components/BotaoExcluir'
import { excluirMensagem, garantirIndice, porExtenso, vizinhas, porNumero } from '@/lib/mensagens'
import { useTitulo } from '@/hooks/useTitulo'
import { useMensagem } from '@/hooks/useMensagens'

/**
 * Página própria de cada Mensagem — FR-3: endereço estável /mensagem/AAAA-MM-DD,
 * a Mensagem inteira sem passar pela home. Anterior e seguinte — FR-5.
 * Com o administrador identificado, a página oferece o atalho de edição
 * (FR-20) — a proteção real é a API exigir o token.
 *
 * O tamanho da letra não é assunto desta página: quem cuida disso é a escada
 * do index.css, movida pelo controle único do cabeçalho. Até 20/08/2026 havia
 * aqui um ajuste local que reiniciava a cada mensagem aberta.
 *
 * O texto inteiro só desce quando alguém abre esta página (memória → cache
 * local → API → reserva das recentes): a listagem do site circula sem corpo.
 */
export default function MensagemPagina({ admin, token }) {
  const { data } = useParams()
  const navigate = useNavigate()
  const { carregando, mensagem, situacao } = useMensagem(data ?? '')
  useTitulo(mensagem?.titulo)

  // As Mensagens anterior e seguinte (FR-5) saem do índice, que não vem mais
  // no boot. Elas ficam abaixo da leitura inteira: pedir aqui não atrasa nada
  // do que importa, e a página repinta sozinha quando o índice chega
  // (useMensagem assina a store).
  useEffect(() => {
    void garantirIndice()
  }, [])

  if (!mensagem) {
    if (carregando) {
      return (
        <div aria-hidden className="mx-auto min-h-[30rem] max-w-3xl animate-pulse pt-16">
          <div className="h-8 w-3/4 rounded bg-papel-suave" />
          <div className="mt-3 h-4 w-1/2 rounded bg-papel-suave" />
          <div className="mt-8 space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-4 rounded bg-papel-suave" />
            ))}
          </div>
        </div>
      )
    }

    if (situacao === 'indisponivel') {
      return (
        <div className="rounded-lg border border-borda px-6 py-10 text-center">
          <h1 className="font-leitura text-2xl font-bold text-tinta">
            Sem conexão para carregar a mensagem
          </h1>
          <p className="mt-2 text-tinta-suave">
            A mensagem existe, mas não foi possível baixá-la agora. Verifique a
            conexão e tente de novo.
          </p>
          <Link
            to="/acervo"
            className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-azul px-5 font-medium text-white hover:bg-azul-escuro"
          >
            Ver o acervo completo
          </Link>
        </div>
      )
    }

    return (
      <div className="rounded-lg border border-borda px-6 py-10 text-center">
        <h1 className="font-leitura text-2xl font-bold text-tinta">
          Mensagem não encontrada
        </h1>
        <p className="mt-2 text-tinta-suave">
          Não há mensagem publicada nesse endereço.
        </p>
        <Link
          to="/acervo"
          className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-azul px-5 font-medium text-white hover:bg-azul-escuro"
        >
          Ver o acervo completo
        </Link>
      </div>
    )
  }

  const { anterior, seguinte } = vizinhas(mensagem.data)

  return (
    // Coluna de leitura: a folha é larga (desktop), a medida do texto não —
    // linha acima de ~80 caracteres cansa, e cansa mais aos 60+.
    <div className="mx-auto max-w-3xl">
      <Mensagem mensagem={mensagem} />

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-borda pt-6">
        <BotaoCompartilhar titulo={mensagem.titulo} caminho={`/mensagem/${mensagem.data}`} />
        {admin && (
          <>
            <Link
              to={`/admin/mensagem/editar/${mensagem.data}`}
              className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-borda px-5 font-medium text-tinta hover:border-azul hover:bg-azul-claro"
            >
              <Pencil size={18} aria-hidden />
              Editar
            </Link>
            {/* `replace`: o endereço acabou de deixar de existir, e o botão
                Voltar não pode trazer a pessoa de volta a uma página morta. */}
            <BotaoExcluir
              oQue="mensagem"
              titulo={mensagem.titulo}
              detalhe={porExtenso(mensagem.data)}
              aoExcluir={() => excluirMensagem(mensagem.data, token)}
              aoConcluir={() => navigate('/acervo', { replace: true })}
            />
          </>
        )}
        {mensagem.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Anterior e seguinte — FR-5 */}
      <nav aria-label="Mensagens vizinhas" className="mt-6 grid gap-3 sm:grid-cols-2">
        {anterior ? (
          <Link
            to={`/mensagem/${anterior.data}`}
            className="rounded-lg border border-borda px-4 py-4 hover:border-azul hover:bg-azul-claro"
          >
            <span className="flex items-center gap-1.5 text-sm text-tinta-suave">
              <ArrowLeft size={18} aria-hidden /> Anterior · {porNumero(anterior.data)}
            </span>
            <span className="mt-1 block font-medium text-tinta">{anterior.titulo}</span>
          </Link>
        ) : (
          <span aria-hidden />
        )}
        {seguinte && (
          <Link
            to={`/mensagem/${seguinte.data}`}
            className="rounded-lg border border-borda px-4 py-4 text-right hover:border-azul hover:bg-azul-claro"
          >
            <span className="flex items-center justify-end gap-1.5 text-sm text-tinta-suave">
              Seguinte · {porNumero(seguinte.data)} <ArrowRight size={18} aria-hidden />
            </span>
            <span className="mt-1 block font-medium text-tinta">{seguinte.titulo}</span>
          </Link>
        )}
      </nav>
    </div>
  )
}

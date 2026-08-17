import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import Mensagem from '@/components/Mensagem'
import BotaoCompartilhar from '@/components/BotaoCompartilhar'
import AjusteLeitura from '@/components/AjusteLeitura'
import { buscarPorData, vizinhas, porNumero } from '@/lib/mensagens'
import { useTitulo } from '@/hooks/useTitulo'

/**
 * Página própria de cada Mensagem — FR-3: endereço estável /mensagem/AAAA-MM-DD,
 * a Mensagem inteira sem passar pela home. Anterior e seguinte — FR-5.
 * Ajuste local de leitura — FR-18.
 */
export default function MensagemPagina() {
  const { data } = useParams()
  const mensagem = buscarPorData(data ?? '')
  const [leitura, setLeitura] = useState({ passo: 0, mult: 1 })
  useTitulo(mensagem?.titulo)

  if (!mensagem) {
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
      <AjusteLeitura
        passo={leitura.passo}
        aoMudar={(passo, mult) => setLeitura({ passo, mult })}
      />

      {/* FR-18: multiplicador local sobre a escala global — o corpo herda em `em` */}
      <div style={{ fontSize: `${leitura.mult}em` }}>
        <Mensagem mensagem={mensagem} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-borda pt-6">
        <BotaoCompartilhar titulo={mensagem.titulo} caminho={`/mensagem/${mensagem.data}`} />
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

import { CalendarDays, MapPin, Video } from 'lucide-react'
import { proximosEncontros } from '@/lib/encontros'
import { porExtenso } from '@/lib/mensagens'
import { HORARIO_ENCONTROS, ENDERECO_ENCONTROS } from '@/config'
import Contato from '@/components/Contato'
import { useTitulo } from '@/hooks/useTitulo'
import { useMontado } from '@/hooks/useMontado'

/**
 * Encontros — FR-15. Publica o que já se sabe (dias e modalidades) e declara
 * o que falta confirmar, em vez de uma tela "em construção" — o anti-padrão
 * que lê como site abandonado. Nenhum link de acesso aparece aqui: decisão
 * de segurança do PRD §8; o link continua indo pelo WhatsApp.
 */
export default function Encontros() {
  useTitulo('Encontros')
  // A lista sai do relógio de quem lê, não do relógio do build — ver
  // useMontado. O resto da página é fixo e vem pronto no HTML.
  const montado = useMontado()
  const proximos = montado ? proximosEncontros(4) : []

  return (
    <>
      <h1 className="font-leitura text-3xl font-bold text-tinta">Encontros</h1>
      <p className="mt-2 text-tinta-suave">
        O Movimento se reúne duas vezes por semana, de forma presencial e online.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-borda px-5 py-5">
          <p className="flex items-center gap-2 font-semibold text-azul-escuro">
            <CalendarDays size={22} aria-hidden />
            Quartas-feiras e sábados
          </p>
          <p className="mt-2 text-tinta-suave">
            {HORARIO_ENCONTROS ?? 'Horário em confirmação — será publicado aqui.'}
          </p>
        </div>

        <div className="rounded-lg border border-borda px-5 py-5">
          <p className="flex items-center gap-2 font-semibold text-azul-escuro">
            <MapPin size={22} aria-hidden />
            Presencial
          </p>
          <p className="mt-2 text-tinta-suave">
            {ENDERECO_ENCONTROS ?? 'Endereço em confirmação — será publicado aqui.'}
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-borda bg-papel-suave px-5 py-5">
        <p className="flex items-center gap-2 font-semibold text-azul-escuro">
          <Video size={22} aria-hidden />
          Online
        </p>
        <p className="mt-2 text-tinta-suave">
          O encontro também acontece online. O link de acesso é enviado pelo
          WhatsApp aos participantes — ele não fica publicado no site.
        </p>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-azul-escuro">Próximos encontros</h2>
      <ul className="mt-3 space-y-2">
        {/* Altura reservada: são sempre quatro, e sem isto o "Quer participar?"
            saltaria quando as datas entrassem. */}
        {!montado &&
          [...Array(4)].map((_, i) => (
            <li key={i} aria-hidden className="h-[3.25rem] animate-pulse rounded-lg bg-papel-suave" />
          ))}
        {proximos.map(({ data, cancelado }) => (
          <li
            key={data}
            className={
              'rounded-lg border px-4 py-3 ' +
              (cancelado ? 'border-borda bg-papel-suave' : 'border-borda')
            }
          >
            <span className={cancelado ? 'text-tinta-suave line-through' : 'text-tinta'}>
              {porExtenso(data)}
            </span>
            {cancelado && (
              <span className="ml-2 font-medium text-tinta-suave">— não haverá encontro</span>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-azul-escuro">Quer participar?</h2>
        <Contato />
      </div>
    </>
  )
}

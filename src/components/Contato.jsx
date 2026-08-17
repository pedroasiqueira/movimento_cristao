import { MessageCircle } from 'lucide-react'
import { WHATSAPP_CONTATO } from '@/config'

/**
 * Caminho de contato — FR-19. Sem formulário, sem cadastro, sem coleta de
 * dado algum: um link direto para o canal que o Movimento já usa. Convicção
 * religiosa é dado sensível na LGPD (PRD §8); a ausência de formulário é
 * decisão, não falta.
 *
 * Enquanto o número não for definido (PRD §12, questão 9), o bloco declara
 * a pendência em vez de exibir um botão que não leva a lugar nenhum.
 */
export default function Contato() {
  if (!WHATSAPP_CONTATO) {
    return (
      <div className="rounded-lg border border-dashed border-borda px-4 py-4">
        <p className="font-medium text-tinta">Quer falar com alguém do Movimento?</p>
        <p className="mt-1 text-sm text-tinta-suave">
          O canal de contato por WhatsApp está sendo definido e aparecerá aqui.
        </p>
      </div>
    )
  }

  return (
    <a
      href={`https://wa.me/${WHATSAPP_CONTATO}`}
      className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-azul px-5 font-medium text-white hover:bg-azul-escuro"
    >
      <MessageCircle size={22} aria-hidden />
      Falar com alguém pelo WhatsApp
    </a>
  )
}

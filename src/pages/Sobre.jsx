import Contato from '@/components/Contato'
import { useTitulo } from '@/hooks/useTitulo'

/**
 * Sobre — FR-16. O texto abaixo é RASCUNHO deliberado: o Publicador nunca
 * escreveu essa apresentação, e este espaço existe para ele ver a estrutura
 * e escrever a versão dele (PRD §4.4). Tudo que está aqui é factual — nada
 * de texto institucional genérico. O site não deve ir ao ar com este rascunho
 * sem essa conversa — recomendação registrada no PRD, a confirmar.
 *
 * Por decisão registrada (§9), esta página não explica a forma de transmissão
 * das Mensagens. A Mensagem fala por si.
 */
export default function Sobre() {
  useTitulo('Sobre')

  return (
    <>
      <h1 className="font-leitura text-3xl font-bold text-tinta">Sobre o Movimento</h1>

      <div className="mt-4 rounded-lg border border-dashed border-borda bg-papel-suave px-4 py-3 text-sm text-tinta-suave">
        Texto provisório — a apresentação definitiva será escrita pelo Movimento.
      </div>

      <div className="texto-mensagem mt-6 space-y-4">
        <p>
          A Arca da Sagrada Aliança – Movimento Cristão é formada por pessoas que
          se reúnem para ler a Bíblia, conversar sobre os ensinamentos de Jesus e
          se aprofundar na vida dele — e, com isso, serem pessoas sempre melhores.
        </p>
        <p>
          O Movimento existe há mais de trinta anos, em Natal, no Rio Grande do
          Norte. Os encontros acontecem duas vezes por semana, às quartas-feiras
          e aos sábados, de forma presencial e também online.
        </p>
        <p>
          Todos os dias, uma mensagem de reflexão é enviada aos participantes pelo
          WhatsApp — e publicada aqui no site, onde fica guardada para ser lida a
          qualquer momento. As músicas cantadas nos encontros, muitas delas
          compostas por pessoas do próprio Movimento, também estão sendo reunidas
          neste site.
        </p>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-azul-escuro">Fale com o Movimento</h2>
        <Contato />
      </div>
    </>
  )
}

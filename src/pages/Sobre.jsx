import Contato from '@/components/Contato'
import { useTitulo } from '@/hooks/useTitulo'
import sobre from '@/data/sobre.json'

/**
 * Sobre — FR-16. O conteúdo vive em src/data/sobre.json, não no código da
 * interface: quando o Publicador escrever a versão dele (PRD §4.4), troca-se
 * o texto lá — e a flag `provisorio` some junto. Enquanto ela for true, a
 * página declara o rascunho. O site não deve ir ao ar com este rascunho —
 * recomendação registrada no PRD, a confirmar.
 *
 * Por decisão registrada (§9), esta página não explica a forma de transmissão
 * das Mensagens. A Mensagem fala por si.
 */
export default function Sobre() {
  useTitulo('Sobre')

  return (
    <>
      <h1 className="font-leitura text-3xl font-bold text-tinta">Sobre o Movimento</h1>

      {sobre.provisorio && (
        <div className="mt-4 rounded-lg border border-dashed border-borda bg-papel-suave px-4 py-3 text-sm text-tinta-suave">
          Texto provisório — a apresentação definitiva será escrita pelo Movimento.
        </div>
      )}

      <div className="texto-mensagem mt-6 max-w-3xl space-y-4">
        {sobre.paragrafos.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-semibold text-azul-escuro">Fale com o Movimento</h2>
        <Contato />
      </div>
    </>
  )
}

import { useEffect, useId, useRef, useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Excluir conteúdo — o botão e a confirmação, num componente só, usado tanto
 * pela Mensagem quanto pela Música (o pedido é o mesmo nos dois; duplicá-lo
 * seria duas telas para manter em sincronia).
 *
 * Exclusão é definitiva: o endereço deixa de existir e um link já colado no
 * WhatsApp quebra. Como não há como desfazer no banco, o guarda-corpo é este
 * modal — daí ele nomear o item que vai sair, avisar em voz alta que a ação é
 * permanente e deixar Cancelar e Excluir com pesos visuais opostos.
 *
 * Só o administrador identificado o renderiza (ver MensagemPagina/MusicaPagina),
 * então ele nunca aparece no HTML pré-renderizado.
 *
 * Contrato de diálogo igual ao do Modo canto (MusicaPagina) e ao do FiltroMes:
 * role="dialog" + aria-modal, Escape fecha, o foco volta ao gatilho.
 *
 * Props:
 *   oQue      'mensagem' | 'música' — as duas são femininas, então o texto
 *             corre igual nos dois casos.
 *   titulo    o título do item, para não restar dúvida sobre qual sai.
 *   detalhe   a segunda linha de identificação (a data por extenso, os autores).
 *   aoExcluir função assíncrona que faz a exclusão; lança em caso de falha.
 *   aoConcluir chamado só depois do sucesso — a página atual deixou de existir.
 */
export default function BotaoExcluir({ oQue, titulo, detalhe, aoExcluir, aoConcluir }) {
  const idTitulo = useId()
  const gatilho = useRef(null)
  const cancelar = useRef(null)
  const confirmar = useRef(null)
  const [aberto, setAberto] = useState(false)
  const [excluindo, setExcluindo] = useState(false)
  const [erro, setErro] = useState(null)

  function fechar() {
    // Fechar no meio do envio deixaria a pessoa sem saber o que aconteceu.
    if (excluindo) return
    setAberto(false)
    setErro(null)
    gatilho.current?.focus()
  }

  // Abre com o foco no Cancelar, e não no Excluir: um Enter apressado (a
  // tecla ainda pressionada do clique anterior) não pode apagar nada.
  useEffect(() => {
    if (!aberto) return undefined
    cancelar.current?.focus()
    // A página atrás não rola enquanto o modal está aberto — no celular, sem
    // isto, o dedo passa pelo cartão e rola a mensagem por baixo.
    const rolagemAntes = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = rolagemAntes
    }
  }, [aberto])

  // Escape fecha e devolve o foco — mesmo contrato do FiltroMes. Fora do ar
  // durante o envio, pela mesma razão de fechar().
  useEffect(() => {
    if (!aberto || excluindo) return undefined
    const aoTeclar = (e) => {
      if (e.key !== 'Escape') return
      setAberto(false)
      setErro(null)
      gatilho.current?.focus()
    }
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aberto, excluindo])

  // Prisão de foco de dois nós: o modal só tem Cancelar e Excluir, então
  // circular entre eles é todo o trabalho — sem isto o Tab escaparia para os
  // links da página por baixo, que estão inertes para o olho e não para o teclado.
  function circularFoco(e) {
    if (e.key !== 'Tab') return
    const alvo = e.shiftKey
      ? document.activeElement === cancelar.current && confirmar.current
      : document.activeElement === confirmar.current && cancelar.current
    if (!alvo) return
    e.preventDefault()
    alvo.focus()
  }

  async function excluir() {
    setExcluindo(true)
    setErro(null)
    try {
      await aoExcluir()
      aoConcluir?.()
    } catch (falha) {
      // O modal fica aberto: a pessoa tenta de novo sem reabrir nada, e o item
      // continua na tela porque nada foi apagado.
      setErro(
        falha.status === 401
          ? 'A sessão expirou. Saia e entre de novo na Área Admin.'
          : `Não foi possível excluir: ${falha.message}`,
      )
      setExcluindo(false)
    }
  }

  return (
    <>
      {/* O gatilho é neutro: ele ainda não destrói nada. O vermelho fica
          guardado para o botão que de fato apaga, dentro do modal. */}
      <Button
        ref={gatilho}
        variant="outline"
        className="min-h-12 gap-2 px-5"
        onClick={() => setAberto(true)}
      >
        <Trash2 aria-hidden />
        Excluir
      </Button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-tinta/50 p-4"
          onClick={fechar}
          onKeyDown={circularFoco}
        >
          {/* O clique dentro do cartão não fecha — só o fundo fecha. */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={idTitulo}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl border border-borda bg-papel p-6 shadow-lg sm:p-8"
          >
            <h2
              id={idTitulo}
              className="font-leitura text-2xl font-bold text-tinta"
            >
              Excluir {oQue}?
            </h2>

            <div className="mt-4 rounded-lg bg-papel-suave px-4 py-3">
              <p className="font-medium text-tinta">{titulo}</p>
              {detalhe && <p className="mt-0.5 text-tinta-suave">{detalhe}</p>}
            </div>

            <p className="mt-4 flex gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 font-medium text-destructive">
              <AlertTriangle size={20} aria-hidden className="mt-0.5 shrink-0" />
              <span>
                A exclusão é permanente e não poderá ser desfeita. O endereço
                desta {oQue} deixa de funcionar, inclusive para quem já o
                recebeu.
              </span>
            </p>

            {erro && (
              <p role="alert" className="mt-4 font-medium text-destructive">
                {erro}
              </p>
            )}

            {/* Cancelar primeiro e destacado do outro: as duas ações não se
                parecem, não ficam coladas e a destrutiva não é a mais fácil
                de acertar com o polegar. Empilhadas no celular. */}
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button
                ref={cancelar}
                variant="outline"
                className="min-h-12 px-6"
                onClick={fechar}
                disabled={excluindo}
              >
                Cancelar
              </Button>
              <Button
                ref={confirmar}
                variant="destructive"
                className="min-h-12 gap-2 px-6"
                onClick={excluir}
                disabled={excluindo}
              >
                <Trash2 aria-hidden />
                {excluindo ? 'Excluindo…' : 'Excluir permanentemente'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Maximize2, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import BotaoCompartilhar from '@/components/BotaoCompartilhar'
import Letra from '@/components/Letra'
import { buscarMusica, caminhoMusica, garantirMusicas, slugDoTitulo } from '@/lib/musicas'
import { useTitulo } from '@/hooks/useTitulo'
import { useDadosVivos } from '@/hooks/useMensagens'

/**
 * Página de uma Música — FR-11 (versos e estrofes preservados, refrão
 * distinguível), FR-13 (autoria; desconhecida é dita, não escondida),
 * FR-14 (endereço próprio) e FR-12 (modo de visualização ampliada).
 * Com o administrador identificado, a página oferece o atalho de edição —
 * a proteção real é a API exigir o token.
 */
export default function MusicaPagina({ admin }) {
  const { id, slug } = useParams()
  useDadosVivos() // re-render quando as músicas do banco chegarem
  // Antes do return antecipado de "não encontrada": um endereço de música
  // aberto direto precisa pedir o repertório, que não vem mais no boot.
  useEffect(() => {
    void garantirMusicas()
  }, [])
  const musica = buscarMusica(id ?? '')
  const [modoCanto, setModoCanto] = useState(false)
  useTitulo(musica?.titulo)

  if (!musica) {
    return (
      <div className="rounded-lg border border-borda px-6 py-10 text-center">
        <h1 className="font-leitura text-2xl font-bold text-tinta">Música não encontrada</h1>
        <Link
          to="/musicas"
          className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-azul px-5 font-medium text-white hover:bg-azul-escuro"
        >
          Ver todas as músicas
        </Link>
      </div>
    )
  }

  // FR-21: despublicada sai da listagem e da busca, mas o endereço continua
  // respondendo — um link enviado no WhatsApp anos atrás não pode quebrar.
  if (musica.despublicada) {
    return (
      <div className="rounded-lg border border-borda px-6 py-10 text-center">
        <h1 className="font-leitura text-2xl font-bold text-tinta">{musica.titulo}</h1>
        <p className="mt-3 text-tinta-suave">
          Esta música não está mais disponível no site.
        </p>
        <Link
          to="/musicas"
          className="mt-6 inline-flex min-h-12 items-center rounded-lg bg-azul px-5 font-medium text-white hover:bg-azul-escuro"
        >
          Ver todas as músicas
        </Link>
      </div>
    )
  }

  // O trecho legível do endereço é enfeite — só o :id resolve. Quando ele não
  // bate com o título de hoje (a música foi renomeada, ou alguém digitou outra
  // coisa na barra), a página abre a música certa e arruma o endereço. `replace`
  // de propósito: não cria entrada no histórico, então o botão Voltar não fica
  // preso num pingue-pongue entre o endereço torto e o certo.
  // `slug ?? ''` porque a rota declara o trecho legível como opcional: sem ele
  // o parâmetro vem indefinido, e um título sem letras não gera trecho nenhum —
  // os dois lados precisam encontrar-se no vazio, ou o redirecionamento se
  // repetiria para sempre.
  const canonico = caminhoMusica(musica)
  if ((slug ?? '') !== slugDoTitulo(musica.titulo)) {
    return <Navigate replace to={canonico} />
  }

  return (
    <>
      {musica.exemplo && (
        <div className="mb-4 rounded-lg border border-dashed border-borda bg-papel-suave px-4 py-3 text-sm text-tinta-suave">
          Música de exemplo, apenas para avaliação do layout.
        </div>
      )}

      <h1 className="titulo-leitura font-leitura font-bold text-tinta">{musica.titulo}</h1>
      <p className="mt-2 text-tinta-suave">
        {musica.autores?.length > 0 ? musica.autores.join(', ') : 'Autoria desconhecida'}
      </p>

      {/* Rótulo proposto pelo Pedro. A nomear com cuidado — nota em FR-12. */}
      <div className="mt-5 flex flex-wrap gap-3">
        <Button className="min-h-12 gap-2 px-5" onClick={() => setModoCanto(true)}>
          <Maximize2 aria-hidden />
          Melhorar visualização
        </Button>
        <BotaoCompartilhar titulo={musica.titulo} caminho={canonico} />
        {admin && (
          <Link
            to={`/admin/musica/editar/${musica.id}`}
            className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-borda px-5 font-medium text-tinta hover:border-azul hover:bg-azul-claro"
          >
            <Pencil size={18} aria-hidden />
            Editar
          </Link>
        )}
      </div>

      <Letra secoes={musica.secoes} className="texto-mensagem mt-4" />

      {modoCanto && <ModoCanto musica={musica} aoSair={() => setModoCanto(false)} />}
    </>
  )
}

/**
 * Modo de canto — FR-12, realiza UJ-5 (Dona Célia, de pé, luz fraca, uma mão).
 * Corpo em max(2.25rem, 1,35× o corpo de leitura): o piso é o físico validado
 * no UJ-5 (36px na base padrão) e atende o ≥2rem que o FR-12 exige; o outro
 * termo é o que faz o modo continuar valendo a pena depois que a escada da
 * leitura passou a chegar aos 48,8px. Com os 2.25rem fixos de antes, no último
 * degrau "Melhorar visualização" aumentaria o texto em 6% — viraria um botão
 * que só tira coisas da tela. Agora o ganho nunca fica abaixo de 35%.
 * Rolável com o polegar, sair em um toque.
 * Onde o navegador suportar, a tela não apaga (Wake Lock, readquirido ao
 * voltar de outra aplicação); onde não suportar, o modo continua funcionando
 * e o site orienta a pessoa a ajustar o tempo de tela — o fallback declarado.
 */
function ModoCanto({ musica, aoSair }) {
  const [semWakeLock, setSemWakeLock] = useState(false)
  const trava = useRef(null)

  useEffect(() => {
    let ativo = true

    async function pedirTrava() {
      if (!('wakeLock' in navigator)) {
        setSemWakeLock(true)
        return
      }
      try {
        trava.current = await navigator.wakeLock.request('screen')
      } catch {
        setSemWakeLock(true)
      }
    }

    function aoVoltar() {
      // FR-12: ao voltar para a aba após troca de aplicativo, o modo é
      // restabelecido — o navegador libera a trava sozinho quando a aba sai.
      if (ativo && document.visibilityState === 'visible') pedirTrava()
    }

    pedirTrava()
    document.addEventListener('visibilitychange', aoVoltar)

    return () => {
      ativo = false
      document.removeEventListener('visibilitychange', aoVoltar)
      trava.current?.release().catch(() => {})
    }
  }, [])

  // Fechar com Escape, além do botão — custo zero, ajuda quem usa teclado.
  useEffect(() => {
    const aoTeclar = (e) => e.key === 'Escape' && aoSair()
    document.addEventListener('keydown', aoTeclar)
    return () => document.removeEventListener('keydown', aoTeclar)
  }, [aoSair])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Letra ampliada de ${musica.titulo}`}
      className="fixed inset-0 z-50 overflow-y-auto bg-papel"
    >
      <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-borda bg-papel px-4 py-3">
        <p className="truncate font-leitura font-bold text-tinta">{musica.titulo}</p>
        <Button variant="outline" className="min-h-12 shrink-0 gap-2 px-5" onClick={aoSair}>
          <X aria-hidden />
          Sair
        </Button>
      </div>

      {semWakeLock && (
        <p className="mx-auto max-w-2xl px-5 pt-4 text-sm text-tinta-suave">
          Para a tela não apagar durante a música, aumente o tempo de tela nas
          configurações do aparelho.
        </p>
      )}

      {/* O piso em rem acompanha a escala da interface e ignora o modo
          compacto — canto não deve encolher, e no compacto o max() cai no
          piso justamente por isso. 36 / 40,5 / 48,9 / 65,8px nos quatro
          degraus. Inline, e não numa classe, para a nota do FR-12 ficar
          colada ao número. */}
      <Letra
        secoes={musica.secoes}
        ampliada
        className="texto-mensagem mx-auto max-w-2xl px-5 pt-2 pb-24"
        style={{ fontSize: 'max(2.25rem, calc(var(--tamanho-leitura, 1.26rem) * 1.35))' }}
      />
    </div>
  )
}

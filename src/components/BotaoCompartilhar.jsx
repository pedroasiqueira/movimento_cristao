import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Compartilhar é o gesto central do produto: o convite vira um link (SM-2).
 * No celular abre a folha nativa — que no público deste site significa
 * WhatsApp. Onde não houver navigator.share, copia o endereço.
 */
export default function BotaoCompartilhar({ titulo, caminho, rotulo = 'Compartilhar' }) {
  const [copiado, setCopiado] = useState(false)

  async function compartilhar() {
    // O endereço só é preciso no clique. Calculá-lo no corpo do render tornava
    // este componente irrenderizável fora do navegador — e ele está na home e
    // na página de cada Mensagem, que são justamente as pré-renderizadas.
    const url = `${window.location.origin}${caminho}`
    if (navigator.share) {
      try {
        await navigator.share({ title: titulo, url })
      } catch {
        /* pessoa fechou a folha de compartilhamento — não é erro */
      }
      return
    }
    await navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <Button variant="outline" className="min-h-12 gap-2 px-5" onClick={compartilhar}>
      {copiado ? <Check aria-hidden /> : <Share2 aria-hidden />}
      {copiado ? 'Endereço copiado' : rotulo}
    </Button>
  )
}

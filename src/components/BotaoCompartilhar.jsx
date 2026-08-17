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
  const url = `${window.location.origin}${caminho}`

  async function compartilhar() {
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

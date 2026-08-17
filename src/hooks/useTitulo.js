import { useEffect } from 'react'

const BASE = 'Arca da Sagrada Aliança – Movimento Cristão'

/** Título da aba por página. Não resolve o preview do WhatsApp (que exige
 *  HTML pré-renderizado — PRD §7), mas orienta quem navega em várias abas. */
export function useTitulo(titulo) {
  useEffect(() => {
    document.title = titulo ? `${titulo} · ${BASE}` : BASE
    return () => {
      document.title = BASE
    }
  }, [titulo])
}

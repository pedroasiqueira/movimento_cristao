import { useEffect, useState, useSyncExternalStore } from 'react'
import { assinar, versaoDosDados } from '@/lib/store'
import { carregarMensagem } from '@/lib/mensagens'

/**
 * Re-renderiza o componente quando os dados (mensagens/músicas) mudarem —
 * o primeiro render não espera a API (main.jsx), então quem mostra dados
 * precisa ouvir a chegada deles. Devolve a versão corrente, útil como
 * dependência de efeitos que releem os módulos de dados.
 */
export function useDadosVivos() {
  return useSyncExternalStore(assinar, versaoDosDados)
}

/**
 * A mensagem inteira de uma data, carregada sob demanda —
 * { carregando, mensagem, situacao: 'ok' | 'nao-encontrada' | 'indisponivel' }.
 * Reexecuta quando os dados mudam (revalidação de cache, salvamento no
 * admin): carregarMensagem devolve da memória, então re-render é barato.
 */
export function useMensagem(data) {
  const versao = useDadosVivos()
  const [estado, setEstado] = useState({
    carregando: Boolean(data),
    mensagem: null,
    situacao: null,
  })

  useEffect(() => {
    if (!data) return undefined
    let vivo = true
    carregarMensagem(data).then(({ estado: situacao, mensagem }) => {
      if (vivo) setEstado({ carregando: false, mensagem, situacao })
    })
    return () => {
      vivo = false
    }
  }, [data, versao])

  return estado
}

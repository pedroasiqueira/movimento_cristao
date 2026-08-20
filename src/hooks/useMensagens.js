import { useEffect, useState, useSyncExternalStore } from 'react'
import { assinar, versaoDosDados } from '@/lib/store'
import { carregarMensagem, mensagemSincrona } from '@/lib/mensagens'

/**
 * Re-renderiza o componente quando os dados (mensagens/músicas) mudarem —
 * o primeiro render não espera a API (main.jsx), então quem mostra dados
 * precisa ouvir a chegada deles. Devolve a versão corrente, útil como
 * dependência de efeitos que releem os módulos de dados.
 */
export function useDadosVivos() {
  // O terceiro argumento não é opcional para conteúdo renderizado no
  // servidor: sem ele o React lança. A versão nasce 0 dos dois lados, então
  // servidor e primeiro render do cliente concordam.
  return useSyncExternalStore(assinar, versaoDosDados, versaoDosDados)
}

/**
 * A mensagem inteira de uma data, carregada sob demanda —
 * { carregando, mensagem, situacao: 'ok' | 'nao-encontrada' | 'indisponivel' }.
 * Reexecuta quando os dados mudam (revalidação de cache, salvamento no
 * admin): carregarMensagem devolve da memória, então re-render é barato.
 */
export function useMensagem(data) {
  const versao = useDadosVivos()
  // Leitura SÍNCRONA da memória no primeiro render: quando a página veio
  // pré-renderizada, a mensagem já está semeada e o cliente pinta exatamente o
  // mesmo que o HTML — sem isto, hidratar mostraria o esqueleto por cima do
  // texto já visível. Sem semente, o comportamento é o de sempre.
  const [estado, setEstado] = useState(() => {
    const semeada = mensagemSincrona(data)
    return semeada
      ? { carregando: false, mensagem: semeada, situacao: 'ok' }
      : { carregando: Boolean(data), mensagem: null, situacao: null }
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

import { API_URL } from '@/config'

/**
 * Cliente mínimo da movimento_cristao_api.
 * Erros da API viram Error com a mensagem em português que ela devolve e
 * um campo `status` — quem chama decide o que mostrar.
 */
async function requisitar(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    signal: AbortSignal.timeout(8000),
    ...opcoes,
  })
  const corpo = await resposta.json().catch(() => null)
  if (!resposta.ok) {
    const mensagem = Array.isArray(corpo?.message)
      ? corpo.message.join(' ')
      : (corpo?.message ?? `Erro ${resposta.status}`)
    const erro = new Error(mensagem)
    erro.status = resposta.status
    throw erro
  }
  return corpo
}

export function apiGet(caminho) {
  return requisitar(caminho)
}

export function apiEnviar(metodo, caminho, corpo, token) {
  return requisitar(caminho, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(corpo),
  })
}

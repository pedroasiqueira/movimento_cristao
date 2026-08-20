import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { API_URL } from './config'
import { carregarMensagens, iniciarMensagens } from './lib/mensagens'
import { carregarMusicas } from './lib/musicas'
import { compactoAtivo } from './lib/compacto'

// Preferência de interface compacta aplicada ANTES do primeiro render —
// nada pintado ainda, então não há flash de tamanho.
if (compactoAtivo()) document.documentElement.dataset.compacto = ''

// A conexão com a API começa a ser negociada (DNS/TLS) junto com o render,
// não depois dele — em rede lenta isso adianta o destaque em até um segundo.
if (API_URL.startsWith('https://')) {
  const preconnect = document.createElement('link')
  preconnect.rel = 'preconnect'
  preconnect.href = API_URL
  document.head.append(preconnect)
}

// O destaque guardado da visita anterior (localStorage, síncrono): a home
// da segunda visita pinta a mensagem na hora, antes de qualquer requisição.
iniciarMensagens()

// O primeiro render NÃO espera rede nenhuma: em conexão lenta o site aparece
// primeiro e o conteúdo chega em seguida — cada lib avisa pela store quando
// os dados (banco, cache ou reserva empacotada) estiverem de pé. O site
// nunca abre vazio (FR-2): sem API há cache local e /dados/*.json.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

void carregarMensagens()
void carregarMusicas()

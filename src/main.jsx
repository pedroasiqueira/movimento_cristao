// Primeiro de tudo: o piso de compatibilidade precisa existir antes de
// qualquer módulo de componente ser avaliado.
import '@/lib/compat'
import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import {
  garantirDestaque,
  garantirIndice,
  iniciarMensagens,
  semear,
} from './lib/mensagens'
import { garantirMusicas, semearMusicas } from './lib/musicas'

// As preferências de dimensionamento (FR-17) NÃO são aplicadas aqui: com HTML
// pré-renderizado a página pinta durante o parse, e este módulo é adiado —
// quem escolheu o maior degrau veria o texto pintar pequeno e saltar. Quem
// aplica é o script embutido no <head> (index.html), antes de qualquer pintura.

const semente = window.__MC__
const raiz = document.getElementById('root')
const arvore = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

/*
 * A guarda de rota não é zelo. O host estático devolve o index.html — a HOME
 * pré-renderizada — para qualquer endereço que não tenha página própria, como
 * uma Mensagem publicada depois do último build. Hidratar a home sobre
 * /mensagem/2026-08-25 seria divergência garantida.
 *
 * Quando a semente é da rota certa, hidrata: o texto já visível permanece.
 * Quando não é, monta do zero e o site se comporta exatamente como antes do
 * pré-render — que é também o que acontece se a geração do HTML falhar.
 */
if (semente && semente.rota === window.location.pathname) {
  semear(semente.mensagens)
  semearMusicas(semente.musicas)
  hydrateRoot(raiz, arvore)
} else {
  createRoot(raiz).render(arvore)
}

// Só DEPOIS de montar: o destaque guardado da visita anterior não pode
// influenciar o primeiro render, senão o cliente pintaria algo diferente do
// HTML. Ele substitui o que veio pré-renderizado apenas se for mais novo.
iniciarMensagens()

// A única ida à API com pressa. O índice do acervo e as músicas saíram do
// caminho crítico: descem no ócio, quando ninguém está esperando por elas.
void garantirDestaque()

const ocioso = window.requestIdleCallback ?? ((f) => setTimeout(f, 2000))
window.addEventListener('load', () =>
  ocioso(() => {
    void garantirIndice()
    void garantirMusicas()
  }),
)

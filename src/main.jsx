import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { carregarMensagens } from './lib/mensagens'
import { carregarMusicas } from './lib/musicas'
import { compactoAtivo } from './lib/compacto'

// Preferência de interface compacta aplicada ANTES do primeiro render —
// nada pintado ainda, então não há flash de tamanho.
if (compactoAtivo()) document.documentElement.dataset.compacto = ''

// Os dados chegam do banco ANTES do primeiro render: as páginas seguem
// síncronas, sem estado de carregamento espalhado. Se a API estiver fora,
// cada lib mantém os JSONs empacotados — o site nunca abre vazio (FR-2).
void Promise.allSettled([carregarMensagens(), carregarMusicas()]).then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})

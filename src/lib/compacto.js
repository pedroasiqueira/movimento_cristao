/*
  Modo compacto da interface — opt-in, persistido por navegador.
  O padrão do site é o dimensionamento acessível (público 60+); esta
  preferência reduz a interface para medidas de site convencional via
  html[data-compacto] (ver index.css). Dataset no <html> e localStorage
  protegido com try/catch, como a escala de texto (lib/escala.js) e o App.jsx.
*/

const CHAVE = 'mc:compacto'
const ouvintes = new Set()

export function compactoAtivo() {
  try {
    return localStorage.getItem(CHAVE) === '1'
  } catch {
    return false
  }
}

/** Liga/desliga o modo e persiste — o CSS reage na hora, sem recarregar. */
export function definirCompacto(ativo) {
  if (ativo) document.documentElement.dataset.compacto = ''
  else delete document.documentElement.dataset.compacto
  try {
    localStorage.setItem(CHAVE, ativo ? '1' : '0')
  } catch {
    // Sem armazenamento: vale só nesta visita.
  }
  for (const avisar of ouvintes) avisar()
}

/**
 * Assinatura para useSyncExternalStore: o botão do modo existe em DUAS
 * instâncias sempre montadas (menu lateral e faixa do celular) — sem uma
 * fonte de verdade compartilhada, alternar numa deixaria o rótulo da outra
 * mentindo. Mesma razão pela qual a escala de texto virou lib/escala.js.
 */
export function assinarCompacto(avisar) {
  ouvintes.add(avisar)
  return () => ouvintes.delete(avisar)
}

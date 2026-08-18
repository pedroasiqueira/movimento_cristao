/*
  Modo compacto da interface — opt-in, persistido por navegador.
  O padrão do site é o dimensionamento acessível (público 60+); esta
  preferência reduz a interface para medidas de site convencional via
  html[data-compacto] (ver index.css). Mesmo padrão do ControleFonte:
  localStorage + dataset no <html>.
*/

const CHAVE = 'mc:compacto'

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
}

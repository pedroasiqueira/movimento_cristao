import { compactoAtivo } from './compacto'

/*
  Zoom local da leitura (FR-18) — os degraus do AjusteLeitura, aplicados
  como multiplicador em `em` sobre o texto da Mensagem/Música. Crescimento
  geométrico (~19% por passo); o último dobra.

  passoInicial(): a leitura ABRE um passo acima do mínimo — decisão do
  Pedro (18/08/2026): o site tem medidas convencionais, mas quem chega
  para ler já encontra o texto confortável; o primeiro passo é o tamanho
  normal do site, para quem preferir menor. Com o modo compacto ativo,
  abre direto no mínimo — quem desligou o dimensionamento acessível não
  quer o texto crescido. Vive aqui para todas as pontas (controle,
  páginas de leitura, prévias da home/Sobre/admin) importarem da mesma
  fonte.
*/
export const PASSOS = [1, 1.19, 1.41, 1.68, 2]

export function passoInicial() {
  return compactoAtivo() ? 0 : 1
}

/**
 * Multiplicador com que o corpo de leitura abre — o MESMO em toda parte:
 * páginas de leitura, prévia da home, Sobre e prévias do admin. Sem ele,
 * o texto "pularia" de tamanho entre a prévia e a página completa.
 */
export function multiplicadorInicial() {
  return PASSOS[passoInicial()]
}

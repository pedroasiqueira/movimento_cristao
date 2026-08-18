/*
  Zoom local da leitura (FR-18) — os degraus do AjusteLeitura, aplicados
  como multiplicador em `em` sobre o texto da Mensagem/Música. Crescimento
  geométrico (~19% por passo); o último dobra.

  PASSO_INICIAL: a leitura ABRE ampliada (nível 2) — decisão do Pedro
  (18/08/2026): o site tem medidas convencionais, mas quem chega para ler
  já encontra o texto confortável; o nível 1 é o tamanho normal do site,
  para quem preferir menor. Vive aqui (e não no componente) porque as
  páginas inicializam o estado com ele e um arquivo de componente não deve
  exportar constantes (fast refresh).
*/
export const PASSOS = [1, 1.19, 1.41, 1.68, 2]
export const PASSO_INICIAL = 1

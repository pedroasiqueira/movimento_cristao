/*
  Menu raso: cinco itens, sem submenus — PRD §6.
  `rotulo` é o do menu completo (lateral no desktop, cabeçalho no celular);
  `curto` é o da barra compacta que aparece ao rolar no celular.
*/
export const ITENS = [
  { para: '/', rotulo: 'Início', curto: 'Início', fim: true },
  { para: '/acervo', rotulo: 'Acervo', curto: 'Acervo' },
  { para: '/musicas', rotulo: 'Músicas', curto: 'Músicas' },
  { para: '/encontros', rotulo: 'Encontros', curto: 'Encontros' },
  { para: '/sobre', rotulo: 'Sobre', curto: 'Sobre' },
]

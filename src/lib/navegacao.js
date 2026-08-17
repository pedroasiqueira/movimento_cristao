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

/*
  Itens da Área Admin — visíveis apenas com o administrador identificado.
  Não entram na barra compacta do celular. "Adicionar mensagem do dia"
  entrará aqui quando o Pedro definir esse fluxo.
*/
export const ITENS_ADMIN = [
  { para: '/admin/musica/nova', rotulo: 'Adicionar música' },
]

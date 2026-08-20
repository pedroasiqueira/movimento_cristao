import { BookOpen, CalendarDays, House, Info, Music } from 'lucide-react'

/*
  Menu raso: cinco itens, sem submenus — PRD §6.

  `rotulo` é a palavra do menu, a MESMA no MenuLateral do desktop e na
  BarraInferior do celular: mudar de largura não pode mudar o vocabulário.
  (Havia um `curto`, para a barra compacta que aparecia ao rolar; a barra
  saiu, o campo foi junto.)

  `icone` só a barra do celular usa — lá a coluna é estreita e o desenho
  carrega metade do reconhecimento. O menu do desktop segue texto puro, por
  decisão: no cartão largo a palavra basta, e um ícone ao lado de cada linha
  só acrescentaria ruído. Os desenhos não são novos: repetem os que os
  atalhos da home já ensinam (FR-1) — livro aberto = Acervo, nota = Músicas,
  calendário = Encontros. Quem aprendeu o símbolo na primeira tela o
  reencontra na barra.

  `fim` é o `end` do NavLink: sem ele "/" ficaria ativa em toda página.
*/
export const ITENS = [
  { para: '/', rotulo: 'Início', icone: House, fim: true },
  { para: '/acervo', rotulo: 'Acervo', icone: BookOpen },
  { para: '/musicas', rotulo: 'Músicas', icone: Music },
  { para: '/encontros', rotulo: 'Encontros', icone: CalendarDays },
  { para: '/sobre', rotulo: 'Sobre', icone: Info },
]

/*
  Itens da Área Admin — visíveis apenas com o administrador identificado.
  Não entram na barra inferior: lá vão só as cinco seções do menu raso.
  Sem ícone pela mesma razão — aparecem em lista de texto, no fim do
  cabeçalho (celular) e num cartão à parte (desktop).
*/
export const ITENS_ADMIN = [
  { para: '/admin/mensagem/nova', rotulo: 'Adicionar mensagem do dia' },
  { para: '/admin/musica/nova', rotulo: 'Adicionar música' },
]

import { useSyncExternalStore } from 'react'
import { Button } from '@/components/ui/button'
import { ajustarEscala, assinarEscala, escalaTexto, ESCALA_MAX } from '@/lib/escala'

/**
 * Escala de texto ao alcance da mão enquanto se lê — celular e tablet.
 *
 * O controle completo (ControleFonte) mora na faixa do topo, e a faixa não é
 * fixa: rola para fora junto com o conteúdo. Quem começa a ler uma mensagem e
 * só então percebe que a letra está pequena precisava voltar ao topo para
 * ajustar. No desktop isso não acontece — lá o mesmo controle viaja no sticky
 * do menu lateral.
 *
 * Aparece só quando a faixa sai de vista, reaproveitando a medição que o
 * Cabecalho já fazia para o desktop. Enquanto o controle do topo está à vista
 * ela não existe: nada de dois controles competindo, e nenhum pixel gasto na
 * primeira tela (§5 — cada elemento a mais é custo direto para o público 60+).
 * Efeito colateral aceito: com threshold 0 a faixa precisa sair INTEIRA, então
 * há um trecho curto de rolagem sem nenhum dos dois à vista.
 *
 * MEDIDAS. O afastamento do pé é bottom-20 (rem, como toda utilitária do
 * Tailwind 4) e não um valor em px, porque a barra inferior cresce com a
 * escala — ~65px na escala 0 e ~93px na escala 3 — e encolhe no modo
 * compacto. Em rem as duas medidas variam juntas e a folga se mantém; em px a
 * barra cobriria a pílula justamente na escala 3, onde ela é mais necessária.
 * z-40 é a camada da barra inferior, com quem ela não se sobrepõe, e fica
 * abaixo do z-50 do modo canto (a letra ampliada tem a tela inteira) e do
 * salto para o conteúdo quando focado.
 *
 * "A−" e "A+" em vez dos sinais soltos do controle do topo: lá o "1 de 4" ao
 * lado diz do que se trata, aqui um − sozinho poderia ser zoom, volume,
 * qualquer coisa. Sem indicador de nível e sem região viva própria — quem usa
 * leitor de tela já ouve o anúncio do controle do topo, que continua montado;
 * uma segunda região viva faria o aparelho falar tudo duas vezes.
 *
 * CONTRASTE. Os botões são azuis cheios, o idioma de ação do site inteiro
 * (bg-azul/text-white, 7,4:1), e não os de contorno do controle do topo: a
 * pílula pousa SOBRE o texto da mensagem, e um botão branco de contorno claro
 * sobre a folha branca some — na primeira versão o texto por trás parecia
 * atravessar o controle. A bandeja branca em volta existe pelo mesmo motivo:
 * separa o azul do texto e evita que os botões pareçam colados na palavra.
 *
 * O que ela tapa, medido percorrendo o Tab de todas as páginas: nada fica
 * inteiramente escondido (WCAG 2.4.11 é sobre isso), e nenhum link do rodapé
 * é alcançado por ela. O que sobra é o canto direito dos cartões do Acervo,
 * largos demais para caberem ao lado — título e data ficam à esquerda, à
 * vista. Empurrar o scroll-padding-bottom acima da pílula resolveria, ao
 * preço de tirar mais uma faixa de tela de todo mundo o tempo inteiro.
 */
export default function ControleFonteFlutuante({ visivel }) {
  const escala = useSyncExternalStore(assinarEscala, escalaTexto)

  // Alvo de 48px de §7, como em qualquer controle público (declaração
  // canônica no index.css). Ghost porque as cores vêm todas daqui — não há
  // variante do shadcn para brigar.
  const alvo =
    'size-12 rounded-full bg-azul text-base font-semibold text-white hover:bg-azul-escuro'

  return (
    /* Invisível ela continua no DOM para o fade de saída existir — inert é o
       que impede o Tab de parar num botão que ninguém vê (mesma solução do
       menu lateral recolhido). */
    <div
      role="group"
      aria-label="Tamanho da letra"
      inert={!visivel}
      className={
        'fixed right-3 bottom-20 z-40 flex items-center gap-2 rounded-full border border-borda bg-papel p-1.5 shadow-xl transition-opacity duration-300 lg:hidden ' +
        (visivel ? 'opacity-100' : 'pointer-events-none opacity-0')
      }
    >
      <Button
        variant="ghost"
        className={alvo}
        onClick={() => ajustarEscala(-1)}
        disabled={escala === 0}
        aria-label="Diminuir o tamanho da letra"
      >
        <span aria-hidden>A−</span>
      </Button>

      <Button
        variant="ghost"
        className={alvo}
        onClick={() => ajustarEscala(1)}
        disabled={escala === ESCALA_MAX}
        aria-label="Aumentar o tamanho da letra"
      >
        <span aria-hidden>A+</span>
      </Button>
    </div>
  )
}

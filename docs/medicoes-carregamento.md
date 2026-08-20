# Medições — carregamento das mensagens (antes → depois)

**Data:** 19/08/2026 · Corpus: **958 mensagens** (2023-06-21 a 2026-08-18) · Plano: `../plano-carregamento-mensagens.md`

## Bytes no fio (o que o navegador baixa de fato)

| O quê | Antes | Depois | Redução |
|---|---:|---:|---:|
| Até a **primeira mensagem visível** na home | 2.057.929 B (`GET /mensagens`, sem compressão, bloqueando o render) | **2.095 B** (`GET /mensagens/destaque`, brotli) | **~982×** |
| Índice do Acervo (todas as 958) | — (vinha dentro dos 2 MB) | **11.767 B** (`?formato=lista`, brotli) | — |
| Acervo completo, formato de compatibilidade | 2.057.929 B | 448.085 B (`?formato=completo`, brotli, sem `_id`/timestamps) | 4,6× |
| Reserva empacotada (API fora do ar) | 572 KB gz (chunk de 1,96 MB no bundle) | **38,5 KB gz** (`/dados/indice.json` 11,7 KB + `/dados/recentes.json` 26,9 KB) | **15×** |
| Revisita com nada mudado | tudo de novo | **304 Not Modified** (ETag) + `stale-while-revalidate` + Cache Storage + localStorage | — |

## Build do site (`dist/`)

| | Antes | Depois |
|---|---|---|
| Total | ~2,3 MB | **556 KB** |
| Maior arquivo | `mensagens-*.js` 1.963.642 B | `index-*.js` 305.560 B (96 KB gz) |
| Telas admin | no bundle de todo visitante | 3 chunks `lazy` (~30 KB), só descem em `/admin` |

## Comportamento (verificado com chromium headless, build de produção)

| Cenário | Resultado |
|---|---|
| Home com API de pé | primeiro render sem esperar rede; destaque via API; sem salto de layout (esqueleto de altura fixa) |
| Home com API **derrubada** | mensagem servida pela reserva `/dados/recentes.json` |
| Acervo | **42 cartões no DOM** (antes: 958) — vista inicial com os meses recentes; botões de mês agora filtram |
| Acervo com API derrubada | 958 itens via `/dados/indice.json`; filtro por tag e navegação por mês 100% offline |
| Mensagem antiga sob demanda | `GET /mensagens/:data` (~1,4 KB) ao abrir a página; guardada no Cache Storage para releitura sem rede |
| Mensagem fora das 30 recentes, sem rede | estado honesto "Sem conexão para carregar a mensagem" (não confunde com inexistente) |
| Data de referência ("hoje") | relógio do **servidor** via `/mensagens/destaque` — celular com data errada não muda o site |

## Busca (FR-7) — migrada para a API

* Ranking, tokenizador e equivalências **idênticos** aos do navegador — verificado por `movimento_cristao_api/scripts/testar-equivalencia-busca.mjs`: **33 consultas** (conjunto de aceitação de FR-7 + amostra ampla), **ranking idêntico em todas** contra o algoritmo original rodando sobre o corpus completo.
* Consulta 100% indexada no Mongo (sem COLLSCAN — `explain` verificado); índices: `{publicarEm, data}` composto + multikey em `termosTitulo/termosTags/termosCorpo`.
* Backfill dos termos rodado em produção em 19/08/2026 (958 alteradas); segunda execução: 0 alteradas (idempotente).
* Sem rede: busca local por **título + tags** sobre o índice leve, com aviso na tela.

## Projeção de crescimento

| Mensagens | Índice (gz) | Destaque | Reserva total (gz) |
|---|---|---|---|
| 958 (hoje) | 11,7 KB | ~2 KB | 38,5 KB |
| 5.000 | ~60 KB | ~2 KB | ~87 KB |
| 10.000 | ~121 KB | ~2 KB | ~148 KB |

Acima de ~150 KB gz de índice (~12.000 mensagens), ativar o cursor que já existe no endpoint (`?desde=&limite=`) — mudança só de frontend.

## Pendências de medição

* Lighthouse mobile (3G lento + CPU 4×) num aparelho/browser real — o ambiente desta implementação não tem interface gráfica; os números de bytes acima são medidos, os de LCP são projeção.
* Teste com um celular antigo de verdade (critério do plano — nenhum emulador substitui).

## Ordem de implantação recomendada

1. **Site primeiro** (`npm run build && npm run deploy-cloud`): o site novo tolera a API antiga (formato de lista normalizado, destaque/busca com fallback).
2. **API depois**: a partir daí o site novo usa os endpoints novos. (O site *antigo* contra a API nova cairia na reserva — funciona, mas evite essa ordem.)
3. Em produção da API, após o deploy: `node dist/scripts/backfill-termos.js` (ou via ts-node) — **já rodado em 19/08/2026**; repetir apenas se o vocabulário de `busca.util.ts` mudar.

---

# Segunda rodada — pré-renderização (20/08/2026)

Corpus: **959 mensagens**. Plano: `~/.claude/plans/wild-puzzling-balloon.md`.

A primeira rodada resolveu o **transporte dos dados**: a API deixou de enviar as
900+ mensagens completas. Medindo a produção no dia seguinte, o peso tinha
migrado — não estava mais nos dados, estava no bundle e no encadeamento.

## O que a medição em produção mostrou (antes desta rodada)

| | bytes no fio (br) |
|---|---:|
| `index.html` (vazio) | 823 |
| **`index-*.js`** | **97.686** |
| `index-*.css` | 6.979 |
| `GET /mensagens/destaque` | 2.067 |
| `GET /mensagens` (índice) | 11.832 |
| `GET /musicas` | 643 |
| **total** | **~120 KB — 81% JavaScript** |

Latência medida: Cloudflare Pages TTFB **0,23 s**; API no Railway TTFB **1,1 s**,
dos quais **0,63 s só de DNS+TCP+TLS**. Em conexão cabeada.

Composição do bundle (minificado): react-dom 180.500 (**57,5%**), código do app
58.172, tailwind-merge 27.426, react-router 24.300, lucide+radix 10.414 (já
tree-shaken). Não havia gordura de biblioteca para cortar.

## Depois

| Caminho até o primeiro pixel | Antes | Depois |
|---|---|---|
| Link de Mensagem (WhatsApp) | 823 + 97.686 (JS) + 6.979 (CSS) + 2.067 (API, TTFB 1,1 s) — **em série** | **6.641 (HTML com a mensagem) + 6.901 (CSS)** |
| Home | idem | **6.565 + 6.901** |

**~107 KB em série → 13,5 KB, sem esperar JavaScript e sem esperar a API.**
O bundle continua descendo, mas para hidratar — não para mostrar o texto.

| | Antes | Depois |
|---|---|---|
| Páginas em `dist/` | 1 | **966** (959 mensagens + home + acervo + músicas + 2 letras + encontros + sobre) |
| `dist/` total | 556 KB | ~30 MB (5–7 KB brotli por página) |
| Requisições à API no boot | 3, em qualquer rota | **1** (o destaque); índice e músicas no ócio ou na rota que os usa |
| Assets com hash | `max-age=0, must-revalidate` (um 304 por visita) | `immutable` via `public/_headers` |
| `og:title` por Mensagem | não (card genérico) | **sim** — FR-3/FR-14 |
| Tempo de build | ~12 s | ~30 s |

## Verificado (chromium headless, build de produção, host estático simulado)

| Cenário | Resultado |
|---|---|
| **Sem JavaScript**, `/mensagem/2026-08-18` | 4.629 caracteres visíveis, corpo da Mensagem presente — o teste definitivo do pré-render |
| Hidratação em `/`, `/mensagem/:data`, `/acervo`, `/encontros` | **nenhum aviso de divergência**, com a API de pé e com a API fora |
| Rota sem página gerada (`/mensagem/2030-01-01`) | fallback serve a home; a guarda de rota cai em `createRoot` e o site age como antes — sem divergência |
| Escala de letra no degrau 3, recarregar | `<html data-escala="3">` aplicado pelo script embutido, antes de qualquer pintura |
| Build com a API fora do ar | completa pelo corpus versionado (958 mensagens), **não quebra** — `dist/dados/build.json` registra `fonte: "corpus"` |

## Decisões registradas

* **Sem rebuild automático** (deploy hook ou cron), por decisão do Pedro. Uma
  Mensagem publicada só ganha página própria no próximo push; até lá o fallback
  do host a serve normalmente. Isso **só é gratuito** porque nenhuma data vive
  no HTML: o aviso de FR-2, o próximo Encontro e a lista de `/encontros` estão
  atrás de `useMontado` e são calculados no navegador de quem lê.
* **Sem `lazy()` nas rotas públicas**: valeria ~6 KB brotli, mas hidratar uma
  rota `lazy()` troca o conteúdo pré-renderizado pelo "Carregando…" — o flash
  que o pré-render existe para evitar.
* **`preact/compat`, eliminar `tailwind-merge` e service worker ficam fora**:
  depois do pré-render o bundle saiu do caminho do primeiro pixel, e os três
  têm risco desproporcional ao que ainda rendem.

## Pendências

* **`public/og.png` (1200×630)** não existe. Enquanto faltar, o gerador avisa no
  build e **omite** `og:image` — o card sai sem miniatura. O rastreador do
  WhatsApp não renderiza SVG, então o favicon não serve. Posto o arquivo, a tag
  aparece sozinha, sem mexer em código.
* **`SITE_URL`** precisa existir nas variáveis do Cloudflare Pages, senão
  `og:url` e `canonical` saem de fora.
* **Conferir o `_headers` em produção** depois do deploy — o Pages já teve
  versões que ignoravam `Cache-Control` ali:
  `curl -sI https://movimento-cristao.pages.dev/assets/index-*.js | grep -i cache-control`
* **Aparelho antigo de verdade** — continua aberta desde a primeira rodada. O
  piso caiu para ~Safari 13.1 (`build.target` + `src/lib/compat.js`), mas
  ninguém abriu o site num aparelho real.
* Qualquer mudança de código reescreve as 966 páginas (o nome hasheado do JS
  está em todas), e o upload sobe ~30 MB. Mudança só de conteúdo reescreve
  poucos arquivos.

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

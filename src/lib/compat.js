/*
  Piso de compatibilidade — importado ANTES de qualquer outro módulo (main.jsx).

  O público-alvo abre o site de aparelhos antigos, quase sempre pelo navegador
  embutido do WhatsApp. Duas APIs em uso ficam acima desse piso, e as
  consequências são diferentes:

    AbortSignal.timeout (lib/api.js) — Chrome 103+/Safari 16+. Falha SILENCIOSA:
      o TypeError faz toda chamada de API rejeitar, todo chamador tem catch, e o
      site passa a viver de reserva para sempre — sem busca, sem acervo antigo,
      sem ninguém perceber.
    Array.prototype.at (lib/mensagens.js) — Safari 15.4+. Falha DURA: emBlocos
      roda no render de TODA mensagem; sem isto, tela branca.

  O resto do código já detecta capacidade antes de usar — caches (lib/cache.js),
  navigator.share (BotaoCompartilhar), wakeLock (MusicaPagina). Nada a fazer lá.

  Sintaxe moderna é outro eixo, e se resolve no build.target do vite.config.js:
  polyfill não salva de erro de parse.
*/

if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout !== 'function') {
  // AbortController/AbortSignal existem desde Chrome 66/Safari 12.1 — só o
  // atalho estático falta. O único consumidor do motivo do aborto é um bloco
  // catch, então abort() sem argumento basta (e é o que motor antigo aceita).
  AbortSignal.timeout = function (ms) {
    const controlador = new AbortController()
    setTimeout(() => controlador.abort(), ms)
    return controlador.signal
  }
}

if (typeof Array.prototype.at !== 'function') {
  // defineProperty, e não atribuição direta: enumerable precisa ficar false,
  // senão `at` aparece em qualquer for..in sobre array no site inteiro.
  Object.defineProperty(Array.prototype, 'at', {
    value: function (indice) {
      const n = Math.trunc(indice) || 0
      const i = n < 0 ? this.length + n : n
      return i < 0 || i >= this.length ? undefined : this[i]
    },
    writable: true,
    configurable: true,
  })
}

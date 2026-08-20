import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

/*
 * O preconnect com a API precisa estar no HTML, não em JavaScript. Ele nascia
 * em main.jsx, DEPOIS de baixar e executar o bundle — e medido em produção
 * (20/08/2026), dos 1,1 s de TTFB da API 0,63 s é DNS+TCP+TLS. É esse handshake
 * que sai da frente quando começa junto com o parse do <head>.
 *
 * `crossorigin` não é decoração: fetch() cross-origin sem credenciais usa o
 * pool de conexões anônimo, e um preconnect sem ele abre socket no pool errado
 * — o handshake é aberto e jogado fora.
 *
 * Por que aqui e não `%VITE_API_URL%` no index.html: sem a variável definida, o
 * htmlEnvHook do Vite deixa o literal, que o navegador resolve como caminho
 * relativo e o host estático responde com o fallback da SPA — uma requisição
 * desperdiçada, em silêncio, em toda visita. Com loadEnv, ausência de variável
 * simplesmente não emite tag nenhuma.
 */
function preconectarApi(env) {
  return {
    name: 'mc-preconectar-api',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const bruto = env.VITE_API_URL ?? ''
        // Mesma guarda de antes: em desenvolvimento a API é local e preconectar
        // com localhost é ruído.
        if (!bruto.startsWith('https://')) return html
        let origem
        try {
          origem = new URL(bruto).origin
        } catch {
          console.warn(`[mc] VITE_API_URL inválida (${bruto}) — sem preconnect.`)
          return html
        }
        return {
          html,
          tags: [
            // dns-prefetch primeiro: navegador que ignora preconnect ainda adianta o DNS.
            { tag: 'link', attrs: { rel: 'dns-prefetch', href: origem }, injectTo: 'head-prepend' },
            {
              tag: 'link',
              attrs: { rel: 'preconnect', href: origem, crossorigin: '' },
              injectTo: 'head-prepend',
            },
          ],
        }
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  // import.meta.dirname, e não process.cwd(): os .env moram junto do projeto,
  // não de onde o comando foi disparado.
  const env = loadEnv(mode, import.meta.dirname, 'VITE_')
  return {
    plugins: [react(), tailwindcss(), preconectarApi(env)],
    resolve: {
      alias: { '@': path.resolve(import.meta.dirname, './src') },
    },
    /*
     * O alvo default do Vite 7 é chrome107/safari16, e o público-alvo abre o
     * site de aparelhos antigos. Sem isto, o `??=` de lib/mensagens.js sai sem
     * transpilar e num Safari 13 vira erro de parse do módulo INTEIRO — tela
     * branca, não degradação. Não descer abaixo de es2019: o esbuild não
     * rebaixa async/await para ES5.
     */
    build: {
      target: ['es2019', 'safari13.1', 'chrome87', 'firefox78', 'edge88'],
    },
  }
})

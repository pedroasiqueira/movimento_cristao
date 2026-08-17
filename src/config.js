/**
 * Pendências de conteúdo que não dependem de código.
 * Cada campo null é uma informação que falta alguém confirmar — a referência
 * aponta a questão correspondente no PRD §12. Preencher aqui resolve no site
 * inteiro, sem tocar em componente nenhum.
 */

/** Endereço da API (movimento_cristao_api). Em produção, defina VITE_API_URL
 *  no ambiente de build. Se a API estiver fora do ar, o site continua de pé
 *  com os JSONs empacotados — ver src/lib/api.js e main.jsx. */
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

/** Número de WhatsApp do contato (FR-19) — PRD §12, questão 9.
 *  Formato internacional, só dígitos. Ex.: '5584999990000'. */
export const WHATSAPP_CONTATO = null

/** Horário dos Encontros — PRD §12, questão 3. Ex.: '19h30'. */
export const HORARIO_ENCONTROS = null

/** Endereço do Encontro presencial — PRD §12, questão 3. */
export const ENDERECO_ENCONTROS = null

/** Datas (AAAA-MM-DD) em que o Encontro não acontece — feriado, recesso,
 *  cancelamento. Mecanismo de exceção exigido por FR-15. */
export const EXCECOES_ENCONTROS = []

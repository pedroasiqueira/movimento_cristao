import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LogIn, LogOut, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { apiEnviar } from '@/lib/api'
import { ITENS_ADMIN } from '@/lib/navegacao'
import { useTitulo } from '@/hooks/useTitulo'

/**
 * Porta da Área Admin — rota discreta /admin, fora de qualquer menu público
 * (decisão do Pedro, 17/08/2026; mesmo espírito dos links de Encontro, PRD
 * §4.3: acesso distribuído em privado). O login é validado pela API
 * (POST /auth/login → JWT de 7 dias), que é quem protege as escritas.
 */
export default function AdminEntrada({ admin, aoEntrar, aoSair }) {
  useTitulo('Área Admin')
  return admin ? <Hub aoSair={aoSair} /> : <Entrada aoEntrar={aoEntrar} />
}

function Entrada({ aoEntrar }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(null)
  const [enviando, setEnviando] = useState(false)

  async function enviar(e) {
    e.preventDefault()
    setErro(null)
    setEnviando(true)
    try {
      const { access_token } = await apiEnviar('POST', '/auth/login', {
        email,
        password: senha,
      })
      aoEntrar(access_token)
    } catch (falha) {
      setErro(
        falha.status === 401
          ? 'E-mail ou senha incorretos.'
          : `Não foi possível entrar: ${falha.message}`,
      )
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-leitura text-3xl font-bold text-tinta">Área Admin</h1>
      <p className="mt-2 text-tinta-suave">
        Entrada para quem publica o conteúdo do site.
      </p>

      <form className="mt-6 space-y-4" onSubmit={enviar}>
        <div>
          <label htmlFor="admin-email" className="mb-1.5 block font-medium text-tinta">
            E-mail
          </label>
          <input
            id="admin-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            className="h-14 w-full rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
          />
        </div>
        <div>
          <label htmlFor="admin-senha" className="mb-1.5 block font-medium text-tinta">
            Senha
          </label>
          <input
            id="admin-senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
            required
            className="h-14 w-full rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
          />
        </div>
        {erro && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {erro}
          </p>
        )}
        <Button type="submit" disabled={enviando} className="min-h-12 gap-2 px-6">
          <LogIn aria-hidden />
          {enviando ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}

function Hub({ aoSair }) {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-leitura text-3xl font-bold text-tinta">Área Admin</h1>
      <p className="mt-2 text-tinta-suave">
        Você está identificado como administrador neste navegador.
      </p>

      <ul className="mt-6 space-y-3">
        {ITENS_ADMIN.map(({ para, rotulo }) => (
          <li key={para}>
            <NavLink
              to={para}
              className="flex min-h-14 items-center gap-3 rounded-lg border border-borda px-5 font-medium text-tinta hover:border-azul hover:bg-azul-claro"
            >
              <Music size={22} aria-hidden className="text-azul" />
              {rotulo}
            </NavLink>
          </li>
        ))}
      </ul>

      <Button variant="outline" className="mt-6 min-h-12 gap-2 px-5" onClick={aoSair}>
        <LogOut aria-hidden />
        Sair da Área Admin
      </Button>
    </div>
  )
}

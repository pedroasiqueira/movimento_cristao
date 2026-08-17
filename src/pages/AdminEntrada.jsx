import { NavLink } from 'react-router-dom'
import { LogIn, LogOut, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ITENS_ADMIN } from '@/lib/navegacao'
import { useTitulo } from '@/hooks/useTitulo'

/**
 * Porta da Área Admin — rota discreta /admin, fora de qualquer menu público
 * (decisão do Pedro, 17/08/2026; mesmo espírito dos links de Encontro, PRD
 * §4.3: acesso distribuído em privado). Na Fase 1 não há autenticação real:
 * entrar apenas identifica o administrador neste navegador. O mecanismo
 * verdadeiro chega com a decisão de backend (addendum §2).
 */
export default function AdminEntrada({ admin, aoEntrar, aoSair }) {
  useTitulo('Área Admin')
  return admin ? <Hub aoSair={aoSair} /> : <Entrada aoEntrar={aoEntrar} />
}

function Entrada({ aoEntrar }) {
  return (
    <div className="mx-auto max-w-xl">
      <h1 className="font-leitura text-3xl font-bold text-tinta">Área Admin</h1>
      <p className="mt-2 text-tinta-suave">
        Entrada para quem publica o conteúdo do site.
      </p>

      <div className="mt-4 rounded-lg border border-dashed border-borda bg-papel-suave px-4 py-3 text-sm text-tinta-suave">
        Fase 1: a autenticação real chega com o backend. Entrar aqui apenas
        identifica o administrador neste navegador.
      </div>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          aoEntrar()
        }}
      >
        <div>
          <label htmlFor="admin-usuario" className="mb-1.5 block font-medium text-tinta">
            Usuário
          </label>
          <input
            id="admin-usuario"
            type="text"
            autoComplete="username"
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
            autoComplete="current-password"
            className="h-14 w-full rounded-lg border border-borda bg-papel px-4 text-tinta focus:border-azul"
          />
        </div>
        <Button type="submit" className="min-h-12 gap-2 px-6">
          <LogIn aria-hidden />
          Entrar
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

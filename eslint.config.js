import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // Sem eslint-plugin-react, o linter não reconhece <Componente /> como uso.
      // Identificadores capitalizados são componentes: ignorados nos dois lados.
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', args: 'after-used', argsIgnorePattern: '^[A-Z_]' },
      ],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
  // Componentes gerados pelo shadcn exportam variantes junto com o componente,
  // por design. Não é código nosso para reescrever. Precisa vir depois do bloco
  // geral: em flat config, o último a definir a regra vence.
  {
    files: ['src/components/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
]

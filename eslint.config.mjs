import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Scripts and utility files
    'check-*.js',
    'scripts/**',
  ]),
  // Custom rules
  {
    rules: {
      // Allow setState in effects - common React 19 pattern for hydration
      'react-hooks/set-state-in-effect': 'off',
      // Allow variables accessed before declared in useCallback (hoisting)
      'react-hooks/immutability': 'off',
      // Downgrade unused vars to warning (not blocking)
      '@typescript-eslint/no-unused-vars': 'warn',
      // Allow require() in specific files
      '@typescript-eslint/no-require-imports': 'warn',
      // Allow any in scripts (migration utilities)
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])

export default eslintConfig

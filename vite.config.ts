import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  if (command === 'build') {
    const env = loadEnv(mode, process.cwd(), 'VITE_')
    const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].filter(key => !env[key]?.trim())
    if (missing.length) throw new Error(`Storefront build requires ${missing.join(', ')}. Production cannot use demo accounts.`)
  }
  return {
    plugins: [react()],
    define: {
      // Brand can supply logo.svg later; rebuilding selects it without a 404 probe.
      'import.meta.env.VITE_BRAND_LOGO': JSON.stringify(
        existsSync(new URL('./public/brand/logo.svg', import.meta.url)) ? '/brand/logo.svg' : '/brand/logo.png',
      ),
    },
  }
})

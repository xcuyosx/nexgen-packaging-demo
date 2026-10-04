import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { getSiteSettings, searchAssets } from './build/searchAssets'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const site = getSiteSettings(env, mode)
  if (command === 'build') {
    const missing = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'].filter(key => !env[key]?.trim())
    if (missing.length) throw new Error(`Storefront build requires ${missing.join(', ')}. Production cannot use demo accounts.`)
  }
  return {
    plugins: [react(), searchAssets(site)],
    define: {
      'import.meta.env.VITE_SITE_URL': JSON.stringify(site.origin),
      'import.meta.env.VITE_NOINDEX': JSON.stringify(String(site.noindex)),
      // Brand can supply logo.svg later; rebuilding selects it without a 404 probe.
      'import.meta.env.VITE_BRAND_LOGO': JSON.stringify(
        existsSync(new URL('./public/brand/logo.svg', import.meta.url)) ? '/brand/logo.svg' : '/brand/logo.png',
      ),
    },
  }
})

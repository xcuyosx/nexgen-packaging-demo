import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Brand can supply logo.svg later; rebuilding selects it without a 404 probe.
    'import.meta.env.VITE_BRAND_LOGO': JSON.stringify(
      existsSync(new URL('./public/brand/logo.svg', import.meta.url)) ? '/brand/logo.svg' : '/brand/logo.png',
    ),
  },
})

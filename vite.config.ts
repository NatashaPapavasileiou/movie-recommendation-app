import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react' // 👈 Κράτα αυτό αν υπάρχει ήδη εκεί για το React
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
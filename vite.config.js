import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/'   // หรือถ้า deploy GitHub Pages ให้ใส่ path ของ repo เช่น '/qr_code/'
})

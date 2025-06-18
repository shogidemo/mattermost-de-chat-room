import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // HTTP API プロキシ
      '/api': {
        target: 'http://localhost:8065',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('HTTPプロキシエラー:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('HTTPプロキシリクエスト:', req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('HTTPプロキシレスポンス:', req.url, proxyRes.statusCode);
          });
        }
      }
    }
  }
})

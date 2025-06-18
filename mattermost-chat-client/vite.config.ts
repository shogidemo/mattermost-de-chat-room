import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8065',
        changeOrigin: true,
        secure: false,
        ws: true, // WebSocketプロキシを有効化
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('プロキシエラー:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('プロキシリクエスト:', req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('プロキシレスポンス:', req.url, proxyRes.statusCode);
          });
        }
      }
    }
  }
})

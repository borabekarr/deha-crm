import { defineConfig } from 'vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  server: {
    // host '0.0.0.0' + wildcard *.zrok.io hosts intentional for /host-public
    // tunnel sharing. Dev-only; firewall must restrict 5173 on shared networks.
    host: '0.0.0.0',
    allowedHosts: ['.share.zrok.io', '.zrok.io', 'localhost'],
  },
  build: {
    // Emit brand SVGs as separate hashed files rather than inlining as data URIs.
    // Default limit is 4096 bytes; all brand SVGs are under that threshold.
    assetsInlineLimit: 0,
  },
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})

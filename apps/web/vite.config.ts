import { defineConfig } from 'vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(() => ({
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
    ...(process.env.MODE_BUDGET === '1'
      ? {
          rollupOptions: {
            output: {
              manualChunks(id: string) {
                const normalizedId = id.replace(/\\/g, '/')
                if (
                  normalizedId.includes('/src/components/ui/') &&
                  normalizedId.endsWith('.tsx')
                ) {
                  const basename = path.basename(normalizedId, '.tsx')
                  return `ui-${basename}`
                }
                return undefined
              },
            },
          },
        }
      : {}),
  },
  plugins: [
    TanStackRouterVite({
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
    ...(process.env.MODE_BUDGET === '1'
      ? [
          visualizer({
            filename: 'dist/bundle-stats.json',
            template: 'raw-data',
            gzipSize: true,
            sourcemap: false,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))

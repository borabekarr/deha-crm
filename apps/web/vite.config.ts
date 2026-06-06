import { defineConfig } from 'vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(() => ({
  server: {
    // ── Dev review channels ────────────────────────────────────────────────
    // Primary (SSH tunnel): ssh -L 5173:localhost:5173 <user>@<vps>
    //   then open http://localhost:5173 — HMR works over the same port;
    //   no --host flag needed by the client.
    // Colleague sharing (zrok): run /host-public; set PUBLIC_TUNNEL=1 if you
    //   need a wss/clientPort override for a public HTTPS tunnel endpoint.
    // ─────────────────────────────────────────────────────────────────────
    host: '0.0.0.0',
    port: 5173,
    strictPort: true, // fail fast rather than silently moving to 5174+, which breaks tunnel mapping
    allowedHosts: ['.share.zrok.io', '.zrok.io', 'localhost'],
    // HMR: no hard-coded clientPort/protocol/host overrides here so that the
    // default Vite behaviour (ws on the same host:port the browser used)
    // works cleanly over the SSH tunnel.  If PUBLIC_TUNNEL=1 is set (zrok
    // HTTPS public URL), switch to wss on port 443 so the browser can reach
    // the WebSocket through the TLS terminator.
    ...(process.env.PUBLIC_TUNNEL === '1'
      ? { hmr: { protocol: 'wss', clientPort: 443 } }
      : {}),
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
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
}))

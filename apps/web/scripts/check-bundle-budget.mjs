/**
 * Bundle budget checker for UI primitives.
 * Reads dist/bundle-stats.json (rollup-plugin-visualizer raw-data v2) and enforces
 * an 8 KB gzipped per-primitive budget by aggregating nodeParts[*].gzipLength
 * keyed by nodeMetas[*].id matching src/components/ui/*.tsx.
 *
 * Usage: node ./scripts/check-bundle-budget.mjs
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BUDGET_BYTES = 8192
const STATS_PATH = path.resolve(__dirname, '../dist/bundle-stats.json')

let stats
try {
  stats = JSON.parse(readFileSync(STATS_PATH, 'utf8'))
} catch (err) {
  console.error(`[budget] Could not read ${STATS_PATH}: ${err.message}`)
  console.error('[budget] Run with MODE_BUDGET=1 vite build first.')
  process.exit(1)
}

const { nodeMetas = {}, nodeParts = {} } = stats

// Discover UI primitive .tsx files.
const uiDir = path.resolve(__dirname, '../src/components/ui')
let uiFiles
try {
  uiFiles = readdirSync(uiDir)
    .filter((f) => f.endsWith('.tsx'))
    .map((f) => f.replace(/\.tsx$/, ''))
} catch (err) {
  console.error(`[budget] Could not read UI dir ${uiDir}: ${err.message}`)
  process.exit(1)
}

// For each primitive, sum gzipLength from all matching nodeParts entries.
// nodeMetas[metaUid].id is the full source path; normalize backslashes.
// nodeMetas[metaUid].moduleParts maps chunkName -> uid into nodeParts.
const results = []
for (const primitive of uiFiles) {
  const suffix = `src/components/ui/${primitive}.tsx`
  let total = 0

  for (const meta of Object.values(nodeMetas)) {
    const id = (meta.id ?? '').replace(/\\/g, '/')
    if (!id.endsWith(suffix)) continue

    for (const uid of Object.values(meta.moduleParts ?? {})) {
      const part = nodeParts[uid]
      if (part && typeof part.gzipLength === 'number') {
        total += part.gzipLength
      }
    }
  }

  let status
  if (total === 0) {
    status = 'not bundled'
  } else if (total > BUDGET_BYTES) {
    status = `OVER BUDGET (${total} > ${BUDGET_BYTES})`
  } else {
    status = 'OK'
  }

  results.push({ primitive, gzipBytes: total, status })
}

// Print markdown table.
const pad = (s, n) => String(s).padEnd(n)
const colW = [
  Math.max(9, ...results.map((r) => r.primitive.length)),
  14,
  Math.max(6, ...results.map((r) => r.status.length)),
]

const header = `| ${pad('primitive', colW[0])} | ${pad('gzipped size', colW[1])} | ${pad('status', colW[2])} |`
const sep = `| ${'-'.repeat(colW[0])} | ${'-'.repeat(colW[1])} | ${'-'.repeat(colW[2])} |`

console.log('')
console.log('## Bundle Budget Report — UI Primitives (budget: 8 KB gz each)')
console.log('')
console.log(header)
console.log(sep)

for (const { primitive, gzipBytes, status } of results) {
  const sizeStr = gzipBytes === 0 ? '—' : `${gzipBytes} B`
  console.log(`| ${pad(primitive, colW[0])} | ${pad(sizeStr, colW[1])} | ${pad(status, colW[2])} |`)
}
console.log('')

const failures = results.filter((r) => r.gzipBytes > BUDGET_BYTES)
if (failures.length > 0) {
  console.error(
    `[budget] FAIL: ${failures.length} primitive(s) exceed 8 KB gzip budget:\n` +
      failures.map((f) => `  - ${f.primitive}: ${f.gzipBytes} B`).join('\n'),
  )
  process.exit(1)
}

console.log('[budget] PASS: all primitives within 8 KB gzip budget.')

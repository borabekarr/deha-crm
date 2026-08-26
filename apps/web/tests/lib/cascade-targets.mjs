/**
 * Route derivation for the motion-cascade harness. Reads the registry with
 * fs+regex, not a live import — importing component-registry.ts pulls in
 * every React.lazy() module and crashes under plain Node/ts-node, the same
 * constraint documented in animation-spam.spec.ts (readRegistryFinishedSlugs).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REGISTRY_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../src/lib/component-registry.ts',
)

/** @returns {string[]} slugs of every registry entry marked status: 'Finished' */
export function getFinishedSlugs() {
  const src = fs.readFileSync(REGISTRY_PATH, 'utf8')
  const slugs = [...src.matchAll(/slug:\s*'([^']+)'/g)].map((m) => m[1])
  const statuses = [...src.matchAll(/status:\s*'([^']+)'/g)].map((m) => m[1])
  return slugs.filter((_, i) => statuses[i] === 'Finished')
}

/** @param {string} slug @returns {string} the route path for a registry slug */
export function routePathForSlug(slug) {
  return `/components/${slug}`
}

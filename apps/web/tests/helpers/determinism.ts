/**
 * Deterministic rendering: seed Math.random (xorshift32, fixed seed) and
 * freeze the wall clock so components deriving geometry or live time from
 * them render identically every run, locally and on CI. Extracted
 * byte-identical from design-system.spec.ts's beforeEach — zero pixel impact.
 */
export async function installDeterminism(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript(() => {
    let s = 0x2545f491 >>> 0
    Math.random = () => {
      s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0
      return s / 0xffffffff
    }
    // Pinned to the capture day (2026-06-17 UTC): day-granular renders stay
    // unchanged, only live clocks (e.g. currency-converter's HH:MM) become
    // deterministic. Argument forms (new Date(ms/y,m,d), parsing) preserved.
    const FIXED = new Date('2026-06-17T12:00:00Z').getTime()
    const RealDate = Date
    class FrozenDate extends RealDate {
      constructor(...args: ConstructorParameters<typeof Date> | []) {
        if (args.length === 0) {
          super(FIXED)
        } else {
          super(...(args as ConstructorParameters<typeof Date>))
        }
      }
      static now() {
        return FIXED
      }
    }
    globalThis.Date = FrozenDate as DateConstructor
  })
}

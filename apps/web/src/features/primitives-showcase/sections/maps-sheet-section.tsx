import { MapsSheet } from '@/components/ui/maps-sheet'

const SEARCH_RESULTS = [
  {
    id: 'golden-gate',
    emoji: '🌉',
    name: 'Golden Gate Bridge',
    address: 'Golden Gate Bridge, San Francisco, CA',
    distance: '2.3 mi',
    category: 'Landmark',
    categoryColor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    id: 'fishermans',
    emoji: '🦞',
    name: "Fisherman's Wharf",
    address: 'Beach St & The Embarcadero, SF',
    distance: '1.1 mi',
    category: 'Food & Drink',
    categoryColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
  {
    id: 'union-square',
    emoji: '🛍️',
    name: 'Union Square',
    address: 'Post St & Stockton St, San Francisco',
    distance: '0.4 mi',
    category: 'Shopping',
    categoryColor: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    id: 'exploratorium',
    emoji: '🔭',
    name: 'Exploratorium',
    address: 'Pier 15, The Embarcadero, San Francisco',
    distance: '1.8 mi',
    category: 'Museum',
    categoryColor: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  },
  {
    id: 'alcatraz',
    emoji: '🏝️',
    name: 'Alcatraz Island',
    address: 'San Francisco Bay, CA',
    distance: '3.5 mi',
    category: 'Attraction',
    categoryColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    id: 'ghirardelli',
    emoji: '🍫',
    name: 'Ghirardelli Square',
    address: '900 N Point St, San Francisco',
    distance: '2.1 mi',
    category: 'Food & Drink',
    categoryColor: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
]

export function MapsSheetSection() {
  return (
    <section id="maps-sheet" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Maps Sheet</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Apple Maps-style bottom sheet with three detents (peek / half / full),
          rubber-band overscroll, and dimming pegged to snap index.
        </p>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          Ported from rit3zh/expo-apple-maps-sheet (rebased on Vaul).
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-400">
          Search results sheet
        </p>

        <MapsSheet.Root>
          <MapsSheet.Trigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-700 dark:text-neutral-200 shadow-sm hover:bg-neutral-100 dark:hover:bg-neutral-600 transition-colors"
            >
              {/* Search icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              Search nearby places
            </button>
          </MapsSheet.Trigger>

          <MapsSheet.Content>
            <MapsSheet.Header>
              <MapsSheet.Title>Nearby Places</MapsSheet.Title>
              <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
                6 results near San Francisco
              </p>
            </MapsSheet.Header>

            <div className="space-y-2">
              {SEARCH_RESULTS.map((place) => (
                <button
                  key={place.id}
                  type="button"
                  className="flex w-full items-center gap-3 rounded-xl border border-neutral-100 dark:border-neutral-700/60 bg-neutral-50 dark:bg-neutral-800/60 px-3 py-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-700/60 transition-colors"
                >
                  {/* Emoji icon */}
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-neutral-700 text-xl shadow-sm"
                    aria-hidden="true"
                  >
                    {place.emoji}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {place.name}
                    </p>
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {place.address}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {place.distance}
                    </span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${place.categoryColor}`}
                    >
                      {place.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </MapsSheet.Content>
        </MapsSheet.Root>

        <p className="mt-3 text-xs text-neutral-400">
          Drag the sheet to cycle through peek (18%), half (50%), and full (95%) snap points.
        </p>
      </div>
    </section>
  )
}

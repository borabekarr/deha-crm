import { useState } from 'react'
import { Combobox } from '@/components/ui/combobox'

const CITIES = [
  { value: 'istanbul', label: 'Istanbul' },
  { value: 'ankara', label: 'Ankara' },
  { value: 'izmir', label: 'Izmir' },
  { value: 'bursa', label: 'Bursa' },
  { value: 'antalya', label: 'Antalya' },
  { value: 'adana', label: 'Adana' },
]

const LEADS = [
  { value: 'ahmet-y', label: 'Ahmet Yilmaz' },
  { value: 'selin-k', label: 'Selin Kaya' },
  { value: 'mert-d', label: 'Mert Demir' },
  { value: 'zeynep-a', label: 'Zeynep Arslan' },
  { value: 'bora-b', label: 'Bora Bekar' },
]

export function ComboboxSection() {
  const [city, setCity] = useState('')
  const [lead, setLead] = useState('')

  return (
    <section id="combobox" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Combobox</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Searchable dropdown combining a text input with a filterable list of options.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">City picker</p>
        <Combobox
          options={CITIES}
          value={city}
          onValueChange={setCity}
          placeholder="Search city..."
          emptyText="No city found"
          className="w-64"
        />
        {city && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Selected: <span className="font-semibold text-emerald-600">{city}</span>
          </p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Lead search</p>
        <Combobox
          options={LEADS}
          value={lead}
          onValueChange={setLead}
          placeholder="Search lead..."
          emptyText="No lead found"
          className="w-64"
        />
        {lead && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Assigned to: <span className="font-semibold text-emerald-600">{lead}</span>
          </p>
        )}
      </div>
    </section>
  )
}

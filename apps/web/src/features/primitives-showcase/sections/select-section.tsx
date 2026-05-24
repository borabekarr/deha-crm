import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select'

export function SelectSection() {
  return (
    <section id="select" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Select</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Accessible dropdown selection with grouped items and placeholder text.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Basic select</p>
        <Select>
          <SelectTrigger className="w-64" aria-label="Select a region">
            <SelectValue placeholder="Select a region" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="istanbul">Istanbul</SelectItem>
            <SelectItem value="ankara">Ankara</SelectItem>
            <SelectItem value="izmir">Izmir</SelectItem>
            <SelectItem value="bursa">Bursa</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Grouped select</p>
        <Select>
          <SelectTrigger className="w-64" aria-label="Select lead stage">
            <SelectValue placeholder="Select lead stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Active</SelectLabel>
              <SelectItem value="new">New Lead</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
            </SelectGroup>
            <SelectGroup>
              <SelectLabel>Closed</SelectLabel>
              <SelectItem value="won">Won</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Disabled</p>
        <Select disabled>
          <SelectTrigger className="w-64" aria-label="Disabled select">
            <SelectValue placeholder="Disabled select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="a">Option A</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}

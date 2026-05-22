import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'

export function DropdownMenuSection() {
  return (
    <section id="dropdown-menu" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Dropdown Menu</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Context-sensitive action menus with labels, separators, and checkbox items.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Basic action menu</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
            >
              Actions
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Lead Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <span>Edit Lead</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Call Lead</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span>Send Email</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span className="text-red-600">Delete Lead</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">With checkboxes</p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-200"
            >
              View Options
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>Name</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked>Company</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Value</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked>Stage</DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </section>
  )
}

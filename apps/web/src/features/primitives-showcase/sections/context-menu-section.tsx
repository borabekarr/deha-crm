import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuCheckboxItem,
} from '@/components/ui/context-menu'

export function ContextMenuSection() {
  return (
    <section id="context-menu" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">Context Menu</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Right-click activated contextual menus with grouped items and checkboxes.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Right-click on the card below</p>
        <ContextMenu>
          <ContextMenuTrigger>
            <div className="flex cursor-context-menu items-center justify-between rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-700 px-4 py-6 text-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Ahmet Yilmaz</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Acme Corp · Qualified</p>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">Right-click for actions</p>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuLabel>Lead Actions</ContextMenuLabel>
            <ContextMenuSeparator />
            <ContextMenuItem>Edit Lead</ContextMenuItem>
            <ContextMenuItem>Call Lead</ContextMenuItem>
            <ContextMenuItem>Send Email</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuCheckboxItem checked>Mark as Favorite</ContextMenuCheckboxItem>
            <ContextMenuSeparator />
            <ContextMenuItem>
              <span className="text-red-600">Delete Lead</span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4 space-y-4">
        <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Table row context menu</p>
        <div className="space-y-1">
          {['Selin Kaya', 'Mert Demir', 'Zeynep Arslan'].map((name) => (
            <ContextMenu key={name}>
              <ContextMenuTrigger>
                <div className="flex cursor-context-menu items-center justify-between rounded-lg px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-600 transition-colors">
                  <span className="text-sm font-medium text-neutral-700 dark:text-neutral-200">{name}</span>
                  <span className="text-xs text-neutral-400">right-click</span>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>View {name}</ContextMenuItem>
                <ContextMenuItem>Edit</ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>
                  <span className="text-red-600">Remove</span>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </div>
    </section>
  )
}

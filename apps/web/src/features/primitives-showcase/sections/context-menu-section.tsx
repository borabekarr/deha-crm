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
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Context Menu</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Right-click activated contextual menus with grouped items and checkboxes.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Right-click on the card below</p>
        <ContextMenu>
          <ContextMenuTrigger>
            <div className="flex cursor-context-menu items-center justify-between rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-6 text-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Ahmet Yilmaz</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Acme Corp · Qualified</p>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">Right-click for actions</p>
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

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Table row context menu</p>
        <div className="space-y-1">
          {['Selin Kaya', 'Mert Demir', 'Zeynep Arslan'].map((name) => (
            <ContextMenu key={name}>
              <ContextMenuTrigger>
                <div className="flex cursor-context-menu items-center justify-between rounded-lg px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{name}</span>
                  <span className="text-xs text-slate-400">right-click</span>
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

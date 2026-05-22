import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarItem,
} from '@/components/ui/sidebar'

export function SidebarSection() {
  return (
    <section id="sidebar" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Sidebar</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Persistent left-edge navigation that collapses to icons on narrow screens.
        </p>
      </div>

      {/* Variant 1: Expanded sidebar mockup */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="mb-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Expanded (desktop)</p>
        <div className="h-72 flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <Sidebar defaultCollapsed={false}>
            <SidebarHeader>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">deha<span className="text-emerald-500">.</span></span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarItem
                href="#sidebar"
                icon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>dashboard</span>}
                active
              >
                Dashboard
              </SidebarItem>
              <SidebarItem
                href="#sidebar"
                icon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>people</span>}
              >
                Leads
              </SidebarItem>
              <SidebarItem
                href="#sidebar"
                icon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>task_alt</span>}
              >
                Tasks
              </SidebarItem>
              <SidebarItem
                href="#sidebar"
                icon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>bar_chart</span>}
              >
                Reports
              </SidebarItem>
            </SidebarContent>
            <SidebarFooter>
              <SidebarItem
                href="#sidebar"
                icon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>settings</span>}
              >
                Settings
              </SidebarItem>
            </SidebarFooter>
          </Sidebar>

          {/* Main area placeholder */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <p className="text-xs text-slate-400">Main content area</p>
          </div>
        </div>
      </div>

      {/* Variant 2: Collapsed sidebar */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
        <p className="mb-4 text-xs font-medium text-slate-400 uppercase tracking-wider">Collapsed (icon-only)</p>
        <div className="h-72 flex overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <Sidebar defaultCollapsed={true}>
            <SidebarHeader>
              <span className="text-sm font-black text-emerald-500">d</span>
            </SidebarHeader>
            <SidebarContent>
              <SidebarItem href="#sidebar" icon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>dashboard</span>} active />
              <SidebarItem href="#sidebar" icon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>people</span>} />
              <SidebarItem href="#sidebar" icon={<span className="material-symbols-outlined" style={{ fontSize: 20 }}>task_alt</span>} />
            </SidebarContent>
          </Sidebar>
          <div className="flex-1 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <p className="text-xs text-slate-400">Main content area</p>
          </div>
        </div>
      </div>
    </section>
  )
}

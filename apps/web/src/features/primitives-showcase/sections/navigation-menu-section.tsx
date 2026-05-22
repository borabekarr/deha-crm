import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'

export function NavigationMenuSection() {
  return (
    <section id="navigation-menu" className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Navigation Menu</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Horizontal pill nav bar with flyout panels for nested link groups.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Top bar navigation</p>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#navigation-menu">Home</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Leads</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-48 p-2 space-y-1">
                  {['All Leads', 'New Leads', 'Qualified', 'Closed'].map((item) => (
                    <a
                      key={item}
                      href="#navigation-menu"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {item}
                    </a>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Reports</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-48 p-2 space-y-1">
                  {['Sales Report', 'Lead Report', 'Activity'].map((item) => (
                    <a
                      key={item}
                      href="#navigation-menu"
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {item}
                    </a>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#navigation-menu">Settings</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 space-y-4">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Minimal links only</p>
        <NavigationMenu>
          <NavigationMenuList>
            {['Dashboard', 'Leads', 'Tasks', 'Reports'].map((item) => (
              <NavigationMenuItem key={item}>
                <NavigationMenuLink href="#navigation-menu">{item}</NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </section>
  )
}

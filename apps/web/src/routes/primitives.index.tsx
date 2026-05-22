import { createFileRoute } from '@tanstack/react-router'
import {
  TabsSection,
  BadgeSection,
  PopoverSection,
  SelectSection,
  ComboboxSection,
  SidebarSection,
  SheetSection,
  ScrollAreaSection,
  DatePickerSection,
  PaginationSection,
  NavigationMenuSection,
  DropdownMenuSection,
  TooltipSection,
  DialogSection,
  ToastSection,
  ContextMenuSection,
  CalendarSection,
} from '@/features/primitives-showcase/sections'

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------
export const Route = createFileRoute('/primitives/')({
  component: PrimitivesIndexPage,
})

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
function PrimitivesIndexPage() {
  return (
    <div className="max-w-2xl space-y-16">
      {/* Intro */}
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          deha<span className="text-emerald-500">.</span> primitives
        </h1>
        <p className="text-base text-slate-500 dark:text-slate-400">
          17 hand-crafted UI components. Each section shows 2-4 interactive variants.
          Use the left rail to jump to any section.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {['Radix UI', 'Vaul', 'cmdk', 'react-day-picker', 'Tailwind CSS'].map((lib) => (
            <span
              key={lib}
              className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300"
            >
              {lib}
            </span>
          ))}
        </div>
      </div>

      {/* Sections — all rendered vertically; anchor links in left rail scroll here */}
      <TabsSection />
      <BadgeSection />
      <PopoverSection />
      <SelectSection />
      <ComboboxSection />
      <SidebarSection />
      <SheetSection />
      <ScrollAreaSection />
      <DatePickerSection />
      <PaginationSection />
      <NavigationMenuSection />
      <DropdownMenuSection />
      <TooltipSection />
      <DialogSection />
      <ToastSection />
      <ContextMenuSection />
      <CalendarSection />

      {/* Bottom spacer */}
      <div className="h-16" />
    </div>
  )
}

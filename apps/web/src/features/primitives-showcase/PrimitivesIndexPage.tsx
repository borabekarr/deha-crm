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
  MotionTabsSection,
  ToastivaSection,
  SwipeActionsSection,
  WheelDatePickerSection,
  LinearBottomTabsSection,
  MapsSheetSection,
  ProgressiveBlurSection,
  IOSPopoverSection,
  FABSection,
} from '@/features/primitives-showcase/sections'

export function PrimitivesIndexPage() {
  return (
    <div className="max-w-2xl space-y-16">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
          deha<span className="text-emerald-500">.</span> primitives
        </h1>
        <p className="text-base text-neutral-500 dark:text-neutral-400">
          26 hand-crafted UI components. Each section shows 2-4 interactive variants.
          Use the left rail to jump to any section.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {['Radix UI', 'Vaul', 'cmdk', 'react-day-picker', '@use-gesture/react', 'Tailwind CSS'].map((lib) => (
            <span
              key={lib}
              className="inline-flex items-center rounded-full bg-neutral-100 dark:bg-neutral-800 px-3 py-1 text-xs font-medium text-neutral-600 dark:text-neutral-300"
            >
              {lib}
            </span>
          ))}
        </div>
      </div>

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
      <MotionTabsSection />
      <ToastivaSection />
      <SwipeActionsSection />
      <WheelDatePickerSection />
      <LinearBottomTabsSection />
      <MapsSheetSection />
      <ProgressiveBlurSection />
      <IOSPopoverSection />
      <FABSection />

      <div className="h-16" />
    </div>
  )
}

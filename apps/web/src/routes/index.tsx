import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: ShowcasePage,
})

const COMPONENT_PLACEHOLDERS = [
  'Button',
  'Badge',
  'Card',
  'Dialog',
  'Dropdown Menu',
  'Input',
  'Select',
  'Tabs',
  'Toast',
  'Tooltip',
  'Combobox',
  'Date Picker',
  'Popover',
  'Scroll Area',
  'Navigation Menu',
]

function ShowcasePage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Component Showcase</h1>
      <p className="mb-6 text-muted-foreground">
        Components will appear here as the design system pipeline progresses.
      </p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {COMPONENT_PLACEHOLDERS.map((name) => (
          <li
            key={name}
            className="rounded border px-4 py-3 text-sm font-medium text-foreground"
          >
            {name}
          </li>
        ))}
      </ul>
    </div>
  )
}

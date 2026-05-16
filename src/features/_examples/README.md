# Form Stack — Deha CRM

Every form in this project uses the following stack. No exceptions.

## Required Stack

| Layer | Package | Purpose |
|---|---|---|
| Schema | `zod` | Type-safe validation schema |
| Form state | `react-hook-form` | Form state, dirty/touched, submit handling |
| Resolver | `@hookform/resolvers/zod` | Bridges zod schema to react-hook-form |
| UI | Shadcn `Form` components | Accessible form primitives |

## Rules

- **No bare `<input>` without a `FormControl` wrapper** — always use `FormField` + `FormControl` + `FormItem`.
- **No manual `useState` for field values** — react-hook-form owns all field state.
- **No custom validation logic** — define all rules in the Zod schema.
- **No `useEffect` for form side-effects** — use `form.watch()`, `form.setValue()`, or `onSubmit` instead.

## Minimal Template

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const schema = z.object({
  field: z.string().min(1, "Required"),
})

type FormValues = z.infer<typeof schema>

export default function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { field: "" },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(console.log)} className="space-y-4">
        <FormField
          control={form.control}
          name="field"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field</FormLabel>
              <FormControl>
                <input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <button type="submit">Submit</button>
      </form>
    </Form>
  )
}
```

See `example-form.tsx` in this directory for a working implementation with email + name fields.

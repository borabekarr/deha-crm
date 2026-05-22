import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToasts, dismissToast } from '@/hooks/use-toast'

// ---------------------------------------------------------------------------
// Toaster — singleton; mount once in __root.tsx
// ---------------------------------------------------------------------------
export default function Toaster() {
  const toasts = useToasts()

  return (
    <ToastProvider>
      {toasts.map((t) => (
        <Toast
          key={t.id}
          variant={t.variant}
          open
          onOpenChange={(open) => {
            if (!open) dismissToast(t.id)
          }}
        >
          <div className="flex flex-col gap-1">
            {t.title && <ToastTitle>{t.title}</ToastTitle>}
            {t.description && (
              <ToastDescription>{t.description}</ToastDescription>
            )}
          </div>
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}

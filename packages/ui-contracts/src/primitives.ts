import type { ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Shared motion hint — every primitive accepts this so callers can suppress
// animation without coupling to a specific animation library.
// ---------------------------------------------------------------------------
export interface MotionAwareProps {
  reducedMotion?: 'auto' | 'reduce' | 'no-preference';
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
export interface TabsProps extends MotionAwareProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Popover
// ---------------------------------------------------------------------------
export interface PopoverProps extends MotionAwareProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------
export interface SelectProps extends MotionAwareProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Combobox
// ---------------------------------------------------------------------------
export interface ComboboxProps extends MotionAwareProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onInputChange?: (input: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------
export interface SidebarProps extends MotionAwareProps {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  side?: 'left' | 'right';
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Sheet (slide-over panel)
// ---------------------------------------------------------------------------
export interface SheetProps extends MotionAwareProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// ScrollArea
// ---------------------------------------------------------------------------
export interface ScrollAreaProps extends MotionAwareProps {
  type?: 'auto' | 'always' | 'scroll' | 'hover';
  scrollHideDelay?: number;
  orientation?: 'vertical' | 'horizontal' | 'both';
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// DatePicker
// ---------------------------------------------------------------------------
export interface DatePickerProps extends MotionAwareProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export interface PaginationProps extends MotionAwareProps {
  page: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  siblingCount?: number;
  disabled?: boolean;
}

// ---------------------------------------------------------------------------
// NavigationMenu
// ---------------------------------------------------------------------------
export interface NavigationMenuProps extends MotionAwareProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// DropdownMenu
// ---------------------------------------------------------------------------
export interface DropdownMenuProps extends MotionAwareProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------
export interface TooltipProps extends MotionAwareProps {
  content: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  delayDuration?: number;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Dialog
// ---------------------------------------------------------------------------
export interface DialogProps extends MotionAwareProps {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
export interface ToastProps extends MotionAwareProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
  duration?: number;
  onOpenChange?: (open: boolean) => void;
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
export interface BadgeProps extends MotionAwareProps {
  variant?: 'default' | 'outline' | 'secondary' | 'destructive';
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// ContextMenu
// ---------------------------------------------------------------------------
export interface ContextMenuProps extends MotionAwareProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  modal?: boolean;
  children: ReactNode;
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------
export interface CalendarProps extends MotionAwareProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  mode?: 'single' | 'range' | 'multiple';
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

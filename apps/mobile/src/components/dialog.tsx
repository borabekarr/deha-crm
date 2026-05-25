import React, {
  createContext,
  use,
  useCallback,
  useMemo,
  useState,
} from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { DialogProps } from '@deha/ui-contracts';
import { windowMorph } from '../lib/choreography';
import { colors } from '../lib/tokens';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
interface DialogCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  isReduced: boolean;
}

const DialogContext = createContext<DialogCtx | null>(null);

function useDialogCtx() {
  const ctx = use(DialogContext);
  if (!ctx) throw new Error('Dialog sub-component used outside <Dialog>');
  return ctx;
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------
function DialogRoot({
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  reducedMotion,
  children,
}: DialogProps) {
  const osReduced = useReducedMotion();
  const isReduced =
    reducedMotion === 'reduce' ||
    (reducedMotion !== 'no-preference' && osReduced);

  const [internal, setInternal] = useState(defaultOpen);
  const open = controlledOpen !== undefined ? controlledOpen : internal;

  const setOpen = useCallback(
    (v: boolean) => {
      if (controlledOpen === undefined) setInternal(v);
      onOpenChange?.(v);
    },
    [controlledOpen, onOpenChange],
  );

  const ctxValue = useMemo(
    () => ({ open, setOpen, isReduced }),
    [open, setOpen, isReduced],
  );

  return (
    <DialogContext.Provider value={ctxValue}>
      {children}
    </DialogContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Content (Modal wrapper with scrim + animated card)
// ---------------------------------------------------------------------------
interface ContentProps {
  children: React.ReactNode;
}

function Content({ children }: ContentProps) {
  const { open, setOpen, isReduced } = useDialogCtx();

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.92);

  const cfg = windowMorph({ reducedMotion: isReduced });

  const dismiss = useCallback(() => setOpen(false), [setOpen]);

  const handleShow = useCallback(() => {
    opacity.value = withTiming(1, { duration: cfg.duration, easing: cfg.easing });
    scale.value = withTiming(1, { duration: cfg.duration, easing: cfg.easing });
  }, [opacity, scale, cfg]);

  const scrimStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Modal
      visible={open}
      transparent
      animationType="none"
      onShow={handleShow}
      onRequestClose={dismiss}
      statusBarTranslucent
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrimStyle]} />
      <View style={styles.overlay} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <Animated.View style={[styles.card, cardStyle]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

// Sub-components
function Header({ children }: { children: React.ReactNode }) {
  return <View style={styles.header}>{children}</View>;
}
function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}
function DialogContent({ children }: { children: React.ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}
function Footer({ children }: { children: React.ReactNode }) {
  return <View style={styles.footer}>{children}</View>;
}

// ---------------------------------------------------------------------------
// Compound export
// ---------------------------------------------------------------------------
export const Dialog = Object.assign(DialogRoot, {
  Content,
  Header,
  Title,
  DialogContent,
  Footer,
});

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  scrim: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  body: {
    padding: 20,
  },
  footer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});

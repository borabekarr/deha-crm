import { HEADING_PODCASTS } from "@/constants/dummy/home/podcasts";
import { SfProFont, useSfProFont } from "@/hooks/useSfProFont";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import type {
  ComponentProps,
  FC,
  FunctionComponent,
  JSX,
  ReactElement,
  ReactNode,
} from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import type { IPalette, IPopupRenderContext } from "../typings/motion-tabs";

const isIOS = Platform.OS === "ios";

interface IQuickAction {
  key: string;
  label: string;
  trailing?: string;
  sfSymbol: ComponentProps<typeof SymbolView>["name"];
  ionicon: ComponentProps<typeof Ionicons>["name"];
}

const QUICK_ACTIONS: IQuickAction[] = [
  { key: "library", label: "Library", sfSymbol: "books.vertical", ionicon: "library-outline" },
  { key: "downloads", label: "Downloads", trailing: "3", sfSymbol: "arrow.down.circle", ionicon: "download-outline" },
  { key: "bookmarks", label: "Bookmarks", sfSymbol: "bookmark", ionicon: "bookmark-outline" },
  { key: "sleep", label: "Sleep timer", trailing: "Off", sfSymbol: "moon.zzz", ionicon: "moon-outline" },
];

const ActionIcon: FC<{
  sfSymbol: IQuickAction["sfSymbol"];
  ionicon: IQuickAction["ionicon"];
  color: string;
}> = ({ sfSymbol, ionicon, color }) => {
  if (isIOS) {
    return <SymbolView name={sfSymbol} size={18} tintColor={color} resizeMode="scaleAspectFit" />;
  }
  return <Ionicons name={ionicon} size={18} color={color} />;
};

const HomePopupBody: FC<IPopupRenderContext> &
  FunctionComponent<IPopupRenderContext> = ({
  colors,
}: IPopupRenderContext & ComponentProps<typeof HomePopupBody>):
  | (ReactNode & ReactElement & JSX.Element)
  | null => {
  const { loaded } = useSfProFont();
  const nowPlaying = HEADING_PODCASTS[0];
  const progress = Math.max(0, Math.min(1, nowPlaying.progress));
  const fontMedium = loaded ? SfProFont.medium : undefined;
  const fontBold = loaded ? SfProFont.bold : undefined;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          { backgroundColor: nowPlaying.backgroundColor },
        ]}
      >
        <Image source={{ uri: nowPlaying.artwork }} style={styles.artwork} />
        <View style={styles.cardMeta}>
          <Text style={[styles.eyebrow, { fontFamily: fontMedium }]}>
            Continue Listening
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.cardTitle, { fontFamily: fontBold }]}
          >
            {nowPlaying.title}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.cardAuthor, { fontFamily: fontMedium }]}
          >
            {nowPlaying.author}
          </Text>

          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={[styles.timeLeft, { fontFamily: fontMedium }]}>
              {nowPlaying.timeLeft}
            </Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.playButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          hitSlop={8}
        >
          {isIOS ? (
            <SymbolView name="play.fill" size={16} tintColor="#fff" />
          ) : (
            <Ionicons name="play" size={16} color="#fff" />
          )}
        </Pressable>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.actions}>
        {QUICK_ACTIONS.map((action) => (
          <ActionRow
            key={action.key}
            action={action}
            colors={colors}
            fontMedium={fontMedium}
          />
        ))}
      </View>
    </View>
  );
};

const ActionRow: FC<{
  action: IQuickAction;
  colors: IPalette;
  fontMedium: string | undefined;
}> = ({ action, colors, fontMedium }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionRow,
        { backgroundColor: pressed ? colors.hover : "transparent" },
      ]}
    >
      <ActionIcon
        sfSymbol={action.sfSymbol}
        ionicon={action.ionicon}
        color={colors.foreground}
      />
      <Text
        style={[
          styles.actionLabel,
          { color: colors.foreground, fontFamily: fontMedium },
        ]}
      >
        {action.label}
      </Text>
      {action.trailing ? (
        <Text
          style={[
            styles.actionTrailing,
            { color: colors.muted, fontFamily: fontMedium },
          ]}
        >
          {action.trailing}
        </Text>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    minWidth: 300,
    padding: 10,
    gap: 8,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 16,
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  cardMeta: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 11,
    color: "rgba(0,0,0,0.55)",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 15,
    lineHeight: 18,
    color: "#111",
  },
  cardAuthor: {
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(0,0,0,0.55)",
    marginTop: 1,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.15)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#111",
    borderRadius: 999,
  },
  timeLeft: {
    fontSize: 11,
    color: "rgba(0,0,0,0.65)",
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 6,
    opacity: 0.6,
  },
  actions: {
    gap: 2,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
  },
  actionTrailing: {
    fontSize: 12,
  },
});

export { HomePopupBody };

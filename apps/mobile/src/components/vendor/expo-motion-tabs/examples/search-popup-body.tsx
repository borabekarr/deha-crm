import { DISCOVER_PODCASTS } from "@/constants/dummy/home/podcasts";
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

import type { IPopupRenderContext } from "../typings/motion-tabs";

const isIOS = Platform.OS === "ios";

const CATEGORIES = ["Fiction", "Self-help", "Business", "History"];
const RECENT = DISCOVER_PODCASTS.slice(0, 3);

const SearchPopupBody: FC<IPopupRenderContext> &
  FunctionComponent<IPopupRenderContext> = ({
  colors,
}: IPopupRenderContext & ComponentProps<typeof SearchPopupBody>):
  | (ReactNode & ReactElement & JSX.Element)
  | null => {
  const { loaded } = useSfProFont();
  const fontMedium = loaded ? SfProFont.medium : undefined;
  const fontBold = loaded ? SfProFont.bold : undefined;

  return (
    <View style={styles.container}>
      <View style={[styles.searchField, { backgroundColor: colors.input }]}>
        {isIOS ? (
          <SymbolView name="magnifyingglass" size={15} tintColor={colors.muted} />
        ) : (
          <Ionicons name="search" size={15} color={colors.muted} />
        )}
        <Text
          style={[
            styles.searchPlaceholder,
            { color: colors.muted, fontFamily: fontMedium },
          ]}
        >
          Search audiobooks, authors…
        </Text>
      </View>

      <Text
        style={[
          styles.sectionLabel,
          { color: colors.muted, fontFamily: fontMedium },
        ]}
      >
        Browse
      </Text>

      <View style={styles.chipRow}>
        {CATEGORIES.map((c) => (
          <Pressable
            key={c}
            style={({ pressed }) => [
              styles.chip,
              {
                backgroundColor: pressed ? colors.hover : colors.input,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: colors.foreground, fontFamily: fontMedium },
              ]}
            >
              {c}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text
        style={[
          styles.sectionLabel,
          { color: colors.muted, fontFamily: fontMedium },
        ]}
      >
        Recent
      </Text>

      <View style={styles.recentList}>
        {RECENT.map((item) => (
          <Pressable
            key={item.id}
            style={({ pressed }) => [
              styles.recentRow,
              { backgroundColor: pressed ? colors.hover : "transparent" },
            ]}
          >
            <Image source={{ uri: item.artwork }} style={styles.artwork} />
            <View style={styles.recentMeta}>
              <Text
                numberOfLines={1}
                style={[
                  styles.recentTitle,
                  { color: colors.foreground, fontFamily: fontBold },
                ]}
              >
                {item.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.recentAuthor,
                  { color: colors.muted, fontFamily: fontMedium },
                ]}
              >
                {item.author}
              </Text>
            </View>
            {isIOS ? (
              <SymbolView name="arrow.up.left" size={14} tintColor={colors.muted} />
            ) : (
              <Ionicons name="arrow-up-outline" size={14} color={colors.muted} />
            )}
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export { SearchPopupBody };

const styles = StyleSheet.create({
  container: {
    minWidth: 320,
    padding: 10,
    gap: 10,
  },
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchPlaceholder: {
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginTop: 2,
    marginLeft: 4,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: {
    fontSize: 13,
  },
  recentList: {
    gap: 2,
  },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
  },
  artwork: {
    width: 36,
    height: 36,
    borderRadius: 6,
  },
  recentMeta: {
    flex: 1,
    minWidth: 0,
  },
  recentTitle: {
    fontSize: 13.5,
    lineHeight: 17,
  },
  recentAuthor: {
    fontSize: 12,
    lineHeight: 15,
    marginTop: 1,
  },
});

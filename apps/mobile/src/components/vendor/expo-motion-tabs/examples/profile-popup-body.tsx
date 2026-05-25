import { SfProFont, useSfProFont } from "@/hooks/useSfProFont";
import { Ionicons } from "@expo/vector-icons";
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

import { Image } from "expo-image";
import type { IPalette, IPopupRenderContext } from "../typings/motion-tabs";

const isIOS = Platform.OS === "ios";

interface IAction {
  key: string;
  label: string;
  trailing?: string;
  sfSymbol: ComponentProps<typeof SymbolView>["name"];
  ionicon: ComponentProps<typeof Ionicons>["name"];
}

const ACTIONS: IAction[] = [
  {
    key: "personal_details",
    label: "Personal Details",
    sfSymbol: "person.crop.circle.fill",
    ionicon: "person-circle",
  },
  {
    key: "appearance",
    label: "Appearance",
    trailing: "Dark",
    sfSymbol: "moon.fill",
    ionicon: "moon",
  },
  {
    key: "help",
    label: "Help & Feedback",
    sfSymbol: "questionmark.circle.fill",
    ionicon: "help-circle",
  },
];

const ActionIcon: FC<{
  sfSymbol: IAction["sfSymbol"];
  ionicon: IAction["ionicon"];
  color: string;
}> = ({ sfSymbol, ionicon, color }) => {
  if (isIOS) {
    return (
      <SymbolView
        name={sfSymbol}
        size={13}
        tintColor={color}
        resizeMode="scaleAspectFit"
      />
    );
  }
  return <Ionicons name={ionicon} size={14} color={color} />;
};

const ProfilePopupBody: FC<IPopupRenderContext> &
  FunctionComponent<IPopupRenderContext> = ({
  colors,
}: IPopupRenderContext & ComponentProps<typeof ProfilePopupBody>):
  | (ReactNode & ReactElement & JSX.Element)
  | null => {
  const { loaded } = useSfProFont();
  const fontMedium = loaded ? SfProFont.medium : undefined;
  const fontBold = loaded ? SfProFont.bold : undefined;
  const fontRegular = loaded ? SfProFont.regular : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Image
            cachePolicy={"memory-disk"}
            source={{
              uri: "https://pbs.twimg.com/profile_images/2018442567407583232/LCIqE-R__400x400.jpg",
            }}
            style={{ width: "100%", height: "100%", borderRadius: 999 }}
          />
        </View>
        <View style={styles.headerMeta}>
          <View style={styles.nameRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.name,
                { color: colors.foreground, fontFamily: fontBold },
              ]}
            >
              Ritesh
            </Text>
            <View style={[styles.proPill, { backgroundColor: "#ffd60a" }]}>
              <Text style={[styles.proPillText, { fontFamily: fontBold }]}>
                PRO
              </Text>
            </View>
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.email,
              { color: colors.muted, fontFamily: fontMedium },
            ]}
          >
            thisismyn07@gmail.com
          </Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.actions}>
        {ACTIONS.map((a) => (
          <ActionRow
            key={a.key}
            action={a}
            colors={colors}
            fontMedium={fontMedium}
            fontRegular={fontRegular}
          />
        ))}
      </View>
    </View>
  );
};

const ActionRow: FC<{
  action: IAction;
  colors: IPalette;
  fontMedium: string | undefined;
  fontRegular: string | undefined;
}> = ({ action, colors, fontMedium, fontRegular }) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionRow,
        { backgroundColor: pressed ? colors.hover : "transparent" },
      ]}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: colors.input }]}>
        <ActionIcon
          sfSymbol={action.sfSymbol}
          ionicon={action.ionicon}
          color={colors.foreground}
        />
      </View>
      <Text
        style={[
          styles.actionLabel,
          { color: colors.foreground, fontFamily: fontMedium },
        ]}
      >
        {action.label}
      </Text>
      {action.trailing ?
        <Text
          style={[
            styles.actionTrailing,
            { color: colors.muted, fontFamily: fontRegular },
          ]}
        >
          {action.trailing}
        </Text>
      : null}
      {isIOS ?
        <SymbolView name="chevron.right" size={9} tintColor={colors.muted} />
      : <Ionicons name="chevron-forward" size={11} color={colors.muted} />}
    </Pressable>
  );
};

export { ProfilePopupBody };

const styles = StyleSheet.create({
  container: {
    minWidth: 268,
    maxWidth: 290,
    padding: 8,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 15,
    color: "#111",
  },
  headerMeta: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    fontSize: 14,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  proPill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    justifyContent: "center",
    alignItems: "center",
  },
  proPillText: {
    fontSize: 8.5,
    color: "#000",
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 11.5,
    marginTop: 1,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 6,
    opacity: 0.6,
  },
  actions: {
    gap: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 9,
  },
  actionIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    flex: 1,
    fontSize: 13,
  },
  actionTrailing: {
    fontSize: 11.5,
  },
  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 8,
    borderRadius: 9,
  },
  signOutText: {
    fontSize: 12.5,
    color: "#ff6b6b",
    letterSpacing: -0.1,
  },
});
